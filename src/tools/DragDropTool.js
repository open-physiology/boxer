import $ from '../libs/jquery.js';

import {assign, isFunction} from 'lodash-bound';

import Tool from './Tool';
import {withoutMod, stopPropagation} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront} from "../util/svg";


// function reassessHoveredArtefact(a) { // TODO: not sure if this is still needed
// 	if (!a){ return }
// 	a.svg.handles.mouseleave();
// 	reassessHoveredArtefact(a.parent);
// 	if (a.svg.handles.is(':hover')) {
// 		a.svg.handles.mouseenter();
// 	}
// }


export class DragDropTool extends Tool {
	
	constructor({ context }) {
		super({ context, events: ['mousedown', 'mouseenter'] });
		
		const mousemove = this.windowE('mousemove');
		const mouseup   = this.windowE('mouseup');
		
		context.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'IDLE': () => this.e('mousedown')
				.filter(withoutMod('ctrl', 'shift', 'meta'))
				.do(stopPropagation)
                // .withLatestFrom(context.p('selected')) // TODO: bring 'selected' back
				.filter(event => $(event.target).data('boxer-handler').draggable)
				.map(event => ({
					mousedownPoint: event.point,
					movingArtefact: $(event.target).data('boxer-handler').draggable.artefact
				}))
				::enterState('INSIDE_MOVE_THRESHOLD'),
			'INSIDE_MOVE_THRESHOLD': ({mousedownPoint, movingArtefact}) => [
				mousemove
					.take(4)
					.ignoreElements()
					::emitWhenComplete({mousedownPoint, movingArtefact})
					::enterState('MOVING'),
			    mouseup
				    ::enterState('IDLE')
				// TODO: go IDLE on pressing escape
			],
			'MOVING': ({mousedownPoint, movingArtefact, referencePoint}) =>  {
				/* start dragging */
				movingArtefact.handlesActive = false;
				movingArtefact.svg.main::moveToFront();
				
				/* record start dimensions */
				const transformationStart = movingArtefact.transformation;
				
				/* move while dragging */
				mousemove::subscribeDuringState((moveEvent) => {
					let mouseVector = moveEvent.point.in(movingArtefact.coordinateSystem);
					if (referencePoint && moveEvent.ctrlKey) {
						mouseVector = snap45(mouseVector, movingArtefact, referencePoint);
					}
					let translationDiff = mouseVector.minus(mousedownPoint.in(movingArtefact.coordinateSystem));
					movingArtefact.transformation = transformationStart
						.translate(...translationDiff.xy);
				});
				
				/* stop dragging and drop */
				// const initial_dragged_transformation = movingArtefact.transformation;
				// const initial_dragged_parent         = movingArtefact.parent;
				mouseup
					// .withLatestFrom(context.p('selected'))
					.do((mouseUpEvent) => {
					
						let dropzone = $(mouseUpEvent.target).data('boxer-handler').dropzone;
						if (dropzone) {
							movingArtefact.coordinateSystem = dropzone.artefact;
						}
					
						// /* either drop it on the recipient */
						// let success = false;
						// if (recipient.drop::isFunction()) {
						// 	success = recipient.drop(movingArtefact, recipient) !== false;
						// }
						// /* or revert to previous state if recipient rejects it */
						// if (!success) {
						// 	movingArtefact::assign({
						// 		transformation: initial_dragged_transformation,
						// 		parent:         initial_dragged_parent
						// 	});
						// }
						
						/* stop dragging */
						movingArtefact.handlesActive = true;
				    })
					::enterState('IDLE');
			}
		}));
		
		
		
	}
	
	
	
}

