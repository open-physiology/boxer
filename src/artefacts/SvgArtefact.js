import assert        from 'power-assert';
import {entries, isEmpty}      from 'lodash-bound';
import $, {applyCSS, plainDOM} from '../libs/jquery.js';

import {Observable} from 'rxjs';

import {ID_MATRIX, SVGMatrix, setCTM} from '../util/svg.js';
import {ValueTracker, property, flag, humanMsg, event}       from 'utilities';
import {moveToFront} from '../util/svg';

const $$handler = Symbol('$$handler');


/**
 * Abstract representation of an interactive artefact in svg space.
 */
export class SvgArtefact extends ValueTracker {
	
	@property({ initial: null, isValid(v) { return !v || v instanceof SvgArtefact } }) parent;
	
	@event() moveToFrontEvent;
	
	@flag({ initial: true }) handlesActive;
	
	/**
	 * @param {SVGMatrix} [options.transformation] - the initial transformation of this artefact
	 */
	constructor(options = {}) {
		super();
		
		this.preCreate (options);
		this.create    (options);
		this.postCreate(options);
	}
	
	preCreate(options = {}) {
		
		/* set parent if given */
		if (options.parent) { this.parent = options.parent }
		
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
				this.svg.main.appendTo(curr.svg.children);
			} else if (!!prev) {
				this.svg.main.detach();
			}
		});
		
		/* keep track of root */
		this.newProperty('root', {
			source: this.p('parent').switchMap(p => p ? p.p('root') : Observable.of(this))
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
		/* set handler if given */
		if (this.handler::isEmpty() && options.handler) {
			this.handler = options.handler;
		}
		
		/* set css inheritance chains */
		const inheritedProperties = {
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit',
		    fill:             'inherit',
		    stroke:           'inherit',
			strokeWidth:      'inherit'
		};
		this.svg.main             .css({ 'pointer-events': 'inherit', ...inheritedProperties });
		this.svg.ink              .css({ 'pointer-events': 'none',    ...inheritedProperties });
		this.svg.overlay          .css({ 'pointer-events': 'none',                           });
		this.svg.children         .css({ 'pointer-events': 'inherit', ...inheritedProperties });
		this.svg.handles          .css({ 'pointer-events': 'inherit'                         });
		this.svg.handles.find('*').css({ 'pointer-events': 'inherit'                         });
		
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
		if (options.style) {
			this.setStyle(options.style);
		}
	}
	
	setStyle(style: Object) {
		this.svg.main::applyCSS(style);
	}
	
	set handler(handler: Object) {
		this.svg.handles.find('*').data('boxer-handler', handler);
		this[$$handler] = handler;
	}
	get handler(): Object {
		return this[$$handler] || {};
	}
	
	moveToFront() {
		this.e('moveToFront').next({ direction: 'out', source: this });
	}
	
}
