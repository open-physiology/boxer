import $ from '../libs/jquery.js';
import {GlobalBehaviorTool} from './GlobalBehaviorTool';

export class MouseCursorTool extends GlobalBehaviorTool {
	
	deactivateBehavior() {
		$(this.coach.root.svg.main).css({ cursor: '' });
	}
	
	activateBehavior(cursor) {
		$(this.coach.root.svg.main).css({ cursor });
	}
	
}
