import {isEmpty} from 'lodash-bound';

import {Point2D} from '../util/svg.js';
import {property} from 'utilities';

import {LineSegment} from './LineSegment.js';
import {Glyph}       from './Glyph.js';


/**
 * Representation of an interactive edge in svg space, spanning between two glyphs.
 */
export class Edge extends LineSegment {
	
	@property({ isValid: v => v instanceof Glyph }) glyph1;
	@property({ isValid: v => v instanceof Glyph }) glyph2;
	
	preCreate(options = {}) {
		super.preCreate(options);
		
		/* initialize endpoint glyphs */
		if (options.glyph1) { this.glyph1 = options.glyph1 }
		if (options.glyph2) { this.glyph2 = options.glyph2 }
		
		/* make the line segment ends touch the edges of the glyphs */
		this.lengthen1 = this.lengthen2 = -Glyph.RADIUS;
		
		/* smoothly transitioning to a new coordinateSystem */
		for (let g of [1, 2]) {
			this.p([`glyph${g}.coordinateSystem`, `glyph${g}.transformation`])
			    .map(([cs, t]) => Point2D.fromMatrixTranslation(t, cs))
			    .subscribe(this.p(`point${g}`));
		}
	}
	
	postCreate(options = {}) {
		/* set standard handler */
		if (this.handler::isEmpty()) {
			this.handler = {
				highlightable: {
					artefact: this,
					effect: { elements: this.svg.overlay }
				}
			};
		}
		
		/***/
		super.postCreate(options);
	}
	
}
