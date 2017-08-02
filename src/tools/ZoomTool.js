import Tool from './Tool';
import {stopPropagation, withoutMod, property} from 'utilities';
import {multiply as _multiply} from 'lodash';

import {scaleFromPoint} from "../util/svg";

const {pow} = Math;


/**
 * A tool to zoom in and out on the main canvas using the scrollwheel,
 * centered around the current mouse-position.
 */
export class ZoomTool extends Tool {
	
	@property({ initial: 0.004             }) sensitivity;
	@property({ initial: 1, readonly: true }) factor;
	
	init({coach}) {
		super.init({coach});
		
		const mousewheel = this.rootE('mousewheel');
		
		const zooming = mousewheel
			.filter(withoutMod('alt', 'ctrl', 'meta'))
			.do(stopPropagation);
		
		/* maintain the current zoom-factor on the side (it doesn't actually influence zoom) */
		zooming
			.withLatestFrom(this.p('sensitivity'), ({deltaY: d}, s) => pow(1+s, d))
			.scan(_multiply, 1)
			.subscribe( this.pSubject('factor') );
		
		/* maintain zoom-exponent by mouse-wheel */
		zooming
			.withLatestFrom(coach.root.p('transformation'), this.p('sensitivity'),
				({originalEvent: {deltaY: d}, point}, m, s) => m::scaleFromPoint(pow(1+s, -d), point.in(coach.root.svg.children)))
			.subscribe( coach.root.p('transformation') );
		
	}
	
}
