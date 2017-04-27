import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {entries, isEmpty} from 'lodash-bound';
import {Observable} from 'rxjs';

import {ID_MATRIX, Point2D} from '../util/svg.js';
import {property, flag, definePropertiesByValue} from 'utilities';
import {_isNonNegative} from '../util/misc.js';

import {SvgTransformable} from './SvgTransformable.js';
import {LineSegment}      from './LineSegment.js';
import {BoxCorner}        from './BoxCorner.js';

const {max} = Math;

export const BORDER_WIDTH      = 2;
export const MIN_MIN_SIZE      = 2*max(BoxCorner.RADIUS, BORDER_WIDTH);
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
		
		const handleRect = $.svg('<rect>').attr({
			rx:      BoxCorner.RADIUS,
			ry:      BoxCorner.RADIUS,
			stroke: 'none',
			fill:   'none'
		}).appendTo(this.svg.handles);
		
		const inkRect = $.svg('<rect>').attr({
			rx:      BoxCorner.RADIUS,
			ry:      BoxCorner.RADIUS,
			stroke:  'transparent',
			fill:    'inherit'
		}).appendTo(this.svg.ink);
		
		const overlayPath = $.svg('<path>').attr({
			stroke:           'inherit',
			strokeWidth:      'inherit',
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit',
			fill:             'transparent',
		}).appendTo(this.svg.overlay);
		
		/* borders */
		this.borders = {};
		for (let [key, x, y] of [
			['top',    0, -1],
			['right', +1,  0],
			['bottom', 0, +1],
			['left',  -1,  0]
		]) {
			this.borders[key] = new LineSegment({
				parent: this,
				lengthen1: -BoxCorner.RADIUS,
				lengthen2: -BoxCorner.RADIUS
			});
			this.borders[key].svg.main.addClass('boxer-BoxBorder');
			this.borders[key].handler = {
				resizable: {
					artefact: this,
					directions: {x, y},
					before: () => { this.handlesActive = false },
					after:  () => { this.handlesActive = true  }
				},
				highlightable: {
					artefact: this,
					effect: {
						elements: this.borders[key].svg.overlay
					}
				}
			};
		}
		
		/* corners */
		this.corners = {};
		for (let [key, x, y, s1, s2] of [
			['tl', -1, -1, 'top',    'left' ],
			['tr', +1, -1, 'top',    'right'],
			['bl', -1, +1, 'bottom', 'left' ],
			['br', +1, +1, 'bottom', 'right']
		]) {
			this.corners[key] = new BoxCorner({
				parent: this
			});
			this.corners[key].handler = {
				resizable: {
					artefact: this,
					directions: {x, y},
					before: () => { this.handlesActive = false },
					after:  () => { this.handlesActive = true  }
				},
				highlightable: {
					artefact: this,
					effect: {
						elements: this.corners[key].svg.overlay
			                           .add(this.borders[s1].svg.overlay)
			                           .add(this.borders[s2].svg.overlay)
					}
				}
			};
		}
		
		/* better corner accessibility */
		this.corners::definePropertiesByValue({
			top:    { left: this.corners.tl, right:  this.corners.tr },
			right:  { top:  this.corners.tr, bottom: this.corners.br },
			bottom: { left: this.corners.bl, right:  this.corners.br },
			left:   { top:  this.corners.tl, bottom: this.corners.bl }
		});
		
		/* bookkeeping */
		let cornerPoints = {
			tl: { x: -1, y: -1, r:   0 },
			tr: { x: +1, y: -1, r:  90 },
			br: { x: +1, y: +1, r: 180 },
			bl: { x: -1, y: +1, r: 270 },
		};
		let borderPoints = {
			top:    [cornerPoints.tl, cornerPoints.tr],
			right:  [cornerPoints.tr, cornerPoints.br],
			bottom: [cornerPoints.br, cornerPoints.bl],
			left:   [cornerPoints.bl, cornerPoints.tl]
		};
		
		/* resizing */
		this.p(['width', 'height']).subscribe(([w, h]) => {
			inkRect    .attr({ width: w, height: h, x: -w/2, y: -h/2 });
			handleRect .attr({ width: w, height: h, x: -w/2, y: -h/2 });
			
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
		
		/* keep overlay outline updated */
		Observable.combineLatest([
			this.p('width'),
			this.p('height'),
			this.corners.tr.p('rounded'),
			this.corners.br.p('rounded'),
			this.corners.bl.p('rounded'),
			this.corners.tl.p('rounded')
		]).subscribe(() => {
			const top1    = this.borders.top   .inkPoint1.in(this.svg.main);
			const top2    = this.borders.top   .inkPoint2.in(this.svg.main);
			const right1  = this.borders.right .inkPoint1.in(this.svg.main);
			const right2  = this.borders.right .inkPoint2.in(this.svg.main);
			const bottom1 = this.borders.bottom.inkPoint1.in(this.svg.main);
			const bottom2 = this.borders.bottom.inkPoint2.in(this.svg.main);
			const left1   = this.borders.left  .inkPoint1.in(this.svg.main);
			const left2   = this.borders.left  .inkPoint2.in(this.svg.main);
			const cornerPath = (key) => {
				const c = this.corners[key];
				const s = BoxCorner.RADIUS;
				const {x, y} = cornerPoints[key];
				if (c.rounded) {
					return `A ${s} ${s}, 0, 0, 0,`;
				} else {
					if (x*y === -1) { return `v ${y*s} L` }
					else            { return `h ${x*s} L` }
				}
			};
			overlayPath.attr({
				d: `M
					${left1.xy}   L ${left2.xy}   ${cornerPath('bl')}
					${bottom1.xy} L ${bottom2.xy} ${cornerPath('br')}
					${right1.xy}  L ${right2.xy}  ${cornerPath('tr')}
					${top1.xy}    L ${top2.xy}    ${cornerPath('tl')}
					${left1.xy}
				Z`
			});
		});
		
	}
	
	postCreate(options = {}) {
		/* set standard handler */
		if (this.handler::isEmpty()) {
			this.handler = {
				draggable:     { artefact: this },
				dropzone:      { artefact: this },
				highlightable: {
					artefact: this,
					effect: { elements: this.svg.overlay }
				}
			};
		}
		
		/***/
		super.postCreate(options);
	}
	
}
