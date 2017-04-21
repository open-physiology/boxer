import {ValueTracker, property} from 'utilities';
import $, {plainDOM} from '../libs/jquery.js';

import {Observable} from 'rxjs';

import {Point2D} from "../util/svg";

import Machine from "../util/Machine";

import {SvgArtefact} from '../artefacts/SvgArtefact.js';

const $$domEvents = Symbol('$$domEvents');




export default class Tool extends ValueTracker {
	
	@property({ initial: true }) active;
	
	constructor({context, events = []} = {}) {
		super();
		
		this.context = context;
		
		/* set coordinateSystem if given */
		if (context.coordinateSystem) {
			if (context.coordinateSystem instanceof SvgArtefact) {
				context.coordinateSystem = context.coordinateSystem.svg.children;
			}
			this.coordinateSystem = context.coordinateSystem::plainDOM();
		}
		
		if (!context.stateMachine) {
			context.stateMachine = new Machine('IDLE');
		}
		if (!context[$$domEvents]) {
			context[$$domEvents] = {};
		}
		for (let e of events) {
			this.registerArtefactEvent(e);
		}
		context[this.constructor.name] = this;
	}
	
	registerArtefactEvent(e) {
		if (!this.context[$$domEvents][e]) {
			this.context[$$domEvents][e] = Observable.merge(
				Observable.fromEventPattern(
					(handler) => { $(this.context.coordinateSystem).on (e, '.handles *', handler) },
					(handler) => { $(this.context.coordinateSystem).off(e, '.handles *', handler) }
				),
				Observable.fromEventPattern(
					(handler) => { $(this.context.coordinateSystem).on (e, handler) },
					(handler) => { $(this.context.coordinateSystem).off(e, handler) }
				)
			)::enrichMouseEvent(this.context);
		}
	}
	
	rootE  (e)   { return Observable.fromEvent($(this.context.coordinateSystem), e)::enrichMouseEvent(this.context) }
	windowE(e)   { return Observable.fromEvent($(window), e)                       ::enrichMouseEvent(this.context) }
	documentE(e) { return Observable.fromEvent($(document), e)                     ::enrichMouseEvent(this.context) }
	
	e(event) {
		return this.p('active')
			.switchMap(a => a ? this.context[$$domEvents][event] : Observable.never());
	}
	
	
}

function enrichMouseEvent(context) {
	return this.do((event) => {
		event.controller = $(event.currentTarget).data('boxer-controller');
		event.point = new Point2D({
			x:                event.pageX,
			y:                event.pageY,
			coordinateSystem: context.coordinateSystem
		});//.transformedBy(context.coordinateSystem.getScreenCTM().inverse());
	});
}

