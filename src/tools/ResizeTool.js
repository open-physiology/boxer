import $ from '../libs/jquery.js';
import {assign, pick, isFunction} from 'lodash-bound';

import {withoutMod, stopPropagation} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront, ID_MATRIX, M11, M12, M21, M22} from "../util/svg";

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';

const {min, max} = Math;


export class ResizeTool extends Tool {
	
	init({coach}) {
		super.init({ coach, events: ['mousedown', 'mouseenter'] });
		
		const mousemove = this.windowE('mousemove');
		const mouseup   = this.windowE('mouseup');
		
		
		coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'IDLE': () => this.e('mousedown')
				.filter(withoutMod('ctrl', 'shift', 'meta'))
				.do(stopPropagation)
                // .withLatestFrom(coach.p('selected')) // TODO: bring 'selected' back
				::handleBoxer('resizable')
		        ::enterState('INSIDE_RESIZE_THRESHOLD'),
			'INSIDE_RESIZE_THRESHOLD': (args) => [
				mousemove
					.take(4)
					.ignoreElements()
					::emitWhenComplete(args)
					::enterState('RESIZING_RECTANGLE'),
			    mouseup
				    ::enterState('IDLE')
			    // TODO: go IDLE on pressing escape
			],
			'RESIZING_RECTANGLE': (args) => {
				const {point, artefact, before, after, directions, mouseDownIsOrigin} = args;
				
				/* start dragging */
				artefact.handlesActive = false;
				artefact.e('moveToFront').next({ direction: 'out', source: artefact });
				// artefact.e('moveToFront').next({ direction: 'in'                    });
				if (before::isFunction()) { before(args) }
				
				/* record start dimensions and mouse position */
				const start = {
					transformation: artefact.transformation,
					width:          mouseDownIsOrigin ? 0 : artefact.width,
					height:         mouseDownIsOrigin ? 0 : artefact.height,
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
			
				/* stop resizing */
				mouseup
					.do(() => {
						if (after::isFunction()) { after(args) }
						artefact.handlesActive = true
					})
					::enterState('IDLE');
			}
		}));
	}
}
