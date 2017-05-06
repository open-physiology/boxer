import $ from '../libs/jquery.js';
import {assign, pick, isFunction, includes} from 'lodash-bound';
import {Observable} from 'rxjs';

import {withoutMod, stopPropagation, property, match} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront, ID_MATRIX, M11, M12, M21, M22} from "../util/svg";

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {MouseTool} from './MouseTool';
import {Box} from '../artefacts/Box';
import {Glyph} from '../artefacts/Glyph';
import {Edge} from '../artefacts/Edge';

const {max, sign, abs} = Math;

const DRAWING_BOX   = 'DRAWING_BOX';
const DRAWING_GLYPH = 'DRAWING_GLYPH';
const DRAWING_EDGE  = 'DRAWING_EDGE';
const DRAWING_EDGES = 'DRAWING_EDGES';
const MODES = [
	DRAWING_BOX,
	DRAWING_GLYPH,
	DRAWING_EDGE,
	DRAWING_EDGES
];

export class DrawTool extends MouseTool {
	
	static DRAWING_BOX   = DRAWING_BOX;
	static DRAWING_GLYPH = DRAWING_GLYPH;
	static DRAWING_EDGE  = DRAWING_EDGE;
	static MODES = MODES;
	
	mode: string = DRAWING_BOX;
	
	data: Object = {};
	
	constructor(options = {}) {
		super(options);
		if (options.class) { this.class = options.class }
		if (options.css)   { this.css   = options.css   }
		if (options.data)  { this.data  = options.data  }
	}
	
	init({coach}) {
		super.init({ coach });
		
		const mousemove = this.windowE('mousemove');
		const mouseup   = this.windowE('mouseup');
		const keydown   = this.windowE('keydown');
		
		coach.mouseCursorTool.register(['IDLE'], ['drawzone'], () => this.active, () => 'crosshair');
		coach.mouseCursorTool.register(MODES,    ['*'],        () => this.active, () => 'crosshair');
		
		const insideDragThreshold = this.mouseMachine.INSIDE_DRAG_THRESHOLD
			.filter(() => this.active)
			::handleBoxer('drawzone')
			.filter(({accepts}) => !accepts || accepts({
				data: this.data,
				class: match(this.mode)({
					[DrawTool.DRAWING_BOX]: () => Box,
					default:                () => Glyph
				})
			}));
		const droppingOrClicking = Observable.merge(
			this.mouseMachine.DROPPING,
			this.mouseMachine.CLICKING
		);
		for (let mode of MODES) {
			coach.stateMachine.link(
				'IDLE',
				insideDragThreshold.filter(() => this.mode === mode),
				mode
			);
		}
		const escaping = this.mouseMachine.ESCAPING;
		
		coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'DRAWING_BOX': (args) => {
				const {before, after, cancel} = args;
				
				/* create new box */
				const directions = { x: +1, y: +1 };
				const drawZone = args.drawZone = args.artefact;
				const point = args.point.in(drawZone.svg.children);
				const artefact = args.artefact = new Box({
					css:            this.css,
					parent:         drawZone,
					transformation: ID_MATRIX.translate(...point.xy)
				});
				
				/* start resizing */
				artefact.handlesActive = false;
				artefact.e('moveToFront').next({ direction: 'out', source: artefact });
				if (before::isFunction()) { before(args) }
				
				/* record start dimensions and mouse position */
				const start = {
					transformation: artefact.transformation,
					mouse:          point
				};
				
				/* resize while dragging */
				mousemove
					.map(event => event.point.in(drawZone.svg.children).minus(start.mouse))
					::subscribeDuringState(({x: xDiff, y: yDiff}) => {
						if (directions.x === -sign(xDiff)) { directions.x = -directions.x }
						if (directions.y === -sign(yDiff)) { directions.y = -directions.y }
						artefact::assign({
							transformation: start.transformation.translate(xDiff/2, yDiff/2),
							width:          directions.x * xDiff,
							height:         directions.y * yDiff
						});
					});
				
				/* escape and cancel */
				escaping
					// .take(1)
					.do(() => {
						if (cancel::isFunction()) { cancel(args) }
						artefact.delete();
					})
					::enterState('IDLE');
			
				/* stop drawing */
				droppingOrClicking
					// .take(1)
					.do(() => {
						if (after::isFunction()) { after(args) }
						artefact.handlesActive = true
					})
					::enterState('IDLE');
			},
			'DRAWING_GLYPH': (args) => {
				const {before, after, cancel} = args;
				
				/* create new glyph */
				const drawZone = args.drawZone = args.artefact;
				const point = args.point.in(drawZone.svg.children);
				const artefact = args.artefact = new Glyph({
					css:            this.css,
					parent:         drawZone,
					transformation: ID_MATRIX.translate(...point.xy)
				});
				
				/* start resizing */
				artefact.handlesActive = false;
				artefact.e('moveToFront').next({ direction: 'out', source: artefact });
				if (before::isFunction()) { before(args) }
				
				// /* record start dimensions and mouse position */
				// const start = {
				// 	transformation: artefact.transformation,
				// 	mouse:          point
				// };
				// TODO: allow move following initial mousedown
				
				/* escape and cancel */
				escaping
					// .take(1)
					.do(() => {
						if (cancel::isFunction()) { cancel(args) }
						artefact.delete();
					})
					::enterState('IDLE');
			
				/* stop drawing */
				droppingOrClicking
					// .take(1)
					.do(() => {
						if (after::isFunction()) { after(args) }
						artefact.handlesActive = true
					})
					::enterState('IDLE');
				
			},
			'DRAWING_EDGE': (args1) => {
				const {before, after, cancel} = args1;
				
				let glyph1;
				
				/* set glyph1 */
				if (args1.artefact instanceof Glyph) {
					glyph1 = args1.artefact;
				} else {
					const drawZone1 = args1.artefact;
					const point1 = args1.point.in(drawZone1.svg.children);
					glyph1 = args1.artefact = new Glyph({
						css:            this.css,
						parent:         drawZone1,
						transformation: ID_MATRIX.translate(...point1.xy)
					});
				}
				
				/* start drawing */
				glyph1.handlesActive = false;
				glyph1.e('moveToFront').next({ direction: 'out', source: glyph1 });
				if (before::isFunction()) { before(args1) }
				
				/* escape and cancel */
				escaping
					.do(() => {
						if (cancel::isFunction()) { cancel(args1) }
						glyph1.handlesActive = true;
					})
					::enterState('IDLE');
				
				/*  */
				insideDragThreshold
					.do((args2) => {
						/* stop drawing glyph1 */
						glyph1.handlesActive = true;
						
						/* set glyph2 */
						let glyph2;
						if (args2.artefact instanceof Glyph) {
							glyph2 = args2.artefact;
						} else {
							const drawZone2 = args2.artefact;
							const point2 = args2.point.in(drawZone2.svg.children);
							glyph2 = args2.artefact = new Glyph({
								css:            this.css,
								parent:         drawZone2,
								transformation: ID_MATRIX.translate(...point2.xy)
							});
						}
						
						/* create edge */
						let edge = new Edge({
							css:    this.css,
							parent: glyph1.parent, // TODO: closest common ancestor
							glyph1,
							glyph2
						});
						
						/* communicating new glyph1 to next iteration */
						args2.artefact = glyph2;
					})
					::enterState('DRAWING_EDGE')
				
			}
		}), () => this.active);
	}
}
