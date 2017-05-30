import $ from '../libs/jquery.js';

import {Observable} from '../libs/expect-rxjs.js';

import {keys, entries, values, isEmpty, isUndefined} from 'lodash-bound';

import {stopPropagation, humanMsg} from 'utilities';

import {M21, M22} from "../util/svg";

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {plainDOM} from '../libs/jquery';
import {Canvas} from '../artefacts/Canvas';

const {floor} = Math;

const $$values = Symbol('$$values');

export class GlobalBehaviorTool extends Tool {
	
	init({coach}) {
		super.init({ coach, events: ['mouseleave', 'mouseover'] });
	}
	
	register(condition, patternStream) {
		let active;
		if (condition instanceof Tool) {
			active = condition.p('active');
		} else if (condition instanceof Observable) {
			active = condition;
		} else {
			active = Observable.of(true);
		}
		if (!this[$$values]) { this[$$values] = [] }
		this[$$values].push(patternStream
			.withLatestFrom(active, (v, a) => a ? v : null)
			.catch(::console.error)
			.startWith(null));
	}
	
	deactivateBehavior() {} // override
	activateBehavior  () {} // override
	mergeValues(vals) {
		// console.warn(humanMsg`
		// 	${this.constructor.name}
		// 	got multiple values: ${vals}.
		// 	We're choosing just one.
		// `); // TODO: reinstate warning when the main problem is fixed
		return vals[0];
	} // override
	
	postInit({coach}) {
		
		let currentValue = null;
		
		Observable.combineLatest(...(this[$$values] || []))
			// .debounceTime(0) // <-- to skip inconsistent intermediate combination states
			.subscribe((vals) => { try {
			
				vals = vals.filter(v=>!!v);
				
				let newValue;
				if (vals.length === 0) {
					newValue = null;
				} else {
					if (vals.length > 1) { newValue = this.mergeValues(vals) }
					else                 { newValue = vals[0]                }
				}
				
				if (currentValue) { this.deactivateBehavior(currentValue) }
				if (newValue)     { this.activateBehavior(newValue)       }
				
				currentValue = newValue;
					
			} catch (err) { console.error(err) }}, ::console.error);
		
	}
	
}














// export class GlobalBehaviorTool extends Tool {
//
//
// 	register(states, handlerTypes, condition, getValue) {
// 		for (let state of states) for (let handlerType of handlerTypes) {
// 			if (!this[$$values])                     { this[$$values]                     = {} }
// 			if (!this[$$values][state])              { this[$$values][state]              = {} }
// 			if (!this[$$values][state][handlerType]) { this[$$values][state][handlerType] = [] }
// 			this[$$values][state][handlerType].push({ condition, getValue });
// 		}
// 	}
//
//
// 	init({coach}) {
// 		super.init({ coach, events: ['mouseleave', 'mouseover'] });
// 	}
//
// 	activateGlobalBehavior() {} // override
// 	activateLocalBehavior () {} // override
//
// 	postInit({coach}) {
//
// 		/* keeping track of the current cursor */
// 		let cValue       = '';
// 		let cState       = '';
// 		let cHandlerType = null;
// 		let cHandler     = null;
// 		const activate = (v, s, handler, methods = [
// 			'activateGlobalBehavior',
// 		    'activateLocalBehavior'
// 		]) => {
// 			if (v::isUndefined()) { return }
// 			cValue       = v;
// 			cState       = s;
// 			cHandler     = handler || null;
// 			cHandlerType = handler ? handler.handlerType : null;
// 			for (let method of methods) {
// 				this[method]({ ...handler, value: cValue });
// 			}
// 		};
//
// 		function firstAvailable(values, handler) {
// 			for (let {condition, getValue} of values) {
// 				if (condition(handler)) { return getValue(handler) }
// 			}
// 		}
//
// 		/* configure the state machine */
// 		for (let [state, valuesByHandlerType] of this[$$values]::entries()) {
// 			coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
// 				[state]: (handler) => {
// 					for (let [handlerType, values] of valuesByHandlerType::entries()) {
// 						if (values.length === 0) { continue }
// 						if (handlerType === '*' || handler && handlerType === handler.handlerType) {
// 							activate(firstAvailable(values, handler), state, handler);
// 						} else if (handlerType === cHandlerType) {
// 							activate(firstAvailable(values, cHandler), state, cHandler);
// 						}
// 						this.e('mouseover') // not 'mouseenter'
// 						    .do(stopPropagation)
// 							::handleBoxer(handlerType)
// 							::subscribeDuringState((handler) => {
// 								activate(firstAvailable(values, handler), state, handler);
// 							});
// 						this.e('mouseleave')
// 						    .do(stopPropagation)
// 							::handleBoxer(handlerType)
// 							::subscribeDuringState((handler) => {
// 								if (cState === state && cHandlerType === handler.handlerType) {
// 									activate(null, state, handler, ['activateGlobalBehavior']);
// 								}
// 								if (cHandler && cHandler.artefact === handler.artefact) {
// 									activate(null, state, handler, ['activateLocalBehavior']);
// 								}
// 							});
// 					}
// 				}
// 			}), () => this.active);
// 		}
//
// 	}
//
// }
