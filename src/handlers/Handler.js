import {camelCase, mergeWith, isFunction, entries} from 'lodash-bound';
import {match} from 'utilities';


export class Handler {
	
	static parameterTypes = {
		'accept': {
			merge: (a,b) => a && b // conjunctive
		}
	};
	
	static merge(key) {
		return this.parameterTypes[key]
	        && this.parameterTypes[key].merge
			|| (a => a);
	}
	
	constructor() {
	}
	
	
	register(obj) {
		this::mergeWith(obj, (val1, val2, key) => {
			if (val1::isFunction()) {
				const pred = Handler.merge(key);
				return (...args) => pred(this::val1(...args), this::val2(...args));
			}
		});
	}
	
}
