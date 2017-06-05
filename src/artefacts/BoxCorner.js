import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {entries, values, isUndefined} from 'lodash-bound';

import {ID_MATRIX, SVGMatrix, setCTM, Point2D} from '../util/svg.js';
import {property, flag, ValueTracker} from 'utilities';


import {SvgTransformable} from './SvgTransformable.js';

/**
 * Representation of a Box corner.
 */
// export class BoxCorner extends SvgTransformable {
export class BoxCorner extends ValueTracker {
	
	static RADIUS = 15;
	
	@flag({ initial: false }) rounded;

	// preCreate(options) {
	// 	super.preCreate(options);
	//
	// 	/* set properties if given */
	// 	if (!options.rounded::isUndefined()) { this.rounded = options.rounded }
	// }
	//
	// create(options = {}) {
	// 	super.create(options);
	//
	// 	const handlePath = $.svg(`<path>`).css({
	// 		strokeWidth: 'inherit',
	// 	}).appendTo(this.svg.handles);
	//
	// 	const inkPath = $.svg(`<path>`).css({
	// 		fill:             'transparent',
	// 		stroke:           'inherit',
	// 		strokeWidth:      'inherit',
	// 		strokeDasharray:  'inherit',
	// 		strokeDashoffset: 'inherit'
	// 	}).appendTo(this.svg.ink);
	//
	// 	const overlayFillPath = $.svg(`<path>`).css({
	// 		fill:            'inherit',
	// 		stroke:          'black',
	// 		strokeDasharray: 'none'
	// 	}).appendTo(this.svg.overlay);
	//
	// 	const overlayStrokePath = $.svg(`<path>`).css({
	// 		fill:             'transparent',
	// 		stroke:           'inherit',
	// 		strokeWidth:      'inherit',
	// 		strokeDasharray:  'inherit',
	// 		strokeDashoffset: 'inherit'
	// 	}).appendTo(this.svg.overlay);
	//
	// 	/* react to resizing and roundedness-toggling */
	// 	const s = BoxCorner.RADIUS;
	// 	const rightAngle  = `L 0 0 L`;
	// 	const arcAngle    = `A ${s} ${s}, 0, 0, 0,`;
	// 	const bl          = `0 ${s}`;
	// 	const tr          = `${s} 0`;
	// 	const outerCorner = r => `M ${tr} ${r ? arcAngle : rightAngle} ${bl}`;
	// 	const innerCorner = `M ${tr} L ${bl}`;
	// 	this.p('rounded').subscribe((r) => {
	// 		handlePath       .attr({ d: outerCorner(0)       });
	// 		inkPath          .attr({ d: outerCorner(r)       });
	// 		overlayFillPath  .attr({ d: outerCorner(r) + 'Z' });
	// 		overlayStrokePath.attr({ d: innerCorner          });
	// 	});
	//
	// }
	//
	// postCreate(options = {}) {
	// 	super.postCreate(options);
	//
	// 	setTimeout(() => {
	// 		/* set the stroke-width of part of the overlay based on part of the ink */
	// 		const source = this.svg.ink    .children('[style*="stroke: inherit"]');
	// 		const target = this.svg.overlay.children('[style*="stroke: black"]');
	// 		target.css({ strokeWidth: getComputedStyle(source[0])['stroke-width'] });
	// 	});
	// }
	
}
