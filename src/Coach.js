import {camelCase}   from 'lodash-bound';
import {Observable}  from 'rxjs';
import $             from './libs/jquery.js';

import Machine from './util/Machine';

import {Point2D} from './util/svg';

import {SvgArtefact} from './artefacts/SvgArtefact.js';



const $$domEvents = Symbol('$$domEvents');

export class Coach {
	
	tools = {};
	
	constructor({coordinateSystem} = {}) {
		
		this.coordinateSystem = coordinateSystem;
		if (this.coordinateSystem instanceof SvgArtefact) {
			this.coordinateSystem = this.coordinateSystem.svg.main;
		}
		
		this.stateMachine = new Machine('IDLE');
		
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
					(handler) => { $(this.coordinateSystem).on (e, '.handles *', handler) },
					(handler) => { $(this.coordinateSystem).off(e, '.handles *', handler) }
				),
				Observable.fromEventPattern(
					(handler) => { $(this.coordinateSystem).on (e, handler) },
					(handler) => { $(this.coordinateSystem).off(e, handler) }
				)
			).do(::this.enrichMouseEvent);
		}
	}

	enrichMouseEvent(event) {
		event.controller = $(event.currentTarget).data('boxer-controller');
		event.point = new Point2D({
			x:                event.pageX,
			y:                event.pageY,
			coordinateSystem: this.coordinateSystem
		});//.transformedBy(coach.coordinateSystem.getScreenCTM().inverse());
	}
	
	canvasE  (e) { return Observable.fromEvent($(this.coordinateSystem), e).do(::this.enrichMouseEvent) }
	windowE  (e) { return Observable.fromEvent($(window), e)               .do(::this.enrichMouseEvent) }
	documentE(e) { return Observable.fromEvent($(document), e)             .do(::this.enrichMouseEvent) }
	e        (e) { return this[$$domEvents][e]                                                          }
	
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
