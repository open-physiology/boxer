import {camelCase}   from 'lodash-bound';
import {Observable}  from 'rxjs';
import $             from './libs/jquery.js';

import Machine from './util/Machine';

import {Point2D} from './util/svg';

import {SvgArtefact} from './artefacts/SvgArtefact.js';


const $$domEvents = Symbol('$$domEvents');

export class Coach {
	
	tools        = {};
	stateMachine = new Machine('IDLE');
	
	constructor({root} = {}) {
		this.root = root;
		this[$$domEvents] = {};
	}
	
	addTool(tool) {
		this[tool.constructor.name::camelCase()] = tool;
		tool.init({ coach: this });
	}
	
	registerArtefactEvent(e) {
		if (!this[$$domEvents][e]) {
			this[$$domEvents][e] = Observable.merge(
				Observable.fromEventPattern(
					(handler) => { $(this.root.svg.main).on (e, '.boxer > .handles *', handler) },
					(handler) => { $(this.root.svg.main).off(e, '.boxer > .handles *', handler) }
				),
				Observable.fromEventPattern(
					(handler) => { $(this.root.svg.main).on (e, handler) },
					(handler) => { $(this.root.svg.main).off(e, handler) }
				)
			).do(::this.enrichMouseEvent);
		}
	}

	enrichMouseEvent(event) {
		event.controller = $(event.currentTarget).data('boxer-controller');
		event.point = new Point2D({
			x:                event.pageX,
			y:                event.pageY,
			coordinateSystem: this.root.svg.main
		});//.transformedBy(this.root.svg.children::plainDOM().getScreenCTM().inverse());
	}
	
	canvasE  (e) { return Observable.fromEvent($(this.root.svg.main), e).do(::this.enrichMouseEvent) }
	windowE  (e) { return Observable.fromEvent($(window), e)            .do(::this.enrichMouseEvent) }
	documentE(e) { return Observable.fromEvent($(document), e)          .do(::this.enrichMouseEvent) }
	e        (e) { return this[$$domEvents][e]                                                       }
	
}

export function handleBoxer(key) {
	return this
		.map(event => [event, $(event.target).data('boxer-handler')[key]])
	    .filter(v=>!!v[1])
		.map(([event, handler]) => {
			
			let element = $(event.target);
			let originalArtefact = null;
			do {
				originalArtefact = element.data('boxer-controller');
				element = element.parent();
			} while (!originalArtefact);
			
			return {
				...handler,
				originalArtefact,
				point: event.point
			}
		});
}
