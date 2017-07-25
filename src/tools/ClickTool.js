import {isFunction} from 'lodash-bound';
import {handleBoxer} from '../Coach.js';
import {MouseTool} from './MouseTool';


export class ClickTool extends MouseTool {
	
	init({ coach }) {
		super.init({ coach });
		this.mouseMachine.CLICKING.filter(() => this.active)::handleBoxer('clickable').subscribe((handler) => {
			if (handler.handle::isFunction()) {
				handler.handle(handler);
			}
		});
	}
	
}

