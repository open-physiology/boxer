import $ from '../libs/jquery.js';
import {isFunction} from 'lodash-bound';
import CSSPrefix from 'cssprefix/src/cssprefix';

import {Observable} from '../libs/expect-rxjs.js';

import {handleBoxer} from '../Coach.js';
import {withoutMod, match} from 'utilities';

import {snap45} from "../util/svg";
import {MouseTool} from './MouseTool';
import {callIfFunction} from '../util/misc';
import Machine from '../util/Machine';


export class MoveTool extends MouseTool {
	
	init({ coach }) {
		super.init({ coach });
		
		/* relevant mouse events */
		const mousemove = this.windowE('mousemove');
		const threshold = this.mouseMachine.THRESHOLD
			.filter(withoutMod('shift', 'ctrl', 'alt'))
			::handleBoxer('movable');
		const dragging = this.mouseMachine.DRAGGING
			::handleBoxer('movable');
		const dropping = this.mouseMachine.DROPPING;
		const escaping = this.mouseMachine.ESCAPING;
		
		/* main state machine of this tool */
		const localMachine = new Machine('MoveTool', { state: 'IDLE' });
		localMachine.extend(({ enterState, subscribeDuringState }) => ({
			'IDLE': () => {
						
				// console.log('(((IDLE)))');
				
				threshold::enterState('THRESHOLD');
				coach.selectTool.reacquire();
			},
			'THRESHOLD': () => {
						
				// console.log('(((THRESHOLD)))');
			
				dragging::enterState('DRAGGING');
				this.mouseMachine.IDLE::enterState('IDLE');
			},
			'DRAGGING': (args) => {
						
				// console.log('(((DRAGGING)))');
			
				const {point, artefact, before, after, cancel, referencePoint = point} = args;
				
				/* drag initialization */
				artefact.handlesActive = false;
				coach.selectTool.reacquire();
				artefact.moveToFront();
				if (before::isFunction()) { before(args) }
				
				/* record start transformation */
				const transformationStart = artefact.transformation;

				/* move while dragging */
				mousemove::subscribeDuringState((moveEvent) => {
					let mouseVector = moveEvent.point.in(artefact.svg.children);
					if (referencePoint && moveEvent.ctrlKey) {
						mouseVector = snap45(mouseVector, artefact, referencePoint);
					}
					let translationDiff = mouseVector.minus(point);
					artefact.transformation = transformationStart
						.translate(...translationDiff.xy);
				});
				
				/* cancel or stop dragging */
				Observable.merge(
					escaping
						.concatMap(Observable.throw()),
					dropping
						.map(({point, target}) => ({ dropzone: $(target).data('boxer-handlers').dropzone, point }))
						.do(({dropzone: {after}}) => { after::callIfFunction(args) })
				).catch((error, caught) => {
					/* cancel dragging */
					artefact.transformation = transformationStart;
					cancel::callIfFunction(args);
					return Observable.of({});
                }).do(({point}) => {
					// try {
						/* stop dragging */
						artefact.handlesActive = true;
						artefact.moveToFront();
						coach.selectTool.reacquire(point);
						after::callIfFunction(args);
						
					// 	console.log('(((DRAGGING -> IDLE)))');
					// } catch (err) {
					// 	console.error(err);
					// }
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
		const handlerArtefactOrNull = (key) => (a) => (a && a.handlers[key]) ? a.handlers[key].artefact : null;
		const movableArtefact  = coach.p('selectedArtefact').map(handlerArtefactOrNull('movable'));
		const dropzoneArtefact = coach.p('selectedArtefact').map(handlerArtefactOrNull('dropzone'));
		
		/* highlighting */
		coach.highlightTool.register(this, localMachine.p('state').switchMap(state => match(state)({
			'IDLE':       movableArtefact,//.do((ma) => { console.log('---', ma && ma.constructor.name) }),
			'THRESHOLD':  movableArtefact,
			'DRAGGING':   dropzoneArtefact.startWith(null),
			'OTHER_TOOL': Observable.of(null)
		})).map(artefact => artefact && {
			...coach.highlightTool.HIGHLIGHT_DEFAULT,
			artefact
		}));
		
		/* mouse cursors */
		const grabCursor     = CSSPrefix.getValue('cursor', 'grab'    );
		const grabbingCursor = CSSPrefix.getValue('cursor', 'grabbing');
		coach.mouseCursorTool.register(this, localMachine.p('state').startWith(null).pairwise().switchMap(([prev, next]) => match(next)({
			'IDLE':       movableArtefact.map(ma => ma && grabCursor).startWith(prev && grabCursor),
			'THRESHOLD':  Observable.of(grabbingCursor),
			'DRAGGING':   Observable.of(grabbingCursor),
			'OTHER_TOOL': Observable.of(null)
		})));
		
	}
	
	
	
}

