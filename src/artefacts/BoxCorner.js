import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {entries, values, isUndefined} from 'lodash-bound';

import {ID_MATRIX, SVGMatrix, setCTM, Point2D} from '../util/svg.js';
import {property, flag} from 'utilities';
import {_isNonNegative} from '../util/misc.js';

const {max} = Math;

import {SvgTransformable                } from './SvgTransformable.js';
import {CORNER_RADIUS, DEFAULT_INK_COLOR} from './Box.js';

/**
 * Representation of an interactive rectangle in svg space.
 */
export class BoxCorner extends SvgTransformable {
	
	@property({ isValid: _isNonNegative, initial: CORNER_RADIUS }) size;
	@property({ isValid: _isBoolean,     initial: false })         rounded;

	preCreate(options) {
		super.preCreate(options);
		
		/* set properties if given */
		if (!options.size   ::isUndefined()) { this.size    = options.size    }
		if (!options.rounded::isUndefined()) { this.rounded = options.rounded }
	}
	
	create() {
		
		const handlePath = $.svg('<path>').css({
			strokeWidth: 4
		}).appendTo(this.svg.handles);
		
		const inkPath = $.svg('<path>').css({
			fill:       DEFAULT_INK_COLOR,
			stroke:     'black',
			strokeWidth: 2
		}).appendTo(this.svg.ink);
		
		/* react to resizing and roundedness-toggling */
		this.p(['size', 'rounded']).subscribe(([s, r]) => {
			const cornerPath = r ? (`A ${s} ${s}, 0, 0, 1, ${s} 0`) : (`L 0 0 L ${s} 0`);
			handlePath.attr({ d: `M 0 ${s} ${cornerPath} A ${2*s} ${2*s}, 0, 0, 1, 0 ${s} Z` });
			inkPath   .attr({ d: `M 0 ${s} ${cornerPath}` });
		});
		
	}
	
}
