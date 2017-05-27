import $ from '../libs/jquery.js';
import {assign, isFunction} from 'lodash-bound';
import {Observable} from '../libs/expect-rxjs.js';

import {withoutMod, match} from 'utilities';

import {M21, M22} from "../util/svg";

import {handleBoxer} from '../Coach.js';
import {MouseTool} from './MouseTool';
import {plainDOM} from '../libs/jquery';
import Machine from '../util/Machine';
import {callIfFunction} from '../util/misc';

const {min, max, floor} = Math;


export class ResizeTool extends MouseTool {
	
	init({coach}) {
		super.init({ coach });
		
		/* extend state machine */
		const mousemove = this.windowE('mousemove');
		const threshold = this.mouseMachine.THRESHOLD
			.filter(() => this.active)
			.filter(withoutMod('shift', 'ctrl', 'alt'))
			::handleBoxer('resizable');
		const dragging = this.mouseMachine.DRAGGING
			.filter(() => this.active)
			::handleBoxer('resizable');
		const dropping = this.mouseMachine.DROPPING;
		const escaping = this.mouseMachine.ESCAPING;
		
		/* determining proper resizing cursor */
		const borderCursor = (handler) => {
			if (!handler) { return null }
			
			let m = handler.artefact.svg.main::plainDOM().getScreenCTM();
			let angle = Math.atan2(m[M21], m[M22]) * 180 / Math.PI;

			let {x, y} = handler.directions;
			x = (x === -1) ? '-' : (x === 1) ? '+' : '0';
			y = (y === -1) ? '-' : (y === 1) ? '+' : '0';
			switch (x+' '+y) {
				case '0 -': { angle +=   0 } break;
				case '+ -': { angle +=  45 } break;
				case '+ 0': { angle +=  90 } break;
				case '+ +': { angle += 135 } break;
				case '0 +': { angle += 180 } break;
				case '- +': { angle += 225 } break;
				case '- 0': { angle += 270 } break;
				case '- -': { angle += 315 } break;
			}
			angle = (angle + 360) % 360;
			return [
				'ns-resize',   // 0,   0°:  |
				'nesw-resize', // 1,  45°:  /
				'ew-resize',   // 2,  90°:  -
				'nwse-resize'  // 3, 135°:  \
			][floor((angle + 180/8) % 180 / (180/4)) % 4];
		};
		
		/* main state machine of this tool */
		const localMachine = new Machine('ResizeTool', { state: 'IDLE' });
		localMachine.extend(({ enterState, subscribeDuringState }) => ({
			'IDLE': () => {
				threshold::enterState('THRESHOLD');
				coach.selectTool.reacquire();
			},
			'THRESHOLD': () => {
				dragging::enterState('DRAGGING');
				this.mouseMachine.IDLE::enterState('IDLE');
			},
			'DRAGGING': (args) => {
				const {point, artefact, before, after, cancel, directions} = args;
				
				/* drag initialization */
				artefact.handlesActive = false;
				coach.selectTool.reacquire();
				artefact.moveToFront();
				if (before::isFunction()) { before(args) }
				
				/* record start dimensions and mouse position */
				const start = {
					transformation: artefact.transformation,
					width:          artefact.width,
					height:         artefact.height,
					mouse:          point
				};
				
				/* resize while dragging */
				mousemove
					.map(event => event.point.in(artefact.svg.main).minus(start.mouse))
					::subscribeDuringState(({x: xDiff, y: yDiff}) => {
						xDiff = directions.x * max(directions.x * xDiff, artefact.minWidth  - start.width );
						yDiff = directions.y * max(directions.y * yDiff, artefact.minHeight - start.height);
						artefact::assign({
							transformation: start.transformation.translate(xDiff/2, yDiff/2),
							width:          start.width  + directions.x * xDiff,
							height:         start.height + directions.y * yDiff
						});
					});
				
				/* cancel or stop dragging */
				Observable.merge(
					escaping.concatMap(Observable.throw()),
					dropping.map(({point, target}) => ({
						dropzone: $(target).data('boxer-handlers').dropzone,
						point
					})).do(({dropzone}) => {
						// artefact.parent = dropzone.artefact; // TODO: Maybe we'll need this to snap borders
						dropzone.after::callIfFunction(args);
					})
				).catch((error, caught) => {
					/* cancel dragging */
					artefact.transformation = start.transformation;
					artefact.width  = start.width;
					artefact.height = start.height;
					cancel::callIfFunction(args);
					return Observable.of({});
                }).map(({point}) => {
					/* stop dragging */
					artefact.handlesActive = true;
					artefact.moveToFront();
					coach.selectTool.reacquire(point);
					after::callIfFunction(); // TODO: pass args?
					return { ...args, point };
				})::enterState('IDLE');
				
			}
		}));
		
		/* mutual exclusion between this machine and other machines, coordinated by coach.stateMachine */
		localMachine.extend(() => ({ 'OTHER_TOOL': ()=>{} }));
		coach.stateMachine.extend(() => ({ 'IDLE': ()=>{}, 'BUSY': ()=>{} }));
		localMachine.link('IDLE',       coach.stateMachine.BUSY.filter(({tool}) => tool !== this).map(()=>localMachine.data), 'OTHER_TOOL');
		localMachine.link('OTHER_TOOL', coach.stateMachine.IDLE.filter(({tool}) => tool !== this).map(()=>localMachine.data), 'IDLE');
		coach.stateMachine.link('IDLE', localMachine.DRAGGING.map(() => ({ tool: this })), 'BUSY');
		coach.stateMachine.link('BUSY', localMachine.IDLE    .map(() => ({ tool: this })), 'IDLE');
		
		/* prep for highlighting and mouse cursors */
		const handlerOrNull = (key) => (a) => (a && a.handlers[key] && a.handlers['highlightable']) ? a.handlers[key] : null;
		const resizableArtefact = coach.p('selectedArtefact').map((originalArtefact) => {
			let handler = handlerOrNull('resizable')(originalArtefact);
			if (!handler) { return null }
			return { originalArtefact, ...handler };
		});
		
		/* highlighting */
		coach.highlightTool.register(this, localMachine.p(['state', 'data']).switchMap(([state, data]) => match(state)({
			'IDLE':       resizableArtefact,
			'THRESHOLD':  Observable.of(data),
			'DRAGGING':   Observable.of(data),
			'OTHER_TOOL': Observable.of(null)
		})).map((handler) => handler && {
			...coach.highlightTool.HIGHLIGHT_DEFAULT,
			artefact: handler.originalArtefact
		}));
		 
		/* mouse cursors */
		coach.mouseCursorTool.register(this, localMachine.p(['state', 'data']).switchMap(([state, data]) => match(state)({
			'IDLE':       resizableArtefact.map(borderCursor),
			'THRESHOLD':  Observable.of(borderCursor(data)),
			'DRAGGING':   Observable.of(borderCursor(data)),
			'OTHER_TOOL': Observable.of(null)
		})));
		
	}
}
