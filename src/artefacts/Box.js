import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {entries, isEmpty, isArray, pull, values} from 'lodash-bound';
import {Observable} from '../libs/expect-rxjs.js';

import {ID_MATRIX, Point2D} from '../util/svg.js';
import {property, flag, definePropertiesByValue} from 'utilities';
import {_isNonNegative} from '../util/misc.js';

import {SvgTransformable} from './SvgTransformable.js';
import {BoxCorner}        from './BoxCorner.js';
import {predicate} from '../handlers/Handler.js';
import {MX, MY, setCTM} from '../util/svg';
import {BoxBorder} from './BoxBorder';
import {Glyph} from './Glyph';

const {max} = Math;

export const BORDER_WIDTH = 2;
export const MIN_MIN_SIZE = 2*max(BoxCorner.RADIUS, BORDER_WIDTH);

/**
 * Representation of an interactive rectangle in svg space.
 */
export class Box extends SvgTransformable {
	
	@property({ isValid: _isNonNegative, initial: MIN_MIN_SIZE }) minWidth;
	@property({ isValid: _isNonNegative, initial: MIN_MIN_SIZE }) minHeight;
	
	@property({ isValid: _isNonNegative, initial: MIN_MIN_SIZE, transform(w) { return max(w || MIN_MIN_SIZE, this.minWidth  || MIN_MIN_SIZE) } }) width;
	@property({ isValid: _isNonNegative, initial: MIN_MIN_SIZE, transform(h) { return max(h || MIN_MIN_SIZE, this.minHeight || MIN_MIN_SIZE) } }) height;
	
	@property({ initial: {} }) stuckBorders; // TODO: more elegant solution
	
	
	getSvgContainerFor(artefact) {
		// TODO: if still needed, move this functionality to the dropzone handler
		if (artefact instanceof BoxBorder || artefact instanceof BoxCorner) {
			return this.svg.outline;
		}
		// return this.svg.content;
		return this.svg.children;
	}
	
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
		
		// this.svg.outline = $.svg('<g class="outline">')
         //    .css(this.constructor.inheritedProperties)
         //    .css('pointer-events', 'none')
		// 	.insertAfter(this.svg.children);
		
		const handlePath = $.svg('<path>').attr({
			rx:      BoxCorner.RADIUS,
			ry:      BoxCorner.RADIUS,
			stroke: 'none',
			fill:   'none'
		}).appendTo(this.svg.handles);
		
		const inkPath = $.svg('<path>').attr({
			stroke:  'inherit',
			fill:    'inherit'
		}).appendTo(this.svg.ink);
		
		const overlayPath = $.svg('<path>').attr({
			stroke:           'inherit',
			strokeWidth:      'inherit',
			strokeDasharray:  'inherit',
			strokeDashoffset: 'inherit',
			fill:             'transparent',
		}).appendTo(this.svg.overlay);
		
		// /* borders */
		// this.borders = {};
		// for (let [key, x, y] of [
		// 	['top',    0, -1],
		// 	['right', +1,  0],
		// 	['bottom', 0, +1],
		// 	['left',  -1,  0]
		// ]) {
		// 	this.borders[key] = new BoxBorder({
		// 		parent: this,
		// 		lengthen1: -BoxCorner.RADIUS,
		// 		lengthen2: -BoxCorner.RADIUS,
		// 		side:      {key, x, y}
		// 	});
		// 	this.borders[key].registerHandlers({
		// 		resizable: {
		// 			artefact: this,
		// 			directions: {x, y},
		// 			before: () => { this.handlesActive = false },
		// 			after:  () => { this.handlesActive = true  }
		// 		},
		// 		highlightable: {
		// 			artefact: this,
		// 			effect: {
		// 				elements: this.borders[key].svg.overlay
		// 			}
		// 		},
		// 		dropzone: {
		// 			artefact: this.borders[key],
		// 			after: ({artefact}) => {
		// 				if (artefact instanceof Box) {
		// 					// TODO: finish this (mirror the LyphBox.js version)
		// 				} else if (artefact instanceof Glyph) {
		// 					artefact.parent = this.borders[key]
		// 				}
		// 			}
		// 		}
		// 	});
		// }
		
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
			// this.corners[key].registerHandlers({
			// 	resizable: {
			// 		artefact: this,
			// 		directions: {x, y},
			// 		before: () => { this.handlesActive = false },
			// 		after:  () => { this.handlesActive = true  }
			// 	},
			// 	highlightable: {
			// 		artefact: this,
			// 		effect: {
			// 			elements: this.corners[key].svg.overlay
			// 				  .add(this.borders[s1].svg.overlay)
			// 				  .add(this.borders[s2].svg.overlay)
			// 		}
			// 	}
			// });
		}

		// /* better corner accessibility */
		// this.corners::definePropertiesByValue({
		// 	top:    { left: this.corners.tl, right:  this.corners.tr },
		// 	right:  { top:  this.corners.tr, bottom: this.corners.br },
		// 	bottom: { left: this.corners.bl, right:  this.corners.br },
		// 	left:   { top:  this.corners.tl, bottom: this.corners.bl }
		// });
		
		/* bookkeeping */
		let cornerPoints = {
			tl: { x: -1, y: -1, r:   0 },
			tr: { x: +1, y: -1, r:  90 },
			br: { x: +1, y: +1, r: 180 },
			bl: { x: -1, y: +1, r: 270 },
		};
		// let borderPoints = {
		// 	top:    [cornerPoints.tl, cornerPoints.tr],
		// 	right:  [cornerPoints.tr, cornerPoints.br],
		// 	bottom: [cornerPoints.br, cornerPoints.bl],
		// 	left:   [cornerPoints.bl, cornerPoints.tl]
		// };
		
		/* keep outline updated */
		const bcr = BoxCorner.RADIUS;
		const top1    = { x: 0, y: 0 };
		const top2    = { x: 0, y: 0 };
		const right1  = { x: 0, y: 0 };
		const right2  = { x: 0, y: 0 };
		const bottom1 = { x: 0, y: 0 };
		const bottom2 = { x: 0, y: 0 };
		const left1   = { x: 0, y: 0 };
		const left2   = { x: 0, y: 0 };
		Observable.combineLatest(
			this.p('width'),
			this.p('height'),
			this.corners.tr.p('rounded'),
			this.corners.br.p('rounded'),
			this.corners.bl.p('rounded'),
			this.corners.tl.p('rounded')
		).subscribe(([w, h]) => {
			// /* place the four corners */
			// for (let [key, cp] of cornerPoints::entries()) {
			// 	cp.p = new Point2D({
			// 		x:                cp.x * w / 2,
			// 		y:                cp.y * h / 2,
			// 		coordinateSystem: this.svg.outline
			// 	});
			// 	this.corners[key].transformation = ID_MATRIX.translate(...cp.p.xy).rotate(cp.r);
			// }
			// /* place the borders */
			// for (let [key, [{p:p1}, {p:p2}]] of borderPoints::entries()) {
			// 	this.borders[key].point1 = p1.in(this.svg.outline);
			// 	this.borders[key].point2 = p2.in(this.svg.outline);
			// }
			
			/* generate outline */
			// const top1    = this.borders.top   .inkPoint1;
			// const top2    = this.borders.top   .inkPoint2;
			// const right1  = this.borders.right .inkPoint1;
			// const right2  = this.borders.right .inkPoint2;
			// const bottom1 = this.borders.bottom.inkPoint1;
			// const bottom2 = this.borders.bottom.inkPoint2;
			// const left1   = this.borders.left  .inkPoint1;
			// const left2   = this.borders.left  .inkPoint2;
			const w12  = w/2;
			const h12  = h/2;
			const w12r = w12-bcr;
			const h12r = h12-bcr;
			top2   .x = -w12r; top2   .y = -h12 ;
			top1   .x = +w12r; top1   .y = -h12 ;
			right2 .x = +w12 ; right2 .y = -h12r;
			right1 .x = +w12 ; right1 .y = +h12r;
			bottom2.x = +w12r; bottom2.y = +h12 ;
			bottom1.x = -w12r; bottom1.y = +h12 ;
			left2  .x = -w12 ; left2  .y = +h12r;
			left1  .x = -w12 ; left1  .y = -h12r;
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
			$().add(inkPath)
			   .add(handlePath)
			   .add(overlayPath).attr({
				d: `M
					${left1.x  } ${left1.y  } L ${left2.x  } ${left2.y  } ${cornerPath('bl')}
					${bottom1.x} ${bottom1.y} L ${bottom2.x} ${bottom2.y} ${cornerPath('br')}
					${right1.x } ${right1.y } L ${right2.x } ${right2.y } ${cornerPath('tr')}
					${top1.x   } ${top1.y   } L ${top2.x   } ${top2.y   } ${cornerPath('tl')}
					${left1.x  } ${left1.y  }
				Z`
			});
			// $().add(inkPath)
			//    .add(handlePath)
			//    .add(overlayPath).attr({
			// 	d: `M
			// 		${top1.x   } ${top1.y   } L ${top2.x   } ${top2.y   } ${cornerPath('tr')}
			// 		${right1.x } ${right1.y } L ${right2.x } ${right2.y } ${cornerPath('br')}
			// 		${bottom1.x} ${bottom1.y} L ${bottom2.x} ${bottom2.y} ${cornerPath('bl')}
			// 		${left1.x  } ${left1.y  } L ${left2.x  } ${left2.y  } ${cornerPath('tl')}
			// 		${top1.x   } ${top1.y   }
			// 	Z`
			// });
		});
		
		// /* when parent changes, 'unstuck' all borders */
		// this.p('parent').subscribe(() => {
		// 	this.stuckBorders = {};
		// });
		
		// this.p('stuckBorders').switchMap((stb) => {
		//
		// 	console.log('----', stb);
		//
		// 	if (!stb.left && !stb.right && !stb.top && !stb.bottom) {
		// 		return Observable.never();
		// 	}
		//
		// 	let streams = {};
		//
		// 	for (let side of ['left', 'right']) {
		// 		if (stb[side]) {
		// 			const {box, relation, x} = stb[side];
		// 			if (relation === 'parent') {
		// 				streams[side] = box.p('width').map(w => x * w/2);
		// 			} else { // sibling
		// 				streams[side] = box.p(['width', 'transformation']).map(([w, t]) => t[MX] - x * w/2);
		// 			}
		// 		} else {
		// 			streams[side] = Observable.of(null);
		// 		}
		// 	}
		//
		// 	streams.left.subscribe(console.info);
		//
		// 	// TODO: top, bottom
		//
		//
		// 	const thisWX = this.p(['width', 'transformation']).map(([w, t]) => [w, t[MX]]);
		// 	const thisL  = thisWX.map(([w, x]) => x - w/2);
		// 	const thisR  = thisWX.map(([w, x]) => x + w/2);
		// 	return Observable
		// 		.combineLatest(streams.left, streams.right)
		// 		.withLatestFrom(thisL, thisR, ([l, r], tl, tr) => {
		// 			console.log(l, r, tl, tr);
		// 			if (l === null) { l = tl }
		// 			if (r === null) { r = tr }
		// 			return {
		// 				x:    (l + r) / 2,
		// 				width: r - l
		// 			};
		// 		});
		// }).subscribe(({x, width}) => {
		// 	console.log(x, width);
		// 	this.transformation = ID_MATRIX.translate(x, this.transformation[MY]);
		// 	this.width = w;
		// });
		
		// /* react to parent resizing when stuck to border */
		// this.p(['width', 'height', 'parent.width', 'parent.height', 'stuckBorders']).subscribe(([w, h, pw, ph, stb]) => {
		// 	stb = [...stb::values()];
		// 	if (!stb || stb.length === 0) { return }
		// 	const stX = [...new Set(stb.map(({x}) => x))];
		// 	const stY = [...new Set(stb.map(({y}) => y))];
		// 	if (stX.length > 1) { stX::pull(0) }
		// 	if (stY.length > 1) { stY::pull(0) }
		// 	if (stX.length === 2) { w = pw }
		// 	if (stY.length === 2) { h = ph }
		// 	const [x, y] = [stX[0], stY[0]];
		// 	const oldX = this.transformation[MX];
		// 	const oldY = this.transformation[MY];
		// 	this.transformation = ID_MATRIX.translate(!x * oldX + x*(pw-w)/2, !y * oldY + y*(ph-h)/2).rotate(0);  // TODO
		// 	this.width  = w;
		// 	this.height = h;
		// });
		
		// /* when stuck to borders, deactivate the appropriate outline handles */
		// this.p('stuckBorders').subscribe((stb) => {
		// 	// borders
		// 	this.borders.left.handlesActive   = !stb.left;
		// 	this.borders.right.handlesActive  = !stb.right;
		// 	this.borders.top.handlesActive    = !stb.top;
		// 	this.borders.bottom.handlesActive = !stb.bottom;
		// 	// corners
		// 	this.corners.tl.handlesActive = !stb.top    && !stb.left;
		// 	this.corners.tr.handlesActive = !stb.top    && !stb.right;
		// 	this.corners.bl.handlesActive = !stb.bottom && !stb.left;
		// 	this.corners.br.handlesActive = !stb.bottom && !stb.right;
		// });
		
	}
	
	postCreate(options = {}) {
		/* set standard handlers */
		this.registerHandlers({
			movable:   {
				artefact: this,
				after: () => {
					/* when dropped, reapply relevant border stucknesses */
					this.stuckBorders = {...this.stuckBorders};
				}
			},
			rotatable: {
				artefact: this,
				after: () => {
					/* after rotating, reapply relevant border stucknesses */
					//  which, if present, would undo rotation
					this.stuckBorders = {...this.stuckBorders};
					// TODO: simply disallow rotation when stuck
				}
			},
			dropzone:  {
				artefact: this,
				after: ({artefact}) => {
					artefact.parent = this;
				}
			},
			drawzone: {
				artefact: this,
				accepts({ artefact }) {
					return artefact instanceof SvgTransformable;
				}
			},
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
