import $ from '../libs/jquery.js';

import {keys, entries, isEmpty, isUndefined} from 'lodash-bound';

import {stopPropagation, humanMsg} from 'utilities';

import {M21, M22} from "../util/svg";

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {plainDOM} from '../libs/jquery';
import {Canvas} from '../artefacts/Canvas';

const {floor} = Math;


const $$values = Symbol('$$values');

export class GlobalBehaviorTool extends Tool {
	
	
	register(states, handlerTypes, condition, getValue) {
		for (let state of states) for (let handlerType of handlerTypes) {
			if (!this[$$values])                     { this[$$values]                     = {} }
			if (!this[$$values][state])              { this[$$values][state]              = {} }
			if (!this[$$values][state][handlerType]) { this[$$values][state][handlerType] = [] }
			this[$$values][state][handlerType].push({ condition, getValue });
		}
	}
	
	
	init({coach}) {
		super.init({ coach, events: ['mouseleave', 'mouseover'] });
	}
	
	activateGlobalBehavior() {} // override
	activateLocalBehavior () {} // override
	
	postInit({coach}) {
		
		/* keeping track of the current cursor */
		let cValue       = '';
		let cState       = '';
		let cHandlerType = null;
		let cHandler     = null;
		const activateGlobalBehavior = (v, s, handler) => {
			if (v::isUndefined()) { return }
			cValue       = v;
			cState       = s;
			cHandler     = handler || null;
			cHandlerType = handler ? handler.handlerType : null;
			this.activateGlobalBehavior({ ...handler, value: cValue });
		};
		const activateLocalBehavior = (v, s, handler) => {
			if (v::isUndefined()) { return }
			cValue       = v;
			cState       = s;
			cHandler     = handler || null;
			cHandlerType = handler ? handler.handlerType : null;
			this.activateLocalBehavior({ ...handler, value: cValue });
		};
		
		function firstAvailable(values, handler) {
			for (let {condition, getValue} of values) {
				if (condition(handler)) { return getValue(handler) }
			}
		}
		
		/* configure the state machine */
		for (let [state, valuesByHandlerType] of this[$$values]::entries()) {
			coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
				[state]: (handler) => {
					for (let [handlerType, values] of valuesByHandlerType::entries()) {
						if (values.length === 0) { continue }
						if (handlerType === '*' || handler && handlerType === handler.handlerType) {
							activateGlobalBehavior(firstAvailable(values, handler), state, handler);
							activateLocalBehavior (firstAvailable(values, handler), state, handler);
						} else if (handlerType === cHandlerType) {
							activateGlobalBehavior(firstAvailable(values, cHandler), state, cHandler);
							activateLocalBehavior (firstAvailable(values, cHandler), state, cHandler);
						}
						this.e('mouseover') // not 'mouseenter'
						    .do(stopPropagation)
							::handleBoxer(handlerType)
							::subscribeDuringState((handler) => {
								activateGlobalBehavior(firstAvailable(values, handler), state, handler);
								activateLocalBehavior (firstAvailable(values, handler), state, handler);
							});
						this.e('mouseleave')
						    .do(stopPropagation)
							::handleBoxer(handlerType)
							::subscribeDuringState((handler) => {
								if (cState === state && cHandlerType === handler.handlerType) {
									activateGlobalBehavior(null, state, handler);
								}
								if (cHandler && cHandler.artefact === handler.artefact) {
									activateLocalBehavior(null, state, handler);
								}
							});
					}
				}
			}), () => this.active);
		}
		
	}
	
}
