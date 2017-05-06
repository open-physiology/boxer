import $ from '../libs/jquery.js';
import {isFunction} from 'lodash-bound';

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {withoutMod, stopPropagation, which} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront} from "../util/svg";
import Machine from '../util/Machine';
import KeyCode from 'keycode-js';
const {KEY_ESCAPE} = KeyCode;

export class MouseTool extends Tool {

	static DRAG_THRESHOLD = 4;
	
	init({ coach, events = [] }) {
		super.init({ coach, events: [...events, 'mousedown'] });
		
		const mousemove = this.windowE('mousemove');
		const mouseup   = this.windowE('mouseup');
		const keydown   = this.windowE('keydown');
		
		this.mouseMachine = new Machine('Mouse', { state: 'IDLE', log: 'info' });
		
		this.mouseMachine.extend(({ enterState }) => ({
			'IDLE': () => [
		        this.e('mousedown')::enterState('INSIDE_DRAG_THRESHOLD'),
		        keydown::which(KEY_ESCAPE)::enterState('ESCAPING')
			],
			'INSIDE_DRAG_THRESHOLD': (args) => [
				mousemove
					.take(MouseTool.DRAG_THRESHOLD)
					.ignoreElements()
					::emitWhenComplete(args)
					::enterState('DRAGGING'),
			    mouseup
				    ::enterState('CLICKING'),
			    keydown
					::which(KEY_ESCAPE)
			        ::enterState('ESCAPING')
			],
			'DRAGGING': () => [
	            mouseup::enterState('DROPPING'),
                keydown::which(KEY_ESCAPE)::enterState('ESCAPING')
			],
			'CLICKING': () => { enterState('IDLE') },
			'DROPPING': () => { enterState('IDLE') },
			'ESCAPING': () => { enterState('IDLE') }
		}), () => this.active);
	}
	
}

