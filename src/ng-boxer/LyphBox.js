import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {entries, isEmpty, isArray, pull, merge} from 'lodash-bound';
import {Observable} from 'rxjs';

import {ID_MATRIX, Point2D} from '../util/svg.js';
import {property, flag, definePropertiesByValue, ValueTracker} from 'utilities';
import {_isNonNegative} from '../util/misc.js';

import {Box, Glyph, Edge, LineSegment, BoxCorner, Canvas, Coach} from '../index.js';

 
/**
 * Representation of an interactive rectangle in svg space.
 */
export class LyphBox extends Box {
	
	constructor(options = {}) {
		super(options::merge({
			css: { '&': { fill: 'black' } }
		}));
	}
	
	setColor(color) {
		// TODO: set fill color of inner box
		console.log('setting color:', color);
	}
	
	// postCreate(options = {}) {
	// 	super.postCreate(options);
	//
	// 	this.setCSS({
	// 		'&': { fill: 'black' }
	// 	});
	//
	// 	// console.log('LyphBox');
	//
	// }
	
	
}
