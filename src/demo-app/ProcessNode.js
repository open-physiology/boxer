import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {assign, merge, cloneDeep, values, isUndefined} from 'lodash-bound';
import {Observable} from '../libs/expect-rxjs.js';

import {ID_MATRIX, Point2D} from '../util/svg.js';
import {property, flag, definePropertiesByValue, ValueTracker} from 'utilities';
import {_isNonNegative} from '../util/misc.js';

import {SvgArtefact, Glyph, Edge} from '../index.js';

 
/**
 *
 */
export class ProcessNode extends Glyph {
	
	@property() model;
	
	constructor(options = {}) {
		super({
			...options,
			css: (options.css)::cloneDeep()::merge({
				'&': { 'fill': 'white', 'stroke': 'black' }
			})
		});
		if (options.model) { this.model = options.model }
		
		/* when the model is deleted, this artefact is deleted */
		this.p('model.deleted').filter(v=>!!v).subscribe( this.p('deleted') );
		this.p('deleted').filter(v=>!!v).subscribe(() => { this.model.delete() });
		
		/* other model synchronizations */
		for (let key of ['transformation']) {
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
		    .filter(([p,m]) => !p::isUndefined() && !!m)
		    .subscribe(([parentArtefact, model]) => {
				model.parent = (parentArtefact && parentArtefact !== root) ? parentArtefact.model : null;
			});
		this.p(`model.parent`)
		    .filter(p => !p::isUndefined())
			.map(p => p ? artefactsById[p.id] : root)
			.subscribe( this.p('parent') );
	}
	
	
}
