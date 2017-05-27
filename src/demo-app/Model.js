import {ValueTracker, property, flag} from 'utilities';
import chroma from 'chroma-js';
import {isUndefined, pick, parseInt} from 'lodash-bound';
import {uniqueId as _uniqueId} from 'lodash';

export class Model extends ValueTracker {
	
	////////////////////////////////////////////////////////////////////////////
	
	@property() id;
	@property() name;
	@property({ initial: 'white' }) color;
	
	@flag({ initial: false }) deleted;
	@flag({ initial: false }) selected;
	
	////////////////////////////////////////////////////////////////////////////
	
	constructor({id} = {}) {
		super();
		
		// this.setValueTrackerOptions({
		// 	takeUntil: this.p('deleted').filter(v=>!!v) // TODO: put back
		// });
		
		this.id = !id::isUndefined() ? id : _uniqueId()::parseInt();
	}
	
	delete() { this.deleted = true }
	
	toJSON() {
		return {
			'class': this.constructor.name,
			...this::pick('id', 'name', 'color')
		};
	}
	
	static fromJSON(json, {modelClasses} = {}) {
		const cls = modelClasses[json.class];
		const result = new cls();
		result.id    = json.id;
		result.name  = json.name;
		result.color = json.color;
		return result;
	}
	
	////////////////////////////////////////////////////////////////////////////
	
	get contrastingColor() {
		const c = chroma(this.color);
		if (c.luminance() < 0.5) {
			return c.luminance(0.9);
		} else {
			return c.luminance(0.1);
		}
	}
	
	get darkenedColor() {
		return chroma(this.color).darken(2).hex();
	}
	
	////////////////////////////////////////////////////////////////////////////
	
}
