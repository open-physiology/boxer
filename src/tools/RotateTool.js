import $ from '../libs/jquery.js';
import {isFunction} from 'lodash-bound';

import {TweenLite} from 'gsap/TweenLite';

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {withoutMod, stopPropagation, withMod} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront, rotateAroundPoint, M21, M22, MX, MY, Point2D} from "../util/svg";
import {MouseTool} from './MouseTool';
import {plainDOM} from '../libs/jquery';
import {Observable} from 'rxjs';

const {floor, abs, round, atan2, PI} = Math;


export class RotateTool extends MouseTool {
	
	static SNAP_ANGLE = 45;
	
	init({ coach }) {
		super.init({ coach });
		
		const mousemove = this.windowE('mousemove');
		const mouseup   = this.windowE('mouseup');
		
		const dragging = this.mouseMachine.DRAGGING
			.filter(() => this.active)
			.filter(withMod('shift'));
		const dropping = this.mouseMachine.DROPPING;
		coach.stateMachine
		     .link('IDLE', dragging::handleBoxer('rotatable'), 'ROTATING');
		
		coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'ROTATING': (args) =>  {
				const {point, artefact, before, after, referencePoint = point} = args;
				
				/* start rotating */
				if (before::isFunction()) { before(args) }
				artefact.handlesActive = false;
				artefact.moveToFront();
				
				/* pre-processing */
				const initialTransformation = artefact.transformation;
				const startAngle            = atan2(initialTransformation[M21], initialTransformation[M22]) * 180 / PI;
				const nonRotatedMatrix      = initialTransformation.rotate(-startAngle); // TODO: faster way to get non-rotated version of matrix (resetting M21 and M22?)
				const center                = Point2D.fromMatrixTranslation(nonRotatedMatrix, artefact.svg.main.parent()::plainDOM());
				const initialMouseAngle     = referencePoint.minus(center).angle();
				
				/* rotate while dragging */
				let tracking = {
					snapping: false,
					angle:    startAngle
				};
				mousemove.map((moveEvent) => {
					let angle = moveEvent.point.minus(center).angle();
					angle -= initialMouseAngle - startAngle;
					tracking.snapping = moveEvent.ctrlKey;
					if (tracking.snapping) {
						angle = round(angle / RotateTool.SNAP_ANGLE) * RotateTool.SNAP_ANGLE;
					}
					return (angle + 360) % 360;
				}).distinctUntilChanged().switchMap((angle) => {
					if (tracking.snapping) {
						let diff = angle - tracking.angle;
						while (diff < -180) { angle += 360; diff += 360; }
						while (diff > +180) { angle -= 360; diff -= 360 }
						return Observable.create((obs) => TweenLite.to(
							tracking,
							abs(diff) / 45 * 0.2,
							{
								angle: angle,
								ease: TweenLite.Power3.easeOut,
								onUpdate: ::obs.next,
								onComplete: () => {
									tracking.angle = (tracking.angle % 360 + 360) % 360;
								}
							}
						)).map(()=>tracking.angle);
					} else {
						return Observable.of(angle);
					}
				})::subscribeDuringState((angle) => {
					artefact.transformation = nonRotatedMatrix.rotate(angle);
				});
				
				/* stop rotating on mouseup */
				dropping
					.do(() => {
						artefact.handlesActive = true;
						artefact.moveToFront();
						if (after::isFunction()) { after(args) }
					})
					::enterState('IDLE');
				
			}
		}), () => this.active);
		
	}
	
	
	
}

