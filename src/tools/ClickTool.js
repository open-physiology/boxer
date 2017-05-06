import $ from '../libs/jquery.js';
import {isFunction} from 'lodash-bound';

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {withoutMod, stopPropagation} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront} from "../util/svg";
import Machine from '../util/Machine';
import {MouseTool} from './MouseTool';


export class ClickTool extends MouseTool {
	
	init({ coach }) {
		super.init({ coach });
		
		coach.highlightTool.register(['IDLE'], ['clickable'], () => this.active, () => coach.highlightTool.HIGHLIGHT_DEFAULT);
		
		this.mouseMachine.CLICKING.filter(() => this.active)::handleBoxer('clickable').subscribe((handler) => {
			if (handler.handle::isFunction()) {
				handler.handle(handler);
			}
		});
	}
	
	
	
}

