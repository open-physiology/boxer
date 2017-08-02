import $ from '../libs/jquery.js';
import {GlobalBehaviorTool} from './GlobalBehaviorTool';

/**
 * A tool that can change the mouse cursor based on some observable conditions.
 * Those specific conditions and the specific mouse-cursor to use
 * are defined inside the tools that want to use mouse cursors
 * to signal their state; using `coach.mouseCursorTool.register()`.
 */
export class MouseCursorTool extends GlobalBehaviorTool {
	
	deactivateBehavior() {
		$(this.coach.root.svg.main).css({ cursor: '' });
	}
	
	activateBehavior(cursor) {
		$(this.coach.root.svg.main).css({ cursor });
	}
	
}
