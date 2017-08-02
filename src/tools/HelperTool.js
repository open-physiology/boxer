import $ from '../libs/jquery.js';
import Tool from './Tool';


/**
 * A debugging tool that can make little red circles appear on-screen
 * at certain specific coordinates.
 */
export class HelperTool extends Tool {
	
	showPoint(point, attrs) {
		
		point = point.in(this.coach.root.svg.main);
		
		let center = $.svg('<circle>').attr({
			...point.obj('cx', 'cy'),
			r: 5,
			fill: 'red',
			stroke: 'black',
			...attrs
		}).css({
			'pointer-events': 'none'
		}).appendTo(this.coach.root.svg.main);
		
		setTimeout(::center.remove, 500);
		
	}
	
}
