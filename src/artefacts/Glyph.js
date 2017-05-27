import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {entries, values, isUndefined, isEmpty} from 'lodash-bound';

import {ID_MATRIX, SVGMatrix, setCTM, Point2D} from '../util/svg.js';
import {property} from 'utilities';


import {SvgTransformable} from './SvgTransformable.js';

/**
 * Representation of an interactive glyph in svg space.
 */
export class Glyph extends SvgTransformable {
	
	@property({ initial: 6 }) radius;
	
	preCreate(options) {
		super.preCreate(options);
		
	}
	
	create(options = {}) {
		super.create(options);
		
		const handle = $.svg('<circle>').attr({
			// r: Glyph.RADIUS + 2,
			cx: 0, cy: 0,
			strokeWidth: 'inherit',
		}).appendTo(this.svg.handles);
		
		const ink = $.svg('<circle>').attr({
			// r: Glyph.RADIUS,
			cx: 0, cy: 0,
			stroke:      'inherit',
			fill:        'inherit'
		}).appendTo(this.svg.ink);
		
		const overlay = $.svg('<circle>').attr({
			// r: Glyph.RADIUS,
			cx: 0, cy: 0,
			stroke:           'inherit',
			strokeWidth:      'inherit',
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit',
			fill:             'transparent'
		}).appendTo(this.svg.overlay);
		
		this.p('radius').subscribe((r) => {
			handle.attr('r', r + 2);
			$().add(ink).add(overlay).attr('r', r);
		});
		
		
	}
	
	postCreate(options = {}) {
		/* set standard handlers */
		this.registerHandlers({
			movable:       { artefact: this },
			highlightable: {
				artefact: this,
				effect: { elements: this.svg.overlay }
			},
			deletable: {
				artefact: this
			},
			drawzone: {
				artefact: this
			}
		});
		
		/***/
		super.postCreate(options);
	}
	
}
