import $ from '../libs/jquery.js';
import {isFunction} from 'lodash-bound';

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
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
	
	init({ coach }) {
		super.init({ coach, events: ['mousedown', 'mouseenter'] });
		
		const mousemove = this.windowE('mousemove');
		const mouseup   = this.windowE('mouseup');
		
		coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'IDLE': () => this.e('mousedown')
				.filter(withoutMod('ctrl', 'shift', 'meta'))
				.do(stopPropagation)
                // .withLatestFrom(coach.p('selected')) // TODO: bring 'selected' back
				::handleBoxer('draggable')
				::enterState('INSIDE_MOVE_THRESHOLD'),
			'INSIDE_MOVE_THRESHOLD': (args) => [
				mousemove
					.take(4)
					.ignoreElements()
					::emitWhenComplete(args)
					::enterState('MOVING'),
			    mouseup
				    ::enterState('IDLE')
				// TODO: go IDLE on pressing escape
			],
			'MOVING': (args) =>  {
				const {point, artefact, before, after, referencePoint} = args;
				
				/* start dragging */
				if (before::isFunction()) { before(args) }
				artefact.handlesActive = false;
				artefact.moveToFront();
				// artefact.e('moveToFront').next({ direction: 'in'                    });
				
				/* record start transformation */
				const transformationStart = artefact.transformation;
				
				/* move while dragging */
				mousemove::subscribeDuringState((moveEvent) => {
					let mouseVector = moveEvent.point.in(artefact.svg.main);
					if (referencePoint && moveEvent.ctrlKey) {
						mouseVector = snap45(mouseVector, artefact, referencePoint);
					}
					let translationDiff = mouseVector.minus(point);
					artefact.transformation = transformationStart
						.translate(...translationDiff.xy);
				});
				
				/* stop dragging and drop */
				// const initial_dragged_transformation = artefact.transformation;
				// const initial_dragged_parent         = artefact.parent;
				mouseup
					// .withLatestFrom(coach.p('selected'))
					.do((mouseUpEvent) => {
					
						const handler = $(mouseUpEvent.target).data('boxer-handler');
						if (handler) {
							const dropzone = handler.dropzone;
							artefact.parent = dropzone.artefact;
						}
					
						// TODO: allow dropzone to reject artefact;
						//     : if it does, put artefact back in old location
						
						/* stop dragging */
						artefact.handlesActive = true;
						artefact.moveToFront();
						if (after::isFunction()) { after(args) }
				    })
					::enterState('IDLE');
			}
		}));
		
		
		
	}
	
	
	
}

