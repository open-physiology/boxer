import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {assign, merge, cloneDeep, values, isUndefined} from 'lodash-bound';
import {Observable} from '../libs/expect-rxjs.js';

import {ID_MATRIX, Point2D} from '../util/svg.js';
import {property, flag, definePropertiesByValue, ValueTracker} from 'utilities';
import {_isNonNegative} from '../util/misc.js';

import {Box, Glyph, Edge, LineSegment, BoxCorner, Canvas, Coach} from '../index.js';

 
/**
 * Representation of a lyph in svg space.
 */
export class LyphBox extends Box {
	
	static AXIS_THICKNESS = 20;
	
	@property() model;
	
	@flag({ initial: true }) hasAxis;
	
	contentBox;
	
	constructor(options = {}) {
		super({
			...options,
			css: (options.css)::cloneDeep()::merge({
				'&': { 'fill': 'black', 'stroke': 'black' }
			})
		});
		if (options.model) { this.model = options.model }
		
		/* when the model is deleted, this artefact is deleted */
		this.p('model.deleted').filter(v=>!!v).subscribe( this.p('deleted') );
		this.p('deleted').filter(v=>!!v).subscribe(() => { this.model.delete() });
		
		/* other model synchronizations */
		for (let key of ['hasAxis', 'width', 'height', 'transformation']) {
			this.p(`model.${key}`).subscribe( this.p(key) );
			this.p([key, 'model']).filter(([,m]) => !!m).subscribe(([value, model]) => { model[key] = value });
		}
	}
	
	registerContext({artefactsById, root}) {
		/* parent synchronization */
		this.p(['parent', 'model'])
		    .map(([p, m]) => {
				// find the closest ancestor artefact that has a model
			    while (p && !p.model && p !== root) { p = p.parent }
			    return [p, m];
		    })
		    .filter(([pm,m]) => !pm::isUndefined() && !!m)
		    .subscribe(([parent, model]) => {
				model.parent = parent && parent.model || null;
			});
		this.p(`model.parent`)
		    .filter(p => !p::isUndefined())
		    .map(p => p ? artefactsById[p.id] : root)
		    .map((a) => {
				if (a !== root && !a.model) {
					a = a.handlers.dropzone.artefact;
				}
				return a;
		    })
		    .subscribe( this.p('parent') );
	}
	
	postCreate(options = {}) {
		super.postCreate(options);
		
		/* set min-size taking axis into account */
		const noAxisMinHeight = this.minHeight;
		this.p('hasAxis')
		    .map(ha => noAxisMinHeight + ha * LyphBox.AXIS_THICKNESS)
		    .subscribe( this.p('minHeight') );
		
		/* create inner box */
		this.contentBox = new Box({
			parent: this,
			css: { '&': { stroke: 'transparent' } }
		});
		
		/* reassign handlers */
		// assign particular responsibilities between outer and inner box
		for (let key of [
			'movable'  , 'rotatable',
			'deletable', 'highlightable'
		]) { this.contentBox.handlers[key]::assign(this.handlers[key]) }
		for (let key of [
			'drawzone', 'dropzone'
		]) { this.handlers[key]::assign(this.contentBox.handlers[key]) }
		this.contentBox.borders.bottom.handlers.movable = this.handlers.movable;
		// deactivate reactivity of contentBox borders and corners
		for (let outline of {
			...this.contentBox.borders,
			...this.contentBox.corners
		}::values()) { outline.handlesActive = false }
		// reassign snap-to-borders to contentBox
		for (let [key, x, y] of [
			['top',    0, -1],
			['right', +1,  0],
			['bottom', 0, +1],
			['left',  -1,  0]
		]) {
			this.borders[key].handlers.dropzone::assign({
				artefact: this.borders[key], // TODO: change to border artefact
				after: ({artefact}) => {
					if (artefact instanceof Box) {
						artefact.parent = this.contentBox;
						artefact.stuckToBorder = [...artefact.stuckToBorder, {x, y}];
						// TODO: more elegant and universal implementation
					}
				}
			});
		}
		
		/* synchronize size */
		this.p('hasAxis').subscribe((ha) => {
			this.contentBox.transformation =
				ID_MATRIX.translate(0, ha * -LyphBox.AXIS_THICKNESS/2);
		});
		this.p(['width', 'height', 'hasAxis']).subscribe(([pw, ph, ha]) => {
			this.contentBox.width  = pw                              ;
			this.contentBox.height = ph - ha * LyphBox.AXIS_THICKNESS;
		});
		
		/* sync roundedness of top corners with contentBox */
		this.corners.tl.p('rounded').subscribe(this.contentBox.corners.tl.p('rounded'));
		this.corners.tr.p('rounded').subscribe(this.contentBox.corners.tr.p('rounded'));

		/* manifest color */
		this.p('model.color').subscribe((color) => {
			this.contentBox.setCSS({
				'&': { fill: color }
			});
		});
		
		/* when stuck to bottom border, lose the axis */
		this.p('stuckToBorder').subscribe((stb) => {
			const stY = new Set(stb.map(({y}) => y));
			this.hasAxis = !stY.has(+1);
		});
		
		/* when clicking border, toggle open/closed sides */
		Observable.merge(this.borders.left.e('click'), this.corners.tl.e('click')).subscribe(() => {
			this.model.leftSideClosed = !this.model.leftSideClosed;
		});
		Observable.merge(this.borders.right.e('click'), this.corners.tr.e('click')).subscribe(() => {
			this.model.rightSideClosed = !this.model.rightSideClosed;
		});
		
		/* change corner rounding based on open/closed sides */
		this.p('model.leftSideClosed') .subscribe(this.corners.tl.p('rounded'));
		this.p('model.rightSideClosed').subscribe(this.corners.tr.p('rounded'));
		
	}
	
}
