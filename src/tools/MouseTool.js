import {pick} from 'lodash-bound';

import Tool from './Tool';
import {which} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

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
		
		this.mouseMachine = new Machine('Mouse', { state: 'IDLE' });
		
		let selectedArtefact = null; // TODO: Why is this needed? .withLatestFrom() isn't working.
		coach.p('selectedArtefact').subscribe((a) => { selectedArtefact = a });
		
		this.mouseMachine.extend(({ enterState }) => ({
			'IDLE': () => [
		        this.e('mousedown')
		            .filter(() => this.active)
		            .map(e => [e, selectedArtefact])
		            .filter(([e, a]) => !!a)
		            .map(([e, artefact]) => ({
			            point:    e.point,
				        artefact: artefact,
			            ...e::pick('shiftKey', 'ctrlKey', 'altKey')
			        }))
			        ::enterState('THRESHOLD'),
		        keydown::which(KEY_ESCAPE)::enterState('ESCAPING')
			],
			'THRESHOLD': (args) => [
				mousemove
					.filter(() => this.active)
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
		}));
	}
	
}
