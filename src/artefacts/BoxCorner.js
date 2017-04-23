import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {entries, values, isUndefined} from 'lodash-bound';

import {ID_MATRIX, SVGMatrix, setCTM, Point2D} from '../util/svg.js';
import {property, flag} from 'utilities';
import {_isNonNegative} from '../util/misc.js';


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
	
	create(options = {}) {
		super.create(options);
		
		const handlePath = $.svg(`<path>`).css({
			strokeWidth: 4
		}).appendTo(this.svg.handles);
		
		const fillPath = $.svg(`<path>`).css({
			fill:       'inherit',
			strokeWidth: 0
		}).appendTo(this.svg.ink);
		
		const inkPath = $.svg(`<path>`).css({
			fill:             'transparent',
			stroke:           'inherit',
			strokeWidth:       2,
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit'
		}).appendTo(this.svg.ink);
		
		// const overlayBgInkPath = $.svg(`<path>`).css({
		// 	fill:             'transparent',
		// 	stroke:           'black',
		// 	strokeWidth:       2,
		// 	strokeDasharray:  'none'
		// }).appendTo(this.svg.overlay);
		
		const overlayFillPath = $.svg(`<path>`).css({
			fill:            'inherit',
			stroke:          'black',
			strokeWidth:      2,
			strokeDasharray: 'none'
		}).appendTo(this.svg.overlay);
		
		const overlayInkPath = $.svg(`<path>`).css({
			fill:             'transparent',
			stroke:           'inherit',
			strokeWidth:      'inherit',
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit'
		}).appendTo(this.svg.overlay);
		
		/* react to resizing and roundedness-toggling */
		this.p(['size', 'rounded']).subscribe(([s, r]) => {
			const corner      = r ? (`A ${s} ${s}, 0, 0, 0,`) : (`L 0 0 L`);
			const x           = Math.sqrt(s*s/8);
			const insideCurve = `A ${s/2} ${s/2}, 0, 0, 1, ${x} ${s/2+x} L ${s/2+x} ${x} A ${s/2} ${s/2}, 0, 0, 1, ${s} 0`;
			$(handlePath).add(fillPath).attr({ d: `M ${s} 0 ${corner} 0 ${s} ${insideCurve} Z` });
			overlayFillPath.attr({ d: `M ${s} 0 ${corner} 0 ${s} L ${s} 0 Z` });
			overlayInkPath .attr({ d: `M 0 ${s} L ${s} 0` });
			inkPath        .attr({ d: `M ${s} 0 ${corner} 0 ${s}` });
		});
		
	}
	
}
