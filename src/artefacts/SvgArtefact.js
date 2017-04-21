import assert        from 'power-assert';
import {entries, isEmpty}      from 'lodash-bound';
import $, {applyCSS, plainDOM} from '../libs/jquery.js';

import {ID_MATRIX, SVGMatrix, setCTM} from '../util/svg.js';
import {ValueTracker, property, flag}       from 'utilities';

const $$handler = Symbol('$$handler');


/**
 * Abstract representation of an interactive artefact in svg space.
 */
export class SvgArtefact extends ValueTracker {
	
	@property({ initial: null, transform(value) {
		if (value instanceof SvgArtefact) {
			value = value.svg.children;
		}
		return value::plainDOM();
	} }) coordinateSystem;
	
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
		
		/* set coordinateSystem if given */
		if (options.coordinateSystem) { this.coordinateSystem = options.coordinateSystem }
		
		/* set main grouping elements */
		this.svg = { main: options.svg };
		if (!(this.svg.main::plainDOM() instanceof SVGElement)) {
			this.svg.main = $.svg('<g>');
		}
		this.svg.main.addClass(`boxer boxer-${this.constructor.name}`);
		this.svg.ink      = $.svg('<g class="ink">')     .appendTo(this.svg.main);
		this.svg.handles  = $.svg('<g class="handles">') .appendTo(this.svg.main);
		this.svg.children = $.svg('<g class="children">').appendTo(this.svg.main);
		this.svg.main.data('boxer-controller', this);
		
		/* changing coordinateSystem */
		this.p('coordinateSystem').subscribe(::this.svg.main.appendTo);
		
	}
	
	create(options = {}) {}
	
	postCreate(options = {}) {
		/* set css styling if given */
		if (options.style) {
			this.setStyle(options.style);
		}
		
		/* set handler if given */
		if (this.handler::isEmpty() && options.handler) {
			this.handler = options.handler;
		}
		
		/* set pointer-events property */
		this.svg.ink              .css({ 'pointer-events': 'none'    });
		this.svg.children         .css({ 'pointer-events': 'inherit' });
		this.svg.handles          .css({ 'pointer-events': 'inherit' });
		this.svg.handles.find('*').css({ 'pointer-events': 'inherit' });
		this.p(['coordinateSystem', 'handlesActive']).subscribe(([parent, active]) => {
			this.svg.main.css({ 'pointer-events': (active ? (!!parent ? 'inherit' : 'all') : 'none') });
		});
		
		/* always make handles invisible, but present */
		this.svg.handles.find('*').css({ visibility: 'hidden' });
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
	
}
