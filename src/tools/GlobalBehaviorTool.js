import {Observable} from '../libs/expect-rxjs.js';
import Tool from './Tool';

const {floor} = Math;

const $$values = Symbol('$$values');

/**
 * An abstract class for defining tools that activate or deactivate
 * exclusive behaviors on screen based on observables.
 */
export class GlobalBehaviorTool extends Tool {
	
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
