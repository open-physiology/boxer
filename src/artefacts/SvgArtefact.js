import assert        from 'power-assert';
import {entries, isEmpty}      from 'lodash-bound';
import $, {applyCSS, plainDOM} from '../libs/jquery.js';

import {Observable} from '../libs/expect-rxjs.js';

import {ID_MATRIX, SVGMatrix, setCTM} from '../util/svg.js';
import {ValueTracker, property, flag, humanMsg, event}       from 'utilities';
import {moveToFront} from '../util/svg';
import {smartMerge} from '../Coach';

const $$handlers = Symbol('$$handlers');


/**
 * Abstract representation of an interactive artefact in svg space.
 */
export class SvgArtefact extends ValueTracker {
	
	@property({ isValid: (v) => (!v || v instanceof SvgArtefact) }) parent;
	@flag({ initial: false })                                       deleted;
	
	
	@event() moveToFrontEvent;
	@event() clickEvent;
	
	@flag({ initial: true }) handlesActive;
	
	static inheritedProperties = {
		strokeDasharray:  'inherit',
		strokeDashoffset: 'inherit',
	    fill:             'inherit',
	    stroke:           'inherit',
		strokeWidth:      'inherit'
	};
	
	/**
	 * @param {SVGMatrix} [options.transformation] - the initial transformation of this artefact
	 */
	constructor(options = {}) {
		super();
		
		this.setValueTrackerOptions({ takeUntil: this.p('deleted').filter(v=>!!v) });
		
		this.preCreate (options);
		this.create    (options);
		this.postCreate(options);
	}
	
	preCreate(options = {}) {
		
		/* set parent if given */
		if (options.parent) { this.parent = options.parent }
		
		/* when parent is deleted, this is deleted */
		this.p('parent.deleted').filter(d=>!!d).take(1).subscribe( this.p('deleted') );
		
		/* set main grouping elements */
		this.svg = { main: options.svg };
		if (!(this.svg.main::plainDOM() instanceof SVGElement)) {
			this.svg.main = $.svg('<g>');
		}
		this.svg.main.addClass(`boxer boxer-${this.constructor.name}`);
		this.svg.ink      = $.svg('<g class="ink">')     .appendTo(this.svg.main);
		this.svg.handles  = $.svg('<g class="handles">') .appendTo(this.svg.main);
		this.svg.children = $.svg('<g class="children">').appendTo(this.svg.main);
		this.svg.overlay  = $.svg('<g class="overlay">') .appendTo(this.svg.main).css({ opacity: 0 });
		this.svg.main.data('boxer-controller', this);
		
		/* move svg on parent change */
		this.p('parent').startWith(null).pairwise().subscribe(([prev, curr]) => {
			if (!!curr) {
				this.svg.main.appendTo(curr.getSvgContainerFor(this));
			} else if (!!prev) {
				this.svg.main.detach();
			}
		});
		
		/* keep track of root */
		this.newProperty('root', {
			source: this.p('parent').switchMap(p => p ? p.p('root') : Observable.of(this))
		});
		
		/* keep track of nesting depth */
		this.newProperty('depth', {
			source: this.p('parent').switchMap(p => p ? p.p('depth').map(d=>d+1) : Observable.of(0)),
			isEqual: () => false, // always re-emit depth when parent changes
			allowSynchronousAccess: true
		});
		
		/* propagate moveToFront event */
		const thisArtefact = this;
		function direction(d)     { return this.filter(({direction}) => (direction === d)) }
		function withParent()     { return this.withLatestFrom(thisArtefact.p('parent')).filter(([v,p])=>!!p) }
		function registerSource() { return this.map((info) => ({ ...info, source: thisArtefact })) }
		function doNotTurnBack()  { return this.filter(info => info.source !== thisArtefact) }
		// send outward-moving moveToFront to parent
		this.e('moveToFront')
			::direction('out')
			::registerSource()
			::withParent()
			.subscribe(([info, p]) => { p.e('moveToFront').next(info) });
		// listen and propagate inward-moving moveToFront
		this.e('parent.moveToFront')
			::doNotTurnBack()
			.subscribe((info) => { this.e('moveToFront').next({ ...info, direction: 'in' }) });
		
		/* shuffle svg to front on moveToFront */
		this.e('moveToFront')
			::direction('out')
			.subscribe(this.svg.main::moveToFront);
		
	}
	
	create(options = {}) {}
	
	postCreate(options = {}) {
		/* what to do when this is deleted */
		this.p('deleted').filter(d=>!!d).take(1).subscribe(() => {
			this.svg.main.remove();
			this.parent = null;
		});
		
		/* add handler stuff that's given with the constructor */
		this.registerHandlers(options.handlers);
		
		/* add handlers */
		this.registerHandlers({
			clickable: {
				artefact: this,
				handle: (val) => { this.e('click').next(val) }
			}
		});
		
		/* set css inheritance chains */
		this.svg.main             .css({ 'pointer-events': 'inherit', ...SvgArtefact.inheritedProperties });
		this.svg.ink              .css({ 'pointer-events': 'none',    ...SvgArtefact.inheritedProperties });
		this.svg.overlay          .css({ 'pointer-events': 'none',                                       });
		this.svg.children         .css({ 'pointer-events': 'inherit', ...SvgArtefact.inheritedProperties });
		this.svg.handles          .css({ 'pointer-events': 'inherit'                                     });
		this.svg.handles.find('*').css({ 'pointer-events': 'inherit'                                     });
		
		/* set category specific styling */
		this.svg.handles.css({
			visibility: 'hidden',
			strokeWidth: 6
		});
		this.svg.ink.css({
			strokeWidth: 2
		});
		
		/* toggle pointer-events for active handles */
		this.p(['parent', 'handlesActive']).subscribe(([parent, active]) => {
			this.svg.main.css({ 'pointer-events': (active ? (!!parent ? 'inherit' : 'all') : 'none') });
		});
		
		/* set css styling if given, which should override any of the stuff above */
		if (options.css) {
			this.setCSS(options.css);
		}
	}
	
	delete() {
		this.p('deleted').next(true);
	}
	
	setCSS(css: Object) {
		this.svg.main::applyCSS(css);
	}
	
	registerHandlers(handlers: Object = {}) {
		if (!this[$$handlers]) {
			this[$$handlers] = {};
			this.svg.handles.find('*').data('boxer-handlers', this[$$handlers]);
		}
		this[$$handlers]::smartMerge(handlers);
	}
	get handlers(): Object {
		if (!this[$$handlers]) {
			this.registerHandlers({});
		}
		return this[$$handlers];
	}
	
	moveToFront() {
		this.e('moveToFront').next({ direction: 'out', source: this });
		this.e('moveToFront').next({ direction: 'in',  source: this });
	}
	
	get depth() {
		if (this.parent) { return this.parent.depth + 1 }
		else             { return 0 }
	} // TODO: ValueTracked doesn't allow synchronous access using .newProperty() yet
	
	closestCommonAncestorWith(other: SvgArtefact): ?SvgArtefact {
		if (this.depth < other.depth) { return other.closestCommonAncestorWith(this) }
		let thisAncestor = this;
		let otherAncestor = other;
		while (thisAncestor.depth > otherAncestor.depth) {
			thisAncestor = thisAncestor.parent;
		}
		while (thisAncestor !== otherAncestor) {
			thisAncestor  = thisAncestor.parent;
			otherAncestor = otherAncestor.parent;
		}
		return thisAncestor;
	}
	
	getSvgContainerFor(artefact) {
		return this.svg.children;
	} // override if necessary
	
}
