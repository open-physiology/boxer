import $ from '../libs/jquery.js';
import {assign, pick, isFunction} from 'lodash-bound';

import {withoutMod, stopPropagation} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront, ID_MATRIX, M11, M12, M21, M22} from "../util/svg";

import Tool, {handleBoxer} from './Tool';

const {min, max} = Math;


export class ResizeTool extends Tool {
	
	constructor({context}) {
		super({ context, events: ['mousedown', 'mouseenter'] });
		
		const mousemove = this.windowE('mousemove');
		const mouseup   = this.windowE('mouseup');
		
		
		
		// context.registerCursor((handleArtifact) => { // TODO: cursors
		// 	if (![BorderLine, CornerHandle].includes(handleArtifact.constructor)) { return false }
		// 	if (!handleArtifact.parent.free)                                      { return false }
		// 	let s = handleArtifact.resizes;
		// 	let angle = 0;
		// 	// if (s.top)             { angle =   0 }
		// 	// if (s.bottom)          { angle =   0 }
		// 	if (s.right)              { angle =  90 }
		// 	if (s.left)               { angle =  90 }
		// 	if (s.top    && s.left )  { angle = 135 }
		// 	if (s.top    && s.right)  { angle =  45 }
		// 	if (s.bottom && s.left )  { angle =  45 }
		// 	if (s.bottom && s.right)  { angle = 135 }
		// 	const m = handleArtifact.handle.getScreenCTM();
		// 	angle += Math.atan2(m[M21], m[M22]) * 180 / Math.PI;
		// 	return [
		// 		'ns-resize',   // 0,   0:  |
		// 		'nesw-resize', // 1,  45:  /
		// 		'ew-resize',   // 2,  90:  -
		// 		'nwse-resize'  // 3, 135:  \
		// 	][Math.floor((angle + 180/8) % 180 / (180/4)) % 4];
		// });
		
		context.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'IDLE': () => this.e('mousedown')
				.filter(withoutMod('ctrl', 'shift', 'meta'))
				.do(stopPropagation)
                // .withLatestFrom(context.p('selected')) // TODO: bring 'selected' back
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
			'RESIZING_RECTANGLE': ({point, artefact, directions, mouseDownIsOrigin}) => {
				/* start dragging */
				artefact.handlesActive = false;
				artefact.svg.main::moveToFront();
				
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
					.do(() => { artefact.handlesActive = true })
					::enterState('IDLE');
			}
		}));
	}
}
