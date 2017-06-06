import $ from '../libs/jquery.js';
import Tool from './Tool';
import {stopPropagation, withoutMod, property} from 'utilities';
import {multiply as _multiply} from 'lodash';

import {scaleFromPoint, ID_MATRIX, setCTM} from "../util/svg";

const {max} = Math;

export class ViewAreaTool extends Tool {
	
	zoomToFit({x, y, width, height}) {
		var parent = this.coach.root.svg.main;
		var fullWidth = parent.width(),
		    fullHeight = parent.height();
		var midX = x + width / 2,
		    midY = y + height / 2;
		if (width == 0 || height == 0) return; // nothing to fit
		const paddingPercent = 0.75;
		var scale = paddingPercent / max(width / fullWidth, height / fullHeight);
		var translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
	
		
		const transformation = ID_MATRIX.translate(...translate).scale(scale);
		
		this.coach.root.transformation = transformation;
		
		
		// console.trace("zoomFit", translate, scale);
		// root
		// 	.transition()
		// 	.duration(transitionDuration || 0) // milliseconds
		// 	.call(zoom.translate(translate).scale(scale).event);
	}
	
}
