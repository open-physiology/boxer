import $ from '../libs/jquery.js';
import {assign, pick, isFunction, sum} from 'lodash-bound';
import RxCSS from 'rxcss';

import {withoutMod, stopPropagation} from 'utilities';
import {emitWhenComplete} from '../util/misc.js';

import {snap45, moveToFront, ID_MATRIX, M11, M12, M21, M22} from "../util/svg";

import Tool, {handleBoxer} from './Tool';
import {sineWave, animationFrames} from '../util/misc';

const {floor, sin, PI, min, max} = Math;


export class HelperTool extends Tool {
	
	showPoint(point, attrs) {
		
		point = point.in(this.context.coordinateSystem);
		
		let indicator = $.svg('<circle>').attr({
			...point.obj('cx', 'cy'),
			r: 5,
			fill: 'red',
			stroke: 'black',
			...attrs
		}).css({
			'pointer-events': 'none'
		}).appendTo(this.context.coordinateSystem);
		
		setTimeout(() => {
			indicator.remove();
		}, 500);
		
	}
	
}
