import {ValueTracker, property, flag} from 'utilities';
import chroma from 'chroma-js';

export class Model extends ValueTracker {
	
	@property({ initial: ""      }) name: string;
	
	@property({ initial: 'white' }) color: string;
	
	@flag({ initial: false }) selected;
	
	constructor({name, color} = {}) {
		super();
		if (name)  { this.name  = name  }
		if (color) { this.color = color }
	}
	
	get contrastingColor() {
		const c = chroma(this.color);
		if (c.luminance() < 0.5) {
			return c.luminance(0.9);
		} else {
			return c.luminance(0.1);
		}
	}
	
	get darkenedColor() {
		return chroma(this.color).darken(4).hex();
	}
	
}
