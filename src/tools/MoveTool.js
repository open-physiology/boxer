import $ from '../libs/jquery.js';
import {isFunction, assign} from 'lodash-bound';
import CSSPrefix from 'cssprefix/src/cssprefix';

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {withoutMod, stopPropagation} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront} from "../util/svg";
import {MouseTool} from './MouseTool';

export class MoveTool extends MouseTool {
	
	init({ coach }) {
		super.init({ coach });
		
		/* determining proper moving cursor */
		coach.mouseCursorTool.register(['IDLE'], ['movable'], () => this.active, () => CSSPrefix.getValue('cursor', 'grab')    );
		coach.mouseCursorTool.register(['MOVING'], ['*'],     () => this.active, () => CSSPrefix.getValue('cursor', 'grabbing'));
		/* determining proper  */
		coach.highlightTool.register(['IDLE'],   ['movable'],  () => this.active, () => coach.highlightTool.HIGHLIGHT_DEFAULT);
		coach.highlightTool.register(['MOVING'], ['dropzone'], () => this.active, () => coach.highlightTool.HIGHLIGHT_DEFAULT);
		
		
		
		/* extend state machine */
		const mousemove = this.windowE('mousemove');
		const mouseup   = this.windowE('mouseup');
		const dragging = this.mouseMachine.DRAGGING
			.filter(() => this.active)
			.filter(withoutMod('shift', 'ctrl', 'alt'));
		const dropping = this.mouseMachine.DROPPING;
		const escaping = this.mouseMachine.ESCAPING;
		coach.stateMachine.link('IDLE', dragging::handleBoxer('movable'), 'MOVING');
		coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'MOVING': (args) =>  {
				const {point, artefact, before, after, cancel, referencePoint} = args;
				
				/* start dragging */
				if (before::isFunction()) { before(args) }
				artefact.handlesActive = false;
				artefact.moveToFront();
				
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
				
				/* cancelling */
				escaping
					.do(() => {
						artefact.transformation = transformationStart;
						artefact.handlesActive = true;
						if (cancel::isFunction()) { cancel(args) }
					})
					::enterState('IDLE');
				
				/* stop dragging and drop */
				dropping
					// .withLatestFrom(coach.p('selected'))
					.do((mouseUpEvent) => {
						const handlers = $(mouseUpEvent.target).data('boxer-handlers');
						if (handlers) {
							const dropzone = handlers.dropzone;
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
		}), () => this.active);
		
	}
	
	
	
}

