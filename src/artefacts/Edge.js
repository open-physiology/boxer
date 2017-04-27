import assert from 'power-assert';
import {Observable} from 'rxjs';

import {isEmpty, merge} from 'lodash-bound';

import {Point2D} from '../util/svg.js';
import {property} from 'utilities';

import {LineSegment} from './LineSegment.js';
import {Glyph}       from './Glyph.js';
import {moveToFront} from '../util/svg';


/**
 * Representation of an interactive edge in svg space, spanning between two glyphs.
 */
export class Edge extends LineSegment {
	
	@property({ isValid: v => v instanceof Glyph }) glyph1;
	@property({ isValid: v => v instanceof Glyph }) glyph2;
	
	preCreate(options = {}) {
		super.preCreate(options);
		
		/* make the line segment ends touch the edges of the glyphs */
		this.lengthen1 = this.lengthen2 = -Glyph.RADIUS;
		
		for (let g of [1, 2]) {
			/* initializing glyphs */
			assert(options[`glyph${g}`]);
			this[`glyph${g}`] = options[`glyph${g}`];
			
			/* moving the line segment when the glyphs move */
			this.p([`glyph${g}?.globalTransformation`], ['root'])
			    .map(([gt, root]) => Point2D.fromMatrixTranslation(gt, root.svg.main))
			    .subscribe( this.p(`point${g}`) );
			
			/* propagate moveToFront  */
			this.e(`glyph${g}.moveToFront`).subscribe( this.e('moveToFront') );
			
			/* as a special exception for Edge, inward moveToFront also brings svg to front */
			// outward moveToFront already does this (see SvgArtefact.js)
			this.e(`glyph${g}.moveToFront`)
				.filter(({direction}) => direction === 'in')
				.subscribe(this.svg.main::moveToFront);
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
		
		/* set glyph handlers */
		for (let g of [1, 2]) {
			this[`glyph${g}`].handler::merge({
				draggable: {
					before: () => {
						// this.svg.main::moveToFront();
						this.handlesActive = false;
					},
					after: () => {
						this.handlesActive = true;
					}
				}
			});
		}
		
		/***/
		super.postCreate(options);
	}
	
}
