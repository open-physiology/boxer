import $ from '../libs/jquery.js';
import {assign, pick, isFunction, includes} from 'lodash-bound';
import {Observable} from 'rxjs';
import CSSPrefix from 'cssprefix/src/cssprefix';

import {withoutMod, stopPropagation, property, match, which, event} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront, ID_MATRIX, M11, M12, M21, M22} from "../util/svg";

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {MouseTool} from './MouseTool';
import {SvgArtefact} from '../artefacts/SvgArtefact';
import {Box} from '../artefacts/Box';
import {Glyph} from '../artefacts/Glyph';
import {Edge} from '../artefacts/Edge';
import Machine from '../util/Machine';

import KeyCode from 'keycode-js';
import {callIfFunction, subclassOf} from '../util/misc';

const {KEY_ESCAPE} = KeyCode;

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
	
	@property({ initial: null }) artefactCreated;
	
	mode: string = DRAWING_BOX;
	
	data: Object = {};
	
	factory: Class | () => SvgArtefact;
	
	constructor(options = {}) {
		super(options);
		if (options.factory) { this.factory = options.factory }
		if (options.css)     { this.css     = options.css     }
		if (options.data)    { this.data    = options.data    }
	}
	
	init({coach}) {
		super.init({ coach });
		
		const mousemove = this.windowE('mousemove');
		const keydown   = this.windowE('keydown');
		const droppingOrClicking = Observable.merge(
			this.mouseMachine.DROPPING,
			this.mouseMachine.CLICKING
		);
		const escaping = this.mouseMachine.ESCAPING;
		const threshold = this.mouseMachine.THRESHOLD
			::handleBoxer('drawzone');
		
		const factory = (dfault) => {
			const fn = this.factory::isFunction() ? this.factory : dfault;
			return (...args) =>
				fn::subclassOf(SvgArtefact)
					? new fn(...args)
					: fn(...args);
		};
		
		const localMachine = new Machine(this.constructor.name, { state: 'IDLE' });
		for (let mode of MODES) {
			localMachine.link('IDLE', threshold.filter(() => this.mode === mode), mode);
		}
		localMachine.extend(({ enterState, subscribeDuringState }) => ({
			'DRAWING_BOX': (args) => {
				const {accepts, before, after, cancel} = args;
				
				/* create new box */
				const drawZone = args.drawZone = args.artefact;
				const point = args.point.in(drawZone.svg.children);
				const artefact = args.artefact = factory(Box)({
					css:            this.css,
					transformation: ID_MATRIX.translate(...point.xy)
				});
				
				/* allow the draw zone to reject */
				if (!accepts({artefact})) {
					artefact.delete();
					enterState('IDLE');
					return;
				}
				artefact.parent = drawZone;
				
				/* notify the outside world */
				this.p('artefactCreated').next(artefact);
				
				/* start drawing */
				artefact.handlesActive = false;
				artefact.moveToFront();
				if (before::isFunction()) { before(args) }
				
				/* record start dimensions and mouse position */
				const start = {
					transformation: artefact.transformation,
					mouse:          point
				};
				
				/* resize while dragging */
				const directions = { x: +1, y: +1 };
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
				
				/* cancel or stop dragging */
				Observable.merge(
					this.p('active').filter(a=>!a).concatMap(Observable.throw()),
					escaping                      .concatMap(Observable.throw()),
					droppingOrClicking.do(() => {
						artefact.handlesActive = true;
						artefact.moveToFront();
					})
				).catch(() => {
					/* cancel drawing */
					artefact.delete();
					cancel::callIfFunction(args);
					return Observable.of({ deleted: true });
                }).do(({deleted, point}) => {
					/* stop drawing */
					// coach.selectTool.reacquire(point);
					coach.selectTool.reacquire();
					after::callIfFunction(); // TODO: pass args?
				})::enterState('IDLE');
				
			},
			'DRAWING_GLYPH': (args) => {
				const {accepts, before, after, cancel} = args;
				
				/* create new glyph */
				const drawZone = args.drawZone = args.artefact;
				const point = args.point.in(drawZone.svg.children);
				const artefact = args.artefact = factory(Glyph)({
					css:            this.css,
					transformation: ID_MATRIX.translate(...point.xy)
				});
				
				/* allow the draw zone to reject */
				if (!accepts({artefact})) {
					artefact.delete();
					enterState('IDLE');
					return;
				}
				artefact.parent = drawZone;
				
				/* start drawing */
				artefact.handlesActive = false;
				artefact.moveToFront();
				if (before::isFunction()) { before(args) }
				
				// /* record start dimensions and mouse position */
				// const start = {
				// 	transformation: artefact.transformation,
				// 	mouse:          point
				// };
				// TODO: allow move following initial mousedown
				
				/* cancel or stop dragging */
				Observable.merge(
					this.p('active').filter(a=>!a).concatMap(Observable.throw()),
					escaping                      .concatMap(Observable.throw()),
					droppingOrClicking.do(() => {
						artefact.handlesActive = true;
						artefact.moveToFront();
					})
				).catch(() => {
					/* cancel drawing */
					artefact.delete();
					cancel::callIfFunction(args);
					return Observable.of({ deleted: true });
                }).do(({point}) => {
					/* stop drawing */
					coach.selectTool.reacquire(point);
					after::callIfFunction(); // TODO: pass args?
				})::enterState('IDLE');
				
			},
			'DRAWING_EDGE': (args1) => {
				const {accepts, before, after, cancel} = args1;
				
				let glyph1;
				
				/* set glyph1 */
				if (args1.artefact instanceof Glyph) {
					glyph1 = args1.artefact;
				} else {
					const drawZone1 = args1.artefact;
					const point1 = args1.point.in(drawZone1.svg.children);
					glyph1 = args1.artefact = factory(Glyph)({
						css:            this.css,
						transformation: ID_MATRIX.translate(...point1.xy)
					});
					/* allow the draw zone to reject */
					if (!accepts({ artefact: glyph1 })) {
						glyph1.delete();
						enterState('IDLE');
						return;
					}
					glyph1.parent = drawZone1;
				}
				
				/* start drawing */
				glyph1.handlesActive = false;
				glyph1.moveToFront();
				if (before::isFunction()) { before(args1) }
				
				// /* record start dimensions and mouse position */
				// const start = {
				// 	transformation: artefact.transformation,
				// 	mouse:          point
				// };
				// TODO: allow move following initial mousedown
				
				/* escape / cancel */
				Observable.merge(
					this.p('active').filter(a=>!a),
					escaping,
				).merge(this.p('active').filter(a=>!a)).do(() => {
					if (cancel::isFunction()) { cancel(args1) }
					glyph1.handlesActive = true;
				})::enterState('IDLE');
				
				/***/
				threshold.do((args2) => {
					/* stop drawing glyph1 */
					glyph1.handlesActive = true;
					
					/* set glyph2 */
					let glyph2;
					if (args2.artefact instanceof Glyph) {
						glyph2 = args2.artefact;
					} else {
						const drawZone2 = args2.artefact;
						const point2 = args2.point.in(drawZone2.svg.children);
						glyph2 = args2.artefact = factory(Glyph)({
							css:            this.css,
							transformation: ID_MATRIX.translate(...point2.xy)
						});
						/* allow the draw zone to reject */
						if (!args2.accepts({ artefact: glyph2 })) {
							glyph2.delete();
							enterState('IDLE');
							return;
						}
						glyph2.parent = drawZone2;
					}
					
					/* create edge */
					let edge = new Edge({
						css:    this.css,
						// parent: glyph1.closestCommonAncestorWith(glyph2),
						glyph1,
						glyph2
					});
				
					/* notify the outside world */
					this.p('artefactCreated').next(edge);
					
					/* communicating new glyph1 to next iteration */
					args2.artefact = glyph2;
					
				})::enterState('DRAWING_EDGE');
				
			}
		}));
		
		/* mutual exclusion between this machine and other machines, coordinated by coach.stateMachine */
		const drawing = Observable.merge(
			localMachine.DRAWING_BOX,
			localMachine.DRAWING_GLYPH,
			localMachine.DRAWING_EDGE
		);
		localMachine.extend(() => ({ 'OTHER_TOOL': ()=>{} }));
		coach.stateMachine.extend(() => ({ 'IDLE': ()=>{}, 'BUSY': ()=>{} }));
		localMachine.link('IDLE',       coach.stateMachine.BUSY.filter(({tool}) => tool !== this).map(()=>localMachine.data), 'OTHER_TOOL');
		localMachine.link('OTHER_TOOL', coach.stateMachine.IDLE.filter(({tool}) => tool !== this).map(()=>localMachine.data), 'IDLE');
		coach.stateMachine.link('IDLE', drawing          .map(() => ({ tool: this })), 'BUSY');
		coach.stateMachine.link('BUSY', localMachine.IDLE.map(() => ({ tool: this })), 'IDLE');
		
		/* prep for highlighting and mouse cursors */
		const handlerArtefactOrNull = (key) => (a) => (a && a.handlers[key]) ? a.handlers[key].artefact : null;
		const drawZoneArtefact = coach.p('selectedArtefact').map(handlerArtefactOrNull('drawzone'));
		
		/* highlighting */
		coach.highlightTool.register(this, localMachine.p(['state', 'data']).switchMap(([state, data]) => match(state)({
			'IDLE':          drawZoneArtefact,
			'THRESHOLD':     Observable.of(data && data.artefact),
			'DRAWING_BOX':   Observable.of(data && data.artefact),
			'DRAWING_GLYPH': Observable.of(data && data.artefact),
			'DRAWING_EDGE':  Observable.of(data && data.artefact),
			'OTHER_TOOL':    Observable.of(null)
		})).map(a => a && !!a.handlers['highlightable'] ? a : null).map((artefact) => artefact && {
			...coach.highlightTool.HIGHLIGHT_DEFAULT,
			artefact
		}));
		 
		/* mouse cursors */
		const drawCursor = CSSPrefix.getValue('cursor', 'crosshair');
		coach.mouseCursorTool.register(this, localMachine.p('state').startWith(null).pairwise().switchMap(([prev, next]) => match(next)({
			'IDLE':          drawZoneArtefact.map(dza => dza && drawCursor).startWith(prev && drawCursor),
			'THRESHOLD':     Observable.of(drawCursor),
			'DRAWING_BOX':   Observable.of(drawCursor),
			'DRAWING_GLYPH': Observable.of(drawCursor),
			'DRAWING_EDGE':  Observable.of(drawCursor),
			'OTHER_TOOL':    Observable.of(null)
		})));
		
	}
}
