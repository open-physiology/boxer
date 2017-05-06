import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {sineWave, animationFrames} from '../util/misc';
import {plainDOM} from '../libs/jquery';

export class SelectTool extends Tool {
	
	init({coach}) {
		super.init({ coach });
		
		coach.registerArtefactEvent('mouseenter', 'mouseleave'); // TODO: scroll
		
		coach.stateMachine.extend(({ subscribeDuringState }) => ({
			// TODO
		}), () => this.active);
	}
}
