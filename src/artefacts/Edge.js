import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {Observable} from '../libs/expect-rxjs.js';

import {isEmpty, isUndefined} from 'lodash-bound';

import {Point2D} from '../util/svg.js';
import {property} from 'utilities';

import {LineSegment} from './LineSegment.js';
import {Glyph}       from './Glyph.js';
import {moveToFront} from '../util/svg';
import {smartMerge} from '../Coach';


/**
 * Representation of an interactive edge in svg space, spanning between two glyphs.
 */
export class Edge extends LineSegment {
	
	@property({ isValid: v => v instanceof Glyph }) glyph1;
	@property({ isValid: v => v instanceof Glyph }) glyph2;
	
	preCreate(options = {}) {
		super.preCreate({
			lengthen1: -Glyph.RADIUS,
			lengthen2: -Glyph.RADIUS,
			...options
		});
		
		/* initializing glyphs */
		for (let g of [1, 2]) {
			// assert(options[`glyph${g}`]);
			this[`glyph${g}`] = options[`glyph${g}`];
		}
		
		/* re-parenting this Edge when either of the glyphs re-parent */
		this.p(['glyph1', 'glyph2']).filter(([g1, g2]) => g1 && g2).switchMap(([g1, g2]) => Observable.combineLatest(
			g1.p('depth').filter(d => !d::isUndefined() && !g1.deleted),
			g2.p('depth').filter(d => !d::isUndefined() && !g2.deleted)
		).map(() => g1.closestCommonAncestorWith(g2))).subscribe( this.p('parent') );
		
		/* moving the line segment when the glyphs move */
		for (let g of [1, 2]) {
			this.p([`glyph${g}.globalTransformation`], ['root'])
			    .map(([gt, root]) => Point2D.fromMatrixTranslation(gt, root.svg.main))
			    .subscribe( this.p(`point${g}`) );
		}
		
		// TODO: There's a bug when dragging a node into a new parent box.
		//     : Its connected edges will stop following it, but will still follow its old parent.
		//     :
		
		/* propagate moveToFront  */
		const thisArtefact = this;
		function direction(d)    { return this.filter(({direction}) => (direction === d))   }
		function doNotTurnBack() { return this.filter(info => info.source !== thisArtefact) }
		for (let g of [1, 2]) {
			this.e(`glyph${g}.moveToFront`)
				::doNotTurnBack()
				.subscribe((info) => { this.e('moveToFront').next({ ...info, direction: 'in' }) });
		}
		// As a special exception for Edge, inward moveToFront also brings svg to front.
		// Outward moveToFront already does this (see SvgArtefact.js)
		this.e('moveToFront')
			::direction('in')
			.subscribe(this.svg.main::moveToFront);
	}
	
	create(options = {}) {
		super.create(options);
		
		
		const inkLineOutline = $.svg('<line>').css({
			stroke:           'black',
			strokeWidth:      '4'
		}).prependTo(this.svg.ink);
		
		this.p(['parent', 'point1', 'point2', 'lengthen1', 'lengthen2'])
		    .filter(([parent, p1, p2]) => parent && p1 && p2)
		    .subscribe(([parent, p1, p2, l1, l2]) => {
				p1 = p1.in(parent.svg.children);
				p2 = p2.in(parent.svg.children);
				$(inkLineOutline).attr({
					...p1.withDistanceTo(-l1, p2).obj('x1', 'y1'),
					...p2.withDistanceTo(-l2, p1).obj('x2', 'y2')
				});
			});
		
	}
	
	postCreate(options = {}) {
		
		/* set standard handlers */
		this.registerHandlers({
			highlightable: {
				artefact: this,
				effect: { elements: this.svg.overlay }
			},
			deletable: {
				artefact: this
			}
		});
		
		/* delete this when either glyph is deleted */
		Observable.merge(
			this.p('glyph1.deleted').filter(d=>!!d),
			this.p('glyph2.deleted').filter(d=>!!d)
		).take(1).subscribe( this.p('deleted') );
		
		/* set glyph handlers */
		const handlers = {
			movable: {
				before: () => { this.handlesActive = false },
				after:  () => { this.handlesActive = true  }
			}
		};
		this.p('glyph1').filter(g=>!!g).subscribe((glyph1) => { glyph1.registerHandlers(handlers) });
		this.p('glyph2').filter(g=>!!g).subscribe((glyph2) => { glyph2.registerHandlers(handlers) });
		// this.glyph2.registerHandlers(handlers);
		
		/***/
		super.postCreate(options);
	}
	
}
