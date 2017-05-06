import $ from '../libs/jquery.js';
import {assign, pick, isFunction} from 'lodash-bound';

import {withoutMod, stopPropagation} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront, ID_MATRIX, M11, M12, M21, M22} from "../util/svg";

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {MouseTool} from './MouseTool';
import {plainDOM} from '../libs/jquery';

const {min, max, floor} = Math;


export class ResizeTool extends MouseTool {
	
	init({coach}) {
		super.init({ coach });
		
		/* determining proper resize highlighting */
		coach.highlightTool.register(['IDLE'],         ['resizable'], () => this.active, () => coach.highlightTool.HIGHLIGHT_DEFAULT);
		coach.highlightTool.register(['RESIZING_BOX'], ['previous resizable'],  () => this.active, () => coach.highlightTool.HIGHLIGHT_DEFAULT);
		
		/* determining proper resizing cursor */
		const borderCursor = (handler) => {
			if (!handler.directions) { return }
			
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
		coach.mouseCursorTool.register(['IDLE'], ['resizable'], () => this.active, borderCursor);
		coach.mouseCursorTool.register(['RESIZING_BOX'], ['*'], () => this.active, borderCursor);
		
		/* extend state machine */
		const mousemove = this.windowE('mousemove');
		const mouseup   = this.windowE('mouseup');
		const dragging = this.mouseMachine.DRAGGING
			.filter(() => this.active)
			.filter(withoutMod('shift', 'ctrl', 'alt'))
			::handleBoxer('resizable');
		const dropping = this.mouseMachine.DROPPING;
		coach.stateMachine.link('IDLE', dragging, 'RESIZING_BOX');
		coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'RESIZING_BOX': (args) => {
				const {point, artefact, before, after, directions} = args;
				
				/* start resizing */
				artefact.handlesActive = false;
				artefact.e('moveToFront').next({ direction: 'out', source: artefact });
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
			
				/* stop resizing */
				dropping
					.do(() => {
						if (after::isFunction()) { after(args) }
						artefact.handlesActive = true
					})
					::enterState('IDLE');
			}
		}), () => this.active);
	}
}
