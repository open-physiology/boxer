import $ from '../libs/jquery.js';
import Tool from './Tool';

export class HelperTool extends Tool {
	
	showPoint(point, attrs) {
		
		point = point.in(this.coach.root.svg.main);
		
		let indicator = $.svg('<circle>').attr({
			...point.obj('cx', 'cy'),
			r: 5,
			fill: 'red',
			stroke: 'black',
			...attrs
		}).css({
			'pointer-events': 'none'
		}).appendTo(this.coach.root.svg.main);
		
		setTimeout(::indicator.remove, 500);
		
	}
	
}
