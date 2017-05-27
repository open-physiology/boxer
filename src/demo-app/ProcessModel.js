import {ValueTracker, property, flag, humanMsg} from 'utilities';
import chroma from 'chroma-js';
import {isUndefined, pick, parseInt, at, assign} from 'lodash-bound';
import {uniqueId as _uniqueId} from 'lodash';

import assert from 'power-assert';

import {Model} from './Model.js';

export class ProcessModel extends Model {

	@property({ initial: '' }) type;
	
	@property() glyph1;
	@property() glyph2;
	
	// @property({ initial: [] }) edges;
	
	////////////////////////////////////////////////////////////////////////////
	
	toJSON() {
		return {
			...super.toJSON(),
			...this::pick('type'),
			glyph1: this.glyph1 && this.glyph1.id,
			glyph2: this.glyph2 && this.glyph2.id
		};
	}
	
	static fromJSON(json, context = {}) {
		const result = super.fromJSON(json, context);
		const {modelsById} = context;
		result::assign(json::pick('type'));
		for (let key of ['glyph1', 'glyph2']) {
			assert(!json[key] || modelsById[json[key]], humanMsg`
				Got a reference to a model with id ${json[key]},
				but such a model has not yet been seen.
			`);
			result[key] = json[key] && modelsById[json[key]];
		}
		return result;
	}
	
	////////////////////////////////////////////////////////////////////////////
	
}
