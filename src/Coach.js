import {camelCase, isFunction} from 'lodash-bound';
import assert                  from 'power-assert';
import {Observable}            from './libs/expect-rxjs.js';
import $                       from './libs/jquery.js';
import Machine                 from './util/Machine';
import {Point2D}               from './util/svg';
import {ValueTracker}          from 'utilities';

const $$domEvents   = Symbol('$$domEvents');
const $$tools       = Symbol('$$tools');
const $$initialized = Symbol('$$initialized');


/**
 * The central hub of the artefacts and tools of a boxer canvas.
 * Creating one is among the first steps in using the boxer library.
 */
export class Coach extends ValueTracker {
	
	/**
	 * the main state machine toggling between `'IDLE'` and `'BUSY'`,
	 * used to coordinate between the local state machines of tools
	 * @type {Machine}
	 */
	stateMachine = new Machine('Coach', { state: 'IDLE' });
	
	/**
	 * Create a new `Coach` instance rooted at a specific `Canvas` artefact.
	 * @param options
	 * @param {Canvas} options.root - the canvas making up the root of our boxer svg artefact tree
	 */
	constructor(options) {
		super();
		const {root} = options;
		this.root = root;
		this[$$domEvents] = {};
		
		// /* keep track of canvas offset */
		// this._offset = {
		// 	left: 0,
		// 	top: 0
		// };
		// setInterval(() => {
		// 	this._offset = this.root.svg.main.offset();
		// }, 1000);
	}
	
	/**
	 * Register a new tool. Assumes that the coach has not yet started.
	 * @param {Tool} tool - the new tool
	 * @return {Coach} this coach object
	 */
	addTool(tool) {
		assert(!this[$$initialized], "You can't add tools to a Coach after starting it.");
		this[tool.constructor.name::camelCase()] = tool;
		if (!this[$$tools]) { this[$$tools] = new Set }
		this[$$tools].add(tool);
		tool.init({ coach: this });
		return this;
	}
	
	/**
	 * Activate a given set of registered tools and turn off all others.
	 * @param {Iterable<Tool>} chosenTools - the tools to activate
	 */
	activateExclusiveTools(chosenTools) {
		chosenTools = [...chosenTools];
		for (let tool of this[$$tools]) {
			let makeActive =
				chosenTools.includes(tool)                  ||
				chosenTools.includes(tool.constructor)      ||
				chosenTools.includes(tool.constructor.name) ||
				chosenTools.includes(tool.constructor.name::camelCase());
			if (makeActive !== tool.active) {
				tool.active = makeActive;
			}
		}
	}
	
	/**
	 * Start this coach, indicating that all tools have been registered.
	 */
	start() {
		this[$$initialized] = true;
		for (let tool of this[$$tools]) {
			if (tool.postInit::isFunction()) {
				tool.postInit({ coach: this });
			}
		}
	}
	
	/**
	 * Let the coach know that it should start listening to specific types
	 * of DOM events on artefacts, and to provide a way to subscribe to them.
	 * It uses jQuery's delegation feature, so it is relatively efficient,
	 * and it normalizes event objects and supplies them with additional
	 * quick-access data, like the mouse event coordinates as a `Point2D`.
	 * @param {Array<string>} events - a set of DOM event names, e.g., `'click'`, `'mouseover'`
	 */
	registerArtefactEvent(...events) {
		for (let e of events) {
			if (!this[$$domEvents][e]) {
				this[$$domEvents][e] = Observable.merge(
					Observable.fromEventPattern(
						(fn) => { $(this.root.svg.main).on (e, '.boxer > .handles *', fn) },
						(fn) => { $(this.root.svg.main).off(e, '.boxer > .handles *', fn) }
					),
					Observable.fromEventPattern(
						(fn) => { $(this.root.svg.main).on (e, fn) },
						(fn) => { $(this.root.svg.main).off(e, fn) }
					)
				).do(::this.enrichMouseEvent);
			}
		}
	}
	
	/**
	 * Enrich a mouse event object with a `Point2D` object representing
	 * screen coordinates.
	 * @private
	 * @param {jQuery.Event} event - a jQuery event object
	 */
	enrichMouseEvent(event) {
		event.stopPropagation();
		event.point = new Point2D({
			x:                event.pageX,
			y:                event.pageY,
			coordinateSystem: this.root.svg.main
		});
	}
	
	/**
	 * @param {String} e - the type of event to get a stream of
	 * @returns {Observable} a stream of `e` events on the root canvas element
	 */
	rootE(e) { return Observable.fromEvent($(this.root.svg.main), e).do(::this.enrichMouseEvent) }
	
	/**
	 * @param {String} e - the type of event to get a stream of
	 * @returns {Observable} a stream of `e` events on the `window` DOM element
	 */
	windowE(e) { return Observable.fromEvent($(window), e).do(::this.enrichMouseEvent) }
	
	/**
	 * @param {String} e - the type of event to get a stream of
	 * @returns {Observable} a stream of `e` events on the `document` DOM element
	 */
	documentE(e) { return Observable.fromEvent($(document), e).do(::this.enrichMouseEvent) }
	
	/**
	 * @param {String} e - the type of event to get a stream of
	 * @returns {Observable} a stream of `e` events on any artefact
	 */
	e(e) { return this[$$domEvents][e] }
	
}

/**
 * @return {SvgArtefact} the artefact controller in charge of a given SVG DOM element
 * @param {SVGElement} element - the element for which to get the controller
 */
export function elementController(element) {
	element = $(element instanceof $.Event ? element.target : element); // take an event or an element
	let controller = null;
	do {
		controller = element.data('boxer-controller');
		element = element.parent();
	} while (!controller && element.length > 0);
	return controller;
}


/** @private */
export function getHandler(key) {
	if (this) { return this.handlers[key] }
	return (artefact) => artefact.handlers[key];
}

/**
 * Take an event stream and transform it into a stream of handler information
 * for only specifically requested handler types.
 * @this {Observable<jQuery.Event>}
 * @returns {Observable<Object>} information on relevant boxer handlers
 * @param {string} key - the handler type we're interested in, e.g., `'clickable'`, or `'*'` for all types
 */
export function handleBoxer(key) {
	return this
		.map((event)=> {
			if (event instanceof $.Event) {
				return [event.point, elementController(event), $(event.target).data('boxer-handlers')[key]];
			} else if (event) {
				const controller = event.artefact;
				return [event.point, controller, controller.handlers[key]];
			}
		})
	    .filter(v => key === '*' || !!v[2])
		.map(([point, controller, handlers]) => {
			let originalArtefact = controller;
			handlers = (key === '*' ? {} : handlers);
			return {
				...handlers,
				handlerType: key,
				originalArtefact,
				artefact: handlers && handlers.artefact || originalArtefact,
				point
			}
		});
}
