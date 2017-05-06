import assert from 'power-assert';
import {Observable} from 'rxjs';

import {isEmpty} from 'lodash-bound';

import {Point2D} from '../util/svg.js';
import {property} from 'utilities';

import {LineSegment} from './LineSegment.js';
import {Glyph}       from './Glyph.js';
import {moveToFront} from '../util/svg';
import {smartMerge} from '../Coach';


/**
 * Representation of an interactive edge in svg space, spanning between two glyphs.
 */
export class Edge extends LineSegment {
	
	@property({ isValid: v => v instanceof Glyph }) glyph1;
	@property({ isValid: v => v instanceof Glyph }) glyph2;
	
	preCreate(options = {}) {
		super.preCreate({
			lengthen1: -Glyph.RADIUS,
			lengthen2: -Glyph.RADIUS,
			...options
		});
		
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
		
		/* set standard handlers */
		this.registerHandlers({
			highlightable: {
				artefact: this,
				effect: { elements: this.svg.overlay }
			},
			deletable: {
				artefact: this
			}
		});
		
		/* delete this when either glyph is deleted */
		Observable.merge(
			this.p('glyph1.deleted').filter(d=>!!d),
			this.p('glyph2.deleted').filter(d=>!!d)
		).take(1).subscribe( this.p('deleted') );
		
		/* set glyph handlers */
		const handlers = {
			movable: {
				before: () => { this.handlesActive = false },
				after:  () => { this.handlesActive = true  }
			}
		};
		this.glyph1.registerHandlers(handlers);
		this.glyph2.registerHandlers(handlers);
		
		/***/
		super.postCreate(options);
	}
	
}
