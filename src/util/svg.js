import $, {plainDOM} from '../libs/jquery.js';
import {assign, pick, minBy, isUndefined} from 'lodash-bound';

import assert from 'power-assert';

const {abs, sqrt, atan2, PI} = Math;

/* constants to use as keys to get matrix values */
//
//  [ M11 M12 MX ]
//  [ M21 M22 MY ]
//
/** key to row 1 column 1 in an `SVGMatrix`                      */ export const M11 = 'a';
/** key to row 2 column 1 in an `SVGMatrix`                      */ export const M21 = 'b';
/** key to row 1 column 2 in an `SVGMatrix`                      */ export const M12 = 'c';
/** key to row 2 column 2 in an `SVGMatrix`                      */ export const M22 = 'd';
/** key to row 1 column 3 in an `SVGMatrix`, i.e., x-translation */ export const MX  = 'e';
/** key to row 2 column 3 in an `SVGMatrix`, i.e., y-translation */ export const MY  = 'f';

/**
 * a single <svg> element in memory for utility purposes
 * @type {SVGSVGElement}
 * @private
 */
const refSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");

/**
 * the matrix representing the identity transformation (not changing anything)
 * @type {SVGMatrix}
 */
export const ID_MATRIX  = refSVG.createSVGMatrix();

/**
 * a (0, 0) point in svg space
 */
export const ORIG_POINT = refSVG.createSVGPoint();

/**
 * The `SVGMatrix` class, which is not 'just available' in JavaScript.
 */
export const SVGMatrix = ID_MATRIX.constructor;

/**
 * The `SVGPoint` class, which is not 'just available' in JavaScript.
 */
export const SVGPoint = ORIG_POINT.constructor;

/**
 * Test equality between two matrices.
 * @param {SVGMatrix} M1
 * @param {SVGMatrix} M2
 * @return {boolean} `true` if the two matrices are equal; `false` otherwise
 */
export function matrixEquals(M1, M2) {
	return [M11, M12, M21, M22, MX, MY]
		.every(key => M1[key] === M2[key]);
}

/**
 * Change the current transformation matrix of an svg element.
 * @this  {SVGElement} the element to transform
 * @param {SVGMatrix}  matrix
 * @returns {SVGElement} the element that was transformed (so you could chain other method-calls)
 * @example shape::setCTM( ID_MATRIX.translate(x, y) );
 */
export function setCTM(matrix) {
	if (!this::plainDOM().transform) {
		$(this).attr('transform', '');
	}
	assert(this::plainDOM().transform, `You probably tried to create an svg element outside the svg namespace.`);
	this::plainDOM().transform.baseVal.initialize(refSVG.createSVGTransformFromMatrix(matrix));
	return this;
}

/**
 * @return {SVGMatrix} the current transformation matrix of a given svg element
 * @this {SVGElement} the svg element of which to get the current transformation matrix
 * @example let matrix = shape::getCTM();
 */
export function getCTM() {
	if (this::plainDOM().transform && this::plainDOM().transform.baseVal && this::plainDOM().transform.baseVal.numberOfItems) {
		return this::plainDOM().transform.baseVal.getItem(0).matrix;
	}
	return ID_MATRIX;
}

/**
 * Create a new `SVGPoint`. The `SVGPoint` class itself cannot be used for this.
 * @param {number} x
 * @param {number} y
 * @return {SVGPoint} the newly created svg point
 */
function newSVGPoint(x, y) {
	let result = refSVG.createSVGPoint();
	result::assign({x, y});
	return result;
}


/**
 * A representation of a vector in 2D SVG space, not necessarily with a
 * specific reference-frame.
 * @see Point2D
 */
export class Vector2D {
	
	/**
	 * Create a new `Vector2D`.
	 * @param {Object} other
	 * @param {number} other.x
	 * @param {number} other.y
	 */
	constructor(other) {
		if (other instanceof Vector2D) {
			this.svgPoint = other.svgPoint;
		} else {
			this.svgPoint = refSVG.createSVGPoint();
			this.svgPoint::assign(other::pick('x', 'y'));
		}
	}
	
	/**
	 * Create a new vector from the translation component of a matrix.
	 * @param {SVGMatrix} m - the matrix from which to take the translation
	 * @returns {Vector2D}  - the new vector
	 */
	static fromMatrixTranslation(m) {
		return new this({ x: m[MX], y: m[MY] });
	}
	
	/**
	 * The raw SVGPoint instance.
	 * @readonly
	 */
	svgPoint;
	
	/**
	 * the x-dimension value of this vector
	 * @type {number}
	 * @readonly
	 */
	get x (): number { return this.svgPoint.x }
	
	/**
	 * the y-dimension value of this vector
	 * @type {number}
	 * @readonly
	 */
	get y (): number { return this.svgPoint.y }
	
	/**
	 * a simple `[x, y]` representation of this vector
	 * @type {[number, number]}
	 * @readonly
	 */
	get xy(): Array<number, number> { return [this.x, this.y] }
	
	/**
	 * Add this vector to another vector.
	 * Does not modify this vector, but returns a new one.
	 * @param   {Vector2D} other - the other vector
	 * @returns {Vector2D}       - the pointwise addition of both vectors
	 */
	plus(other: Vector2D): Vector2D {
		return new Vector2D({
			x: this.x + other.x,
			y: this.y + other.y
		});
	}
	
	/**
	 * Subtract another vector from this one.
	 * Does not modify this vector, but returns a new one.
	 * @param   {Vector2D} other - the other vector
	 * @returns {Vector2D}       - the pointwise subtraction of both vectors
	 */
	minus(other: Vector2D): Vector2D {
		return new Vector2D({
			x: this.x - other.x,
			y: this.y - other.y,
		});
	}
	
	/**
	 * Multiply this vector by a scalar.
	 * Does not modify this vector, but returns a new one.
	 * @param   {number} scalar - the scalar
	 * @returns {Vector2D}      - this vector multiplied by a scalar
	 */
	times(scalar: number): Vector2D {
		if (scalar === 1) { return this }
		return new Point2D({
			x: this.x * scalar,
			y: this.y * scalar
		});
	}
	
	/**
	 * Get the angle this vector makes.
	 * @returns {number} the angle this vector makes with the positive y-axis
	 */
	angle(): number {
		const l = this.length;
		return atan2(this.y/l, this.x/l) * 180 / PI;
	}
	
	/**
	 * the length of this vector squared;
	 * use this if you can; it's more efficient than `length`
	 * @see Vector2D#length
	 */
	get lengthSquared(): number {
		return this.x*this.x + this.y*this.y;
	}
	
	/**
	 * the length of this vector
	 */
	get length(): number {
		return sqrt(this.lengthSquared);
	}
	
}


/**
 * This represents a point in 2D SVG space. It is aware of its x and y coordinates
 * and of its local coordinate system. When comparing or combining with other
 * `Point2D` instances, their respective coordinate systems will automatically
 * be reconciled.
 * @extends Vector2D
 */
export class Point2D extends Vector2D {
	
	/**
	 * Create a new `Vector2D`.
	 * @param {Object}     other
	 * @param {number}     other.x
	 * @param {number}     other.y
	 * @param {SVGElement} other.coordinateSystem - the element defining this point's coordinate system
	 */
	constructor(other) {
		super(other);
		this.coordinateSystem = other.coordinateSystem::plainDOM();
	}
	
	/**
	 * The coordinate system of this point.
	 * @readonly
	 */
	coordinateSystem: SVGElement;
	
	/**
	 * Create a new Point2D from the translation component of a matrix.
	 * @param {SVGMatrix}         m                - the matrix from which to take the translation
	 * @param {jQuery|SVGElement} coordinateSystem - the coordinate system for this new point
	 * @returns {Point2D} the new point
	 */
	static fromMatrixTranslation(m: SVGMatrix, coordinateSystem: $ | SVGElement) {
		return new this({
			x:                m[MX],
			y:                m[MY],
			coordinateSystem: coordinateSystem::plainDOM()
		});
	}
	
	/**
	 * Get this point, but described in a different coordinate system.
	 * @param {jQuery|SVGElement} coordinateSystem - the coordinate system for this new point
	 * @return {Point2D} the same point, but framed by the given coordinate system
	 */
	in(coordinateSystem: $ | SVGElement): Point2D {
		if (this.coordinateSystem === coordinateSystem) { return this }
		let coords = this.svgPoint.matrixTransform(this.coordinateSystem.getScreenCTM().multiply(coordinateSystem::plainDOM().getScreenCTM().inverse()));
		return new Point2D({
			x: coords.x,
			y: coords.y,
			coordinateSystem
		});
	}
	
	/**
	 * A convenience function to get a plain `{x, y}` object from this point,
	 * but with configurable keys.
	 * @param {string} [xKey='x'] - the key for the x coordinate
	 * @param {string} [yKey='y'] - the key for the y coordinate
	 * @return {Object} an object like `{ [xKey]: 24, [yKey]: 25 }`
	 */
	obj(xKey: string = 'x', yKey: string = 'y'): Object {
		return {
			[xKey]: this.x,
			[yKey]: this.y
		};
	}
	
	/**
	 * Add this point to another point, reconciling their coordinate systems.
	 * Does not modify this point, but returns a new one.
	 * The result of this operation might not make sense unless
	 * you divide the result by 2 (or something).
	 * @param   {Point2D} other - the other point
	 * @returns {Point2D}       - the pointwise addition of both point
	 */
	plus(other: Point2D): Point2D {
		other = other.in(this.coordinateSystem);
		return new Point2D({
			x:                this.x + other.x,
			y:                this.y + other.y,
			coordinateSystem: this.coordinateSystem
		});
	}
	
	/**
	 * Subtract another point from this one, reconciling their
	 * coordinate systems and returning a vector.
	 * Does not modify this vector, but returns a new one.
	 * @param   {Point2D} other - the other point
	 * @returns {Vector2D}      - the pointwise subtraction of both point
	 */
	minus(other: Point2D): Vector2D {
		other = other.in(this.coordinateSystem);
		return new Vector2D({
			x: this.x - other.x,
			y: this.y - other.y
		});
	}
	
	/**
	 * @returns {number} the Euclidean distance between the two points, squared
	 * @param {Point2D} other - the other point
	 */
	squaredDistanceTo(other: Point2D) {
		const d = this.minus(other);
		return d.lengthSquared;
	}
	
	/**
	 * @returns {number} the Euclidean distance between the two points
	 * @param {Point2D} other - the other point
	 */
	distanceTo(other: Point2D) {
		return sqrt(this.squaredDistanceTo(other));
	}
	
	/**
	 * Get a point partway between this point and another, the exact
	 * point defined by a factor of the distance between them.
	 * @param {number} factor - the factor determining the location on the `this`-`other` line-segment
	 * @param {Point2D} other - the other point
	 * @return {Point2D} `this` * `factor` + `other` * (1 - `factor`)
	 */
	withFactorTo(factor: number, other: Point2D) {
		other = other.in(this.coordinateSystem);
		return new Point2D({
			x:                this.x * factor + other.x * (1 - factor),
			y:                this.y * factor + other.y * (1 - factor),
			coordinateSystem: this.coordinateSystem
		});
	}
	
	/**
	 * Get a point partway between this point and another, the exact
	 * point defined by an absolute distance from this point.
	 * @param {number} distance - the distance from this point from which to take the resulting point
	 * @param {Point2D} other   - the other point
	 * @return {Point2D} the defined point
	 */
	withDistanceTo(distance: number, other: Point2D) {
		const length = this.distanceTo(other);
		return this.withFactorTo(distance/length, other);
	}
	
	/**
	 * Transform this point by a given matrix.
	 * @param {SVGMatrix} matrix
	 * @return {Point2D} this point multiplied by `matrix`
	 */
	transformedBy(matrix: SVGMatrix): Point2D {
		let newPoint = this.svgPoint.matrixTransform(matrix);
		return new Point2D({
			x:                newPoint.x,
			y:                newPoint.y,
			coordinateSystem: this.coordinateSystem
		});
	}
}

/**
 * Add a scale-from-point transformation onto an existing matrix.
 * That is, multiply the distance between the given `point` and every
 * other point by the supplied `factor`.
 * @this {SVGMatrix} the matrix to change
 * @param {number}                factor - the scaling factor
 * @param {{x: number, y: number}} point - the reference point
 * @returns {SVGMatrix} the original matrix but with the additional scaling
 */
export function scaleFromPoint(factor, point) {
	const {x, y} = point;
	return this
		.translate( x,  y)
		.scale(factor)
		.translate(-x, -y);
}

/**
 * Add a rotate-around-point transformation onto an existing matrix.
 * @this {SVGMatrix} the matrix to change
 * @param {{x: number, y: number}} point - the reference point
 * @param {number}                 angle - the angle by which to rotate
 * @returns {SVGMatrix} the original matrix but with the additional rotation
 */
export function rotateAroundPoint(point, angle) {
	const {x, y} = point;
	return this
		.translate(x, y)
		.rotate(angle)
		.translate(-x, -y);
}

/**
 * Move a given svg element to the front in terms of 'z-index'.
 * @this {SVGElement} the element to bring to front
 */
export function moveToFront() {
	const plainThis = this::plainDOM();
	if (plainThis.parentElement) {
		plainThis.parentElement.appendChild(plainThis);
	}
}

/**
 * @return {Point2D} the original point snapped to the closest 45-degree line crossing the reference point
 * @this  {Point2D} the original point to snap
 * @param {Point2D} referencePoint - the point defining the center around which to snap
 */
export function snap45(referencePoint) {
	let cReferencePoint = referencePoint.in(this.coordinateSystem);
	let mouseVector45 = this.svgPoint
		.matrixTransform(ID_MATRIX::rotateAroundPoint(cReferencePoint, 45));
	mouseVector45 = new Point2D({ x: mouseVector45.x, y: mouseVector45.y, coordinateSystem: this.coordinateSystem });
	let cDiff = this.minus(cReferencePoint);
	let cDiff45 = mouseVector45.minus(cReferencePoint);
	const newPt = (xp, yp, m = ID_MATRIX) => new Point2D({
		...newSVGPoint(xp.x, yp.y).matrixTransform(m)::pick('x', 'y'),
		coordinateSystem: this.coordinateSystem
	});
	return [
		{ diff: abs(cDiff.x),   snap: () => newPt(cReferencePoint, this    ) },
		{ diff: abs(cDiff.y),   snap: () => newPt(this,     cReferencePoint) },
		{ diff: abs(cDiff45.x), snap: () => newPt(cReferencePoint, mouseVector45,   ID_MATRIX::rotateAroundPoint(cReferencePoint, -45)) },
		{ diff: abs(cDiff45.y), snap: () => newPt(mouseVector45,   cReferencePoint, ID_MATRIX::rotateAroundPoint(cReferencePoint, -45)) }
	]::minBy('diff').snap();
}
