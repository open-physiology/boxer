import {isFunction} from 'lodash-bound';

import {TweenLite} from 'gsap/TweenLite';

import {handleBoxer} from '../Coach.js';
import {withoutMod, withMod, match} from 'utilities';

import {M21, M22, Point2D} from "../util/svg";
import {MouseTool} from './MouseTool';
import {plainDOM} from '../libs/jquery';
import {Observable} from '../libs/expect-rxjs.js';
import {callIfFunction} from '../util/misc';
import Machine from '../util/Machine';
import CSSPrefix from 'cssprefix/src/cssprefix';

const {floor, abs, round, atan2, PI} = Math;


/**
 * A tool to rotate boxes and their content by drag-and-drop while SHIFT is pressed.
 */
export class RotateTool extends MouseTool {
	
	static SNAP_ANGLE = 45;
	
	init({ coach }) {
		super.init({ coach });
		
		/* relevant mouse events */
		const mousemove = this.windowE('mousemove');
		const threshold = this.mouseMachine.THRESHOLD
			.filter(() => this.active)
			.filter(withMod('shift')).filter(withoutMod('ctrl'))
			::handleBoxer('rotatable');
		const dragging = this.mouseMachine.DRAGGING
			.filter(() => this.active)
			::handleBoxer('rotatable');
		const dropping = this.mouseMachine.DROPPING;
		const escaping = this.mouseMachine.ESCAPING;
		
		/* main state machine of this tool */
		const localMachine = new Machine(this.constructor.name, { state: 'IDLE' });
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
				const {point, artefact, before, after, cancel, referencePoint = point} = args;
				
				/* drag initialization */
				artefact.handlesActive = false;
				coach.selectTool.reacquire();
				artefact.moveToFront();
				if (before::isFunction()) { before(args) }
				
				/* pre-processing */
				const start = {};
				start.transformation           = artefact.transformation;
				start.angle                    = atan2(start.transformation[M21], start.transformation[M22]) * 180 / PI;
				start.nonRotatedTransformation = start.transformation.rotate(-start.angle); // TODO: faster way to get non-rotated version of matrix (resetting M21 and M22?)
				start.center                   = Point2D.fromMatrixTranslation(start.nonRotatedTransformation, artefact.svg.main.parent()::plainDOM());
				start.mouseAngle               = referencePoint.minus(start.center).angle() - start.angle;
				
				/* rotate while dragging */
				let tracking = {
					snapping: false,
					angle:    start.angle
				};
				mousemove.map((moveEvent) => {
					let angle = moveEvent.point.minus(start.center).angle();
					angle -= start.mouseAngle;
					tracking.snapping = moveEvent.altKey;
					if (tracking.snapping) {
						angle = round(angle / RotateTool.SNAP_ANGLE) * RotateTool.SNAP_ANGLE;
					}
					return (angle + 360) % 360;
				}).distinctUntilChanged().switchMap((angle) => {
					if (tracking.snapping) {
						let diff = angle - tracking.angle;
						while (diff < -180) { angle += 360; diff += 360; }
						while (diff > +180) { angle -= 360; diff -= 360; }
						return Observable.create((obs) => TweenLite.to(
							tracking,
							abs(diff) / 45 * 0.2,
							{
								angle,
								ease: TweenLite.Power3.easeOut,
								onUpdate: ::obs.next,
								onComplete: () => { tracking.angle = (tracking.angle % 360 + 360) % 360 }
							}
						)).share().map(()=>tracking.angle);
					} else {
						return Observable.of(angle);
					}
				})::subscribeDuringState((angle) => {
					artefact.transformation = start.nonRotatedTransformation.rotate(angle);
				});
				
				/* cancel or stop dragging */
				Observable.merge(
					escaping.concatMap(Observable.throw()),
					dropping
				).catch((error, caught) => {
					/* cancel dragging */
					artefact.transformation = start.transformation;
					cancel::callIfFunction(args);
					return Observable.of({});
                }).do(({point}) => {
					/* stop dragging */
					artefact.handlesActive = true;
					coach.selectTool.reacquire(point);
					after::callIfFunction(); // TODO: pass args?
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
		const handlerOrNull = (key) => (a) => (a && a.handlers[key] && a.handlers['highlightable']) ? a.handlers[key].artefact : null;
		const rotatableArtefact = coach.p('selectedArtefact').map((originalArtefact) => {
			let handler = handlerOrNull('rotatable')(originalArtefact);
			if (!handler) { return null }
			return { originalArtefact, ...handler };
		});
		
		/* highlighting */
		coach.highlightTool.register(this, localMachine.p(['state', 'data']).switchMap(([state, data]) => match(state)({
			'IDLE':       rotatableArtefact,
			'THRESHOLD':  Observable.of(data),
			'DRAGGING':   Observable.of(data),
			'OTHER_TOOL': Observable.of(null)
		})).map(handler => handler && {
			...coach.highlightTool.HIGHLIGHT_DEFAULT,
			artefact: handler.originalArtefact
		}));
		
		/* mouse cursors */
		const grabCursor     = CSSPrefix.getValue('cursor', 'grab'    );
		const grabbingCursor = CSSPrefix.getValue('cursor', 'grabbing');
		coach.mouseCursorTool.register(this, localMachine.p('state').startWith(null).pairwise().switchMap(([prev, next]) => match(next)({
			'IDLE':       rotatableArtefact.map(ma => ma && grabCursor).startWith(prev && grabCursor),
			'THRESHOLD':  Observable.of(grabbingCursor),
			'DRAGGING':   Observable.of(grabbingCursor),
			'OTHER_TOOL': Observable.of(null)
		})));
		
	}
	
	
	
}

