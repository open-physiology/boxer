import $ from '../libs/jquery.js';
import {assign, pick, isFunction, includes} from 'lodash-bound';
import {Observable} from '../libs/expect-rxjs.js';
import CSSPrefix from 'cssprefix/src/cssprefix';

import {withoutMod, stopPropagation, property, match, which, event} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront, ID_MATRIX, M11, M12, M21, M22, getCTM, setCTM} from "../util/svg";

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
import {Canvas} from '../artefacts/Canvas';

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

export class PanTool extends MouseTool {
	
	init({coach}) {
		super.init({ coach });
		
		const mousemove = this.windowE('mousemove');
		const idle      = this.mouseMachine.IDLE;
		const threshold = this.mouseMachine.THRESHOLD
			::handleBoxer('pannable');
		const dragging = this.mouseMachine.DRAGGING
			::handleBoxer('pannable');
		const dropping = this.mouseMachine.DROPPING;
		
		/* local state machine */
		const localMachine = new Machine(this.constructor.name, { state: 'IDLE' });
		localMachine.extend(({ enterState, subscribeDuringState }) => ({
			'IDLE': () => {
				threshold::enterState('THRESHOLD');
			},
			'THRESHOLD': () => {
				dragging::enterState('PANNING');
				idle    ::enterState('IDLE');
			},
			'PANNING': (args) => {
				const {before, after, point, artefact} = args;
				
				/* pan initialization */
				if (before::isFunction()) { before(args) }
				
				/* record start dimensions and mouse position */
				const start = {
					transformation: artefact.transformation,
					mouse:          point
				};
				
				/* resize while dragging */
				mousemove
					.map(event => event.point.in(artefact.svg.children).minus(start.mouse))
					.map(({x: xDiff, y: yDiff}) => start.transformation.translate(xDiff, yDiff))
					::subscribeDuringState((m) => { artefact.transformation = m });
				
				/* cancel or stop dragging */
				dropping.do(({point}) => {
					/* stop drawing */
					// coach.selectTool.reacquire(point);
					coach.selectTool.reacquire();
					after::callIfFunction(); // TODO: pass args?
				})::enterState('IDLE');
				
			}
		}));
		
		/* mutual exclusion between this machine and other machines, coordinated by coach.stateMachine */
		localMachine.extend(() => ({ 'OTHER_TOOL': ()=>{} }));
		coach.stateMachine.extend(() => ({ 'IDLE': ()=>{}, 'BUSY': ()=>{} }));
		localMachine.link('IDLE',       coach.stateMachine.BUSY.filter(({tool}) => tool !== this).map(()=>localMachine.data), 'OTHER_TOOL');
		localMachine.link('OTHER_TOOL', coach.stateMachine.IDLE.filter(({tool}) => tool !== this).map(()=>localMachine.data), 'IDLE');
		coach.stateMachine.link('IDLE', localMachine.PANNING.map(() => ({ tool: this })), 'BUSY');
		coach.stateMachine.link('BUSY', localMachine.IDLE   .map(() => ({ tool: this })), 'IDLE');
		
		/* prep for mouse cursors */
		const handlerArtefactOrNull = (key) => (a) => (a && a.handlers[key]) ? a.handlers[key].artefact : null;
		const canvasArtefact = coach.p('selectedArtefact').map(handlerArtefactOrNull('pannable'));
		
		/* mouse cursors */
		const grabCursor     = CSSPrefix.getValue('cursor', 'grab'    );
		const grabbingCursor = CSSPrefix.getValue('cursor', 'grabbing');
		coach.mouseCursorTool.register(this, localMachine.p('state').startWith(null).pairwise().switchMap(([prev, next]) => match(next)({
			'IDLE':       canvasArtefact.map(ma => ma && grabCursor).startWith(prev && grabCursor),
			'THRESHOLD':  Observable.of(grabbingCursor),
			'PANNING':    Observable.of(grabbingCursor),
			'OTHER_TOOL': Observable.of(null)
		})));
	}
}
