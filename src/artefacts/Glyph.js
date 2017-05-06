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
	
	static RADIUS = 10;

	preCreate(options) {
		super.preCreate(options);
		
	}
	
	create(options = {}) {
		super.create(options);
		
		$.svg('<circle>').attr({
			r: Glyph.RADIUS, cx: 0, cy: 0,
			strokeWidth: 'inherit',
		}).appendTo(this.svg.handles);
		
		$.svg('<circle>').attr({
			r: Glyph.RADIUS, cx: 0, cy: 0,
			stroke:      'inherit',
			fill:        'inherit'
		}).appendTo(this.svg.ink);
		
		$.svg('<circle>').attr({
			r: Glyph.RADIUS, cx: 0, cy: 0,
			stroke:           'inherit',
			strokeWidth:      'inherit',
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit',
			fill:             'transparent'
		}).appendTo(this.svg.overlay);
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
			}
		});
		
		/***/
		super.postCreate(options);
	}
	
}
