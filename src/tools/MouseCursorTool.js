import $ from '../libs/jquery.js';
import CSSPrefix from 'cssprefix/src/cssprefix';

import {stopPropagation} from 'utilities';

import {M21, M22} from "../util/svg";

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {plainDOM} from '../libs/jquery';

const {floor} = Math;


export class MouseCursorTool extends Tool {
	
	init({coach}) {
		super.init({ coach, events: ['mouseenter', 'mouseleave'] });
		
		/* determining proper resizing cursor */
		const borderCursor = (handler) => {
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
		
		/* keeping track of  */
		let cursor        = '';
		let cursorHandler = null;
		const setCursor = (c, h) => {
			cursor        = c;
			cursorHandler = h;
			$(coach.root.svg.main).css({ cursor });
		};
		
		/* use events */
		coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'IDLE': () => {
				setCursor('', null);
				this.e('mouseenter')
				    .do(stopPropagation)
					::handleBoxer('resizable')
					::subscribeDuringState((handler) => {
						setCursor(borderCursor(handler), handler);
					});
				this.e('mouseenter')
				    .do(stopPropagation)
					::handleBoxer('draggable')
					::subscribeDuringState((handler) => {
						setCursor(CSSPrefix.getValue('cursor', 'grab'), handler);
					});
				for (let handlerType of ['resizable', 'draggable']) this.e('mouseleave')
				    .do(stopPropagation)
					::handleBoxer(handlerType)
					::subscribeDuringState((handler) => {
						if (cursorHandler && cursorHandler.artefact === handler.artefact) {
							setCursor('', null);
						}
					})
			},
			'INSIDE_MOVE_THRESHOLD': (handler) => {
				setCursor(CSSPrefix.getValue('cursor', 'grabbing'), handler);
			},
			'MOVING': (handler) => {
				setCursor(CSSPrefix.getValue('cursor', 'grabbing'), handler);
			}
		}));
		
	}
}
