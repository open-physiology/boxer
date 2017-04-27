import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {entries, values, isUndefined} from 'lodash-bound';

import {ID_MATRIX, SVGMatrix, setCTM, Point2D} from '../util/svg.js';
import {property, flag} from 'utilities';


import {SvgTransformable} from './SvgTransformable.js';

/**
 * Representation of an interactive rectangle in svg space.
 */
export class BoxCorner extends SvgTransformable {
	
	static RADIUS = 15;
	
	@flag({ initial: false }) rounded;

	preCreate(options) {
		super.preCreate(options);
		
		/* set properties if given */
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
			strokeWidth:      'inherit',
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit'
		}).appendTo(this.svg.ink);
		
		const overlayFillPath = $.svg(`<path>`).css({
			fill:            'inherit',
			stroke:          'black',
			strokeWidth:     inkPath.css('stroke-width'),
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
		const s = BoxCorner.RADIUS;
		const rightAngle  = `L 0 0 L`;
		const arcAngle    = `A ${s} ${s}, 0, 0, 0,`;
		const bl          = `0 ${s}`;
		const tr          = `${s} 0`;
		const outerCorner = r => `M ${tr} ${r ? arcAngle : rightAngle} ${bl}`;
		const innerCorner = `M ${bl} L ${tr}`;
		this.p('rounded').subscribe((r) => {
			handlePath     .attr({ d: outerCorner(0)       });
			inkPath        .attr({ d: outerCorner(r)       });
			fillPath       .attr({ d: outerCorner(r)       });
			overlayFillPath.attr({ d: outerCorner(r) + 'Z' });
			overlayInkPath .attr({ d: innerCorner          });
		});
		
	}
	
}
