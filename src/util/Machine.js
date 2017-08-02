import {isArray, isUndefined, isString, toPairs} from 'lodash-bound';
import {ValueTracker, property} from 'utilities';


/**
 * A finite state machine in which state transitions are controlled by
 * observables which are only active in specific states.
 */
export default class Machine extends ValueTracker {
	
	/**
	 * the current state
	 * @type {string}
	 */
	@property({ initial: null }) state;
	
	/**
	 * the data belonging to the current state
	 * @type {*}
	 */
	@property({ initial: null }) data;
	
	/**
	 * the name of this state machine, used for log output
	 * @type {?string}
	 */
	name = null;
	
	/**
	 * the currently active (state-specific) observable subscriptions
	 * @type {Array<Rx.Subscription>}
	 * @private
	 */
	_subscriptions = [];
	
	/**
	 * Create a new finite state machine.
	 * @param {string} name - the name of the state machine
	 * @param {Object} options
	 * @param {string} options.state - the initial state
	 * @param {*}      options.data  - the initial state data
	 * @param {?Function|true} options.log   - the function to which to record log messages
	 */
	constructor(name, options) {
		super();
		const {state, data, log} = options;
		this.name  = name;
		this.state = state;
		this.data  = data;
		if (log === true)         { this.log = ::console.info }
		else if (log::isString()) { this.log = ::console[log] }
		else                      { this.log = ()=>{}         }
	}
	
	/**
	 * a description of how arrival to a certain state in some other machine leads to a specific state transition in this machine;
	 * the format is `['stateBefore', otherMachine.e('newState'), 'stateAfter']`
	 * @typedef {[string, Observable, string]} MachineLink
	 */
	
	/**
	 * Link a state transition in one machine to a state transition in another.
	 * @param {...(Array<MachineLink>|MachineLink)} links
	 * @return {Machine}
	 */
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
	
	/**
	 * Extend this machine with additional states, behavior and/or transitions.
	 * @param {Function} descFn - a function that should return an object mapping state-names
	 *                            to functions that may (asynchronously, conditionally) initiate
	 *                            new state transitions in turn. It is passed an object with the
	 *                            `enterState` and `subscribeDuringState`. Use the former to enter
	 *                            new states (can also be bound to an observable). Bind the latter
	 *                            to an `Observable` instead of using `.subscribe` from within a
	 *                            machine state, so it is automatically unsubscribed at a state-
	 *                            transition.
	 * @param {function (): boolean} [runCondition] - a function that should dynamically indicate
	 *                                                whether the machine is currently active;
	 *                                                if omitted, assumes the machine is always active
	 */
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
				thisMachine._subscriptions.push(sub);
				return sub;
			}
		};
		/* extend descriptions */
		let result = descFn(boundFunctions);
		let subscribers = [];
		for (let [key, fn] of result::toPairs()) {
			if (this[key]::isUndefined()) {
				this[key] = this.newEvent(key);
			}
			const subscriber = this.e(key).filter(runCondition).subscribe((data) => {
				this._runStateSpecificCode(fn);
			});
			subscribers.push(subscriber);
		}
		/* run if it says something about the current state */
		if (this.state in result && runCondition()) {
			this._runStateSpecificCode(result[this.state]);
		}
		/* return a way to undo the extension */
		return () => {
			for (const sub of subscribers) {
				sub.unsubscribe();
			}
		};
	}
	
	/**
	 * Unsubscribe from all currently registered `Observable` subscriptions.
	 */
	unsubscribe() {
		for (let sub of this._subscriptions.reverse()) {
			sub.unsubscribe();
		}
		this._subscriptions = [];
	}
	
	/**
	 * Enter a new machine state.
	 * @param {string} state - the new state
	 * @param {*}      data  - data to send to the new state
	 */
	enterState(state, data) {
		this.unsubscribe();
		this.log(`${this.name} - entering state: '${state}'`, [data]);
		[this.state, this.data] = [state, data];
		this.e(state).next(data);
	}
	
	/**
	 * Run the code associated with transition to some specific state.
	 * Running it through this method keeps track of subscriptions returned from it.
	 * @param {function(*):(void|Rx.Subscription|Array<Rx.Subscription>)} specifiedStateFn - the code to run
	 * @private
	 */
	_runStateSpecificCode(specifiedStateFn) {
		let newSubscriptions = specifiedStateFn(this.data);
		if (newSubscriptions::isUndefined()) { newSubscriptions = []                 }
		if (!newSubscriptions::isArray())    { newSubscriptions = [newSubscriptions] }
		this._subscriptions.push(...newSubscriptions);
	}
	
};
