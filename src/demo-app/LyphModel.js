import {ValueTracker, property, flag, humanMsg} from 'utilities';
import chroma from 'chroma-js';
import {isUndefined, pick, parseInt, at, assign} from 'lodash-bound';
import {uniqueId as _uniqueId} from 'lodash';

import assert from 'power-assert';

import {Model} from './Model.js';
import {ID_MATRIX, createSVGMatrix} from '../util/svg';

export class LyphModel extends Model {
	
	////////////////////////////////////////////////////////////////////////////

	@property()                parent;
	@property({ initial: '' }) external;
	
	@flag({ initial: true })  hasAxis;
	@property() width;
	@property() height;
	@property({ initial: ID_MATRIX }) transformation;
	
	// TODO: track stuck borders
	
	@flag({ initial: false }) leftSideClosed;
	@flag({ initial: false }) rightSideClosed;
	
	@flag({ initial: false }) lengthSpecified;
	@property({ initial: 0 }) lengthMin;
	@property({ initial: 9 }) lengthMax;
	@flag({ initial: false }) thicknessSpecified;
	@property({ initial: 0 }) thicknessMin;
	@property({ initial: 9 }) thicknessMax;
	
	////////////////////////////////////////////////////////////////////////////
	
	toJSON() {
		return {
			...super.toJSON(),
			...this::pick(
				'name',
				'color',
				'external',
				'width',
				'height',
				'leftSideClosed',
				'rightSideClosed',
				'lengthSpecified',
				'lengthMin',
				'lengthMax',
				'thicknessSpecified',
				'thicknessMin',
				'thicknessMax'
			),
			parent:         this.parent && this.parent.id,
			transformation: this.transformation::at('a', 'b', 'c', 'd', 'e', 'f')
		};
	}
	
	static fromJSON(json, context = {}) {
		const result = super.fromJSON(json, context);
		const {modelsById} = context;
		result::assign(json::pick(
			'name',
			'color',
			'external',
			'width',
			'height',
			'leftSideClosed',
			'rightSideClosed',
			'lengthSpecified',
			'lengthMin',
			'lengthMax',
			'thicknessSpecified',
			'thicknessMin',
			'thicknessMax'
		));
		assert(!json.parent || modelsById[json.parent], humanMsg`
			Got a reference to a model with id ${json.parent},
			but such a model has not yet been seen.
		`);
		result.parent = json.parent && modelsById[json.parent];
		result.transformation = createSVGMatrix(...json.transformation);
		return result;
	}
	
	////////////////////////////////////////////////////////////////////////////
	
}
