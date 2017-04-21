import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {entries, values, assign, isEmpty} from 'lodash-bound';

import {ID_MATRIX, SVGMatrix, setCTM, Point2D} from '../util/svg.js';
import {property, flag, definePropertyByValue, definePropertiesByValue} from 'utilities';
import {_isNonNegative} from '../util/misc.js';

const {max} = Math;

import {SvgTransformable} from './SvgTransformable.js';
import {LineSegment}      from './LineSegment.js';
import {BoxCorner}        from './BoxCorner.js';
import {applyCSS} from '../libs/jquery';

export const BORDER_WIDTH      = 2;
export const CORNER_RADIUS     = 15;
export const MIN_MIN_SIZE      = 2*max(CORNER_RADIUS, BORDER_WIDTH);
export const DEFAULT_INK_COLOR = 'cyan';

/**
 * Representation of an interactive rectangle in svg space.
 */
export class Box extends SvgTransformable {
	
	@property({ isValid: _isNonNegative, initial: MIN_MIN_SIZE }) minWidth;
	@property({ isValid: _isNonNegative, initial: MIN_MIN_SIZE }) minHeight;
	
	@property({ isValid: _isNonNegative, initial: MIN_MIN_SIZE, transform(w) { return max(w || MIN_MIN_SIZE, this.minWidth  || MIN_MIN_SIZE) } }) width;
	@property({ isValid: _isNonNegative, initial: MIN_MIN_SIZE, transform(h) { return max(h || MIN_MIN_SIZE, this.minHeight || MIN_MIN_SIZE) } }) height;
	
	@flag({ isValid: _isBoolean, initial: false }) tlRoundedCorner;
	@flag({ isValid: _isBoolean, initial: false }) trRoundedCorner;
	@flag({ isValid: _isBoolean, initial: false }) blRoundedCorner;
	@flag({ isValid: _isBoolean, initial: false }) brRoundedCorner;
	
	preCreate(options) {
		super.preCreate(options);
		
		/* set width/height if given */
		if (options.width)  { this.width  = options.width  }
		if (options.height) { this.height = options.height }
		
		/* keep width/height at or above minimum */
		for (let [ minKey    ,  key    ] of [
			     ['minWidth' , 'width' ],
			     ['minHeight', 'height']
		]) {
			this.p([minKey], [key])
			    .filter(([m, v]) => v < m)
			    .map   (([m, v]) => m    )
			    .subscribe( this.p(key) );
		}
	}
	
	create(options = {}) {
		super.create(options);
		
		this.svg._inkRect = $.svg('<rect>').attr({
			rx:      CORNER_RADIUS,
			ry:      CORNER_RADIUS,
			stroke: 'none',
			fill:    DEFAULT_INK_COLOR
		}).appendTo(this.svg.ink);
		
		this.svg._handleRect = $.svg('<rect>').attr({
			rx:      CORNER_RADIUS,
			ry:      CORNER_RADIUS,
			stroke: 'none',
			fill:   'none'
		}).appendTo(this.svg.handles);
		
		/* corners */
		this.corners = {};
		for (let [key, x, y] of [
			['tl', -1, -1],
			['tr', +1, -1],
			['bl', -1, +1],
			['br', +1, +1]
		]) {
			this.corners[key] = new BoxCorner({
				coordinateSystem: this,
				size: CORNER_RADIUS,
				handler: { resizable: { artefact: this, x, y } }
			});
		}
		
		/* borders */
		this.borders = {};
		for (let [key, x, y] of [
			['top',    0, -1],
			['right', +1,  0],
			['bottom', 0, +1],
			['left',  -1,  0]
		]) {
			this.borders[key] = new LineSegment({
				coordinateSystem: this,
				lengthen1: -CORNER_RADIUS,
				lengthen2: -CORNER_RADIUS,
				handler: { resizable: { artefact: this, x, y } }
			});
		}
		
		/* better corner accessibility */
		this.corners::definePropertiesByValue({
			top:    { left: this.corners.tl, right:  this.corners.tr },
			right:  { top:  this.corners.tr, bottom: this.corners.br },
			bottom: { left: this.corners.bl, right:  this.corners.br },
			left:   { top:  this.corners.tl, bottom: this.corners.bl }
		});
		
		/* resizing */
		let cornerPoints = {
			tl: { x: -1, y: -1, r:   0 },
			tr: { x: +1, y: -1, r:  90 },
			br: { x: +1, y: +1, r: 180 },
			bl: { x: -1, y: +1, r: 270 },
		};
		let borderPoints = {
			top:    [cornerPoints.tl, cornerPoints.tr],
			right:  [cornerPoints.tr, cornerPoints.br],
			bottom: [cornerPoints.bl, cornerPoints.br],
			left:   [cornerPoints.tl, cornerPoints.bl]
		};
		this.p(['width', 'height']).subscribe(([w, h]) => {
			this.svg._inkRect   .attr({ width: w, height: h, x: -w/2, y: -h/2 });
			this.svg._handleRect.attr({ width: w, height: h, x: -w/2, y: -h/2 });
			
			for (let [key, cp] of cornerPoints::entries()) {
				cp.p = new Point2D({
					x:                cp.x * w / 2,
					y:                cp.y * h / 2,
					coordinateSystem: this.svg.children
				});
				this.corners[key].transformation = ID_MATRIX.translate(...cp.p.xy).rotate(cp.r);
			}
			
			for (let [s, [cp1, cp2]] of borderPoints::entries()) {
				this.borders[s].point1 = cp1.p;
				this.borders[s].point2 = cp2.p;
			}
		});
		
	}
	
	postCreate(options = {}) {
		/* set standard handler */
		// console.log(this.handler);
		// debugger;
		if (this.handler::isEmpty()) {
			this.handler = {
				draggable: { artefact: this },
				dropzone:  { artefact: this }
			};
		}
		
		/***/
		super.postCreate(options);
	}
	
	setStyle(style: Object) {
		super.setStyle(style);
		this.svg.children::applyCSS({
			'> .boxer-BoxCorner > .ink *': {
				fill: this.svg._inkRect.css('fill')
			}
		});
	}
	
}
