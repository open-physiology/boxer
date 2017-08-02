import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {entries, values, isUndefined} from 'lodash-bound';

import {ID_MATRIX, SVGMatrix, setCTM, Point2D} from '../util/svg.js';
import {property, flag} from 'utilities';


import {LineSegment} from './LineSegment.js';

/**
 * Representation of a Box border.
 */
export class BoxBorder extends LineSegment {
	
	side: ?{key: 'top',    x:  0, y: -1}
		 | {key: 'bottom', x:  0, y:  1}
		 | {key: 'left',   x: -1, y:  0}
		 | {key: 'right',  x:  1, y:  0};
	
	constructor(...args) {
		super(...args);
		this.side = args.side;
	}
	
}
