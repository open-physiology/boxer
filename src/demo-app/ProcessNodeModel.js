import {ValueTracker, property, flag, humanMsg} from 'utilities';
import chroma from 'chroma-js';
import {isUndefined, pick, parseInt, at, assign} from 'lodash-bound';
import {uniqueId as _uniqueId} from 'lodash';

import assert from 'power-assert';

import {Model} from './Model.js';
import {ID_MATRIX, createSVGMatrix} from '../util/svg';

export class ProcessNodeModel extends Model {
	
	@property()                                         parent;
	@property({ isValid: v => v instanceof SVGMatrix }) transformation;
	
	toJSON() {
		return {
			...super.toJSON(),
			parent: this.parent && this.parent.id,
			transformation: this.transformation::at('a', 'b', 'c', 'd', 'e', 'f')
		};
	}
	
	
	static fromJSON(json, context = {}) {
		const result = super.fromJSON(json, context);
		const {modelsById} = context;
		assert(!json.parent || modelsById[json.parent], humanMsg`
			Got a reference to a model with id ${json.parent},
			but such a model has not yet been seen.
		`);
		result.parent = json.parent && modelsById[json.parent];
		result.transformation = createSVGMatrix(...json.transformation);
		return result;
	}
	
}
