import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean, isNumber as _isNumber} from 'lodash';

import {Point2D}  from '../util/svg.js';
import {property} from 'utilities';

const {max} = Math;

import {SvgArtefact} from './SvgArtefact.js';

/**
 * Representation of an interactive line segment in svg space.
 */
export class LineSegment extends SvgArtefact {
	
	@property({ isValid: v => v instanceof Point2D }) point1;
	@property({ isValid: v => v instanceof Point2D }) point2;
	@property({ isValid: _isNumber, initial: 0     }) lengthen1;
	@property({ isValid: _isNumber, initial: 0     }) lengthen2;
	
	preCreate(options = {}) {
		super.preCreate(options);
		
		if (options.point1)    { this.point1    = options.point1.in(this.parent.svg.children) }
		if (options.point2)    { this.point2    = options.point2.in(this.parent.svg.children) }
		if (options.lengthen1) { this.lengthen1 = options.lengthen1                           }
		if (options.lengthen2) { this.lengthen2 = options.lengthen2                           }
		
		/* smoothly transitioning to a new coordinateSystem */
		this.p('parent').filter(p=>p).subscribe((parent) => {
			if (this.point1 && this.point2) {
				this.point1 = this.point1.in(parent.svg.children);
				this.point2 = this.point2.in(parent.svg.children);
			}
		});
	}
	
	create(options = {}) {
		
		const inkLine = $.svg('<line>').css({
			stroke:           'inherit',
			strokeWidth:      'inherit',
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit'
		}).appendTo(this.svg.ink);
		
		const overlayLine = $.svg('<line>').css({
			stroke:           'inherit',
			strokeWidth:      'inherit',
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit'
		}).appendTo(this.svg.overlay);
		
		const handleLine = $.svg('<line>').css({
			strokeWidth: 'inherit',
		}).appendTo(this.svg.handles);
		
		this.p(['parent', 'point1', 'point2', 'lengthen1', 'lengthen2'])
		    .filter(([parent, p1, p2]) => parent && p1 && p2)
		    .subscribe(([parent, p1, p2, l1, l2]) => {
				p1 = p1.in(parent.svg.children);
				p2 = p2.in(parent.svg.children);
				$().add(inkLine)
				   .add(overlayLine)
				   .add(handleLine)
				   .attr({
						...p1.withDistanceTo(-l2, p2).obj('x1', 'y1'),
						...p2.withDistanceTo(-l1, p1).obj('x2', 'y2')
					});
			});
		
		
	}
	
	get inkPoint1() {
		return this.point1.withDistanceTo(-this.lengthen2, this.point2);
	}
	
	get inkPoint2() {
		return this.point2.withDistanceTo(-this.lengthen1, this.point1);
	}
	
}
