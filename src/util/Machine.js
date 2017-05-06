import {entries, isArray, isUndefined, isFunction, isString, constant, toPairs} from 'lodash-bound';
import {ValueTracker, property} from 'utilities';

export default class Machine extends ValueTracker {
	
	@property({ initial: null }) state;
	
	name          = null;
	subscriptions = [];
	data          = null;
	
	constructor(name, {state, data, log}) {
		super();
		this.name  = name;
		this.state = state;
		this.data  = data;
		if (log === true)         { this.log = ::console.info }
		else if (log::isString()) { this.log = ::console[log] }
		else                      { this.log = ()=>{}         }
	}
	
	link(...links) {
		if (!links[0]::isArray()) { links = [links] }
		for (let [localState1, otherState, localState2] of links) {
			this.extend(({ enterState }) => ({
				[localState1]: () => {
					otherState::enterState(localState2)
				}
			}));
		}
		/* return machine itself */
		return this;
	}
	
	extend(descFn, runCondition = ()=>true) {
		/* define bound convenience functions */
		const thisMachine = this;
		const boundFunctions = {
			enterState(nextState, data) {
				if (this::isUndefined()) {
					return thisMachine.enterState(nextState, data);
				} else {
					return this::(boundFunctions.subscribeDuringState)((data) => {
						thisMachine.enterState(nextState, data);
					});
				}
			},
			subscribeDuringState(...args) {
				const sub = this.subscribe(...args);
				thisMachine.subscriptions.push(sub);
				return sub;
			}
		};
		/* extend descriptions */
		let result = descFn(boundFunctions);
		for (let [key, fn] of result::toPairs()) {
			if (this[key]::isUndefined()) {
				this[key] = this.newEvent(key);
			}
			this.e(key).filter(runCondition).subscribe((data) => {
				this.enterSpecifiedState(fn);
			});
		}
		/* run if it says something about the current state */
		if (this.state in result && runCondition()) {
			this.enterSpecifiedState(result[this.state]);
		}
		/* return machine itself */
		return this;
	}
	
	unsubscribe() {
		for (let sub of this.subscriptions.reverse()) {
			sub.unsubscribe();
		}
		this.subscriptions = [];
	}
	
	enterState(state, data) {
		this.unsubscribe();
		this.log(`${this.name} - entering state: '${state}'`, [data]);
		this.state = state;
		this.data  = data;
		this.e(state).next(data);
	}
	
	enterSpecifiedState(specifiedStateFn) {
		let specifiedState = specifiedStateFn(this.data);
		if (specifiedState::isUndefined()) { specifiedState = []               }
		if (!specifiedState::isArray())    { specifiedState = [specifiedState] }
		this.subscriptions.push(...specifiedState);
	}
	
};
