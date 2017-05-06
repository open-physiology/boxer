import $ from '../libs/jquery.js';
import {GlobalBehaviorTool} from './GlobalBehaviorTool';

export class MouseCursorTool extends GlobalBehaviorTool {
	
	registerCursor(...args) {
		this.register(...args); // TODO: refactor this away
	}
	
	activateGlobalBehavior({ value }) {
		if (value === null) { value = '' }
		$(this.coach.root.svg.main).css({ cursor: value });
	}
	
}
