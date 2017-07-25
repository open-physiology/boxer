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


export class Coach extends ValueTracker {
	
	stateMachine = new Machine('Coach', { state: 'IDLE' });
	
	constructor({root} = {}) {
		super();
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
	
	addTool(tool) {
		assert(!this[$$initialized], "You can't add tools to a Coach after starting it.");
		this[tool.constructor.name::camelCase()] = tool;
		if (!this[$$tools]) { this[$$tools] = new Set }
		this[$$tools].add(tool);
		tool.init({ coach: this });
		return this;
	}
	
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
	
	start() {
		this[$$initialized] = true;
		for (let tool of this[$$tools]) {
			if (tool.postInit::isFunction()) {
				tool.postInit({ coach: this });
			}
		}
	}
	
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

	enrichMouseEvent(event) {
		event.stopPropagation();
		event.point = new Point2D({
			x:                event.pageX,
			y:                event.pageY,
			coordinateSystem: this.root.svg.main
		});
	}
	
	rootE    (e) { return Observable.fromEvent($(this.root.svg.main), e).do(::this.enrichMouseEvent) }
	windowE  (e) { return Observable.fromEvent($(window), e)            .do(::this.enrichMouseEvent) }
	documentE(e) { return Observable.fromEvent($(document), e)          .do(::this.enrichMouseEvent) }
	e        (e) { return this[$$domEvents][e]                                                       }
	
}


export function elementController(element) {
	element = $(element instanceof $.Event ? element.target : element); // take an event or an element
	let controller = null;
	do {
		controller = element.data('boxer-controller');
		element = element.parent();
	} while (!controller && element.length > 0);
	return controller;
}


export function getHandler(key) {
	if (this) { return this.handlers[key] }
	return (artefact) => artefact.handlers[key];
}


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
