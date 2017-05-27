import {ValueTracker, property, flag, humanMsg} from 'utilities';
import chroma from 'chroma-js';
import {isUndefined, pick, parseInt, at, assign, fromPairs} from 'lodash-bound';
import {uniqueId as _uniqueId} from 'lodash';

import assert from 'power-assert';

import {Model} from './Model.js';
import {ID_MATRIX, createSVGMatrix} from '../util/svg';

import lyphData from './data.json';
const lyphDataById = lyphData.lyphs.map(obj => [obj.id, obj])::fromPairs();



export class LyphModel extends Model {
	
	////////////////////////////////////////////////////////////////////////////

	@property()                parent;
	@property({ initial: '' }) external;
	
	// TODO: property because event doesn't work anymore (right?)
	//     : Also, this is just generally hacky
	@property() createdLayer;
	
	
	// TODO: These are temporary; layers shouldn't work this way
	@property() layerNr;
	@property({ initial: 0 }) layerCount;
	
	
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
				'thicknessMax',
				
				// TODO: These are temporary; layers shouldn't work this way
				'layerNr',
				'layerCount'
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
			'thicknessMax',
			
			// TODO: These are temporary; layers shouldn't work this way
			'layerNr',
			'layerCount'
		));
		assert(!json.parent || modelsById[json.parent], humanMsg`
			Got a reference to a model with id ${json.parent},
			but such a model has not yet been seen.
		`);
		result.parent = json.parent && modelsById[json.parent];
		result.transformation = createSVGMatrix(...json.transformation);
		return result;
	}
	
	setFromData(data) {
		
		
		console.info('----', data.name);
		
		
		if (data.name)     { this.name     = data.name     }
		if (data.external) { this.external = data.external }
		if (data.topology) {
			switch (data.topology) {
				case 'BAG': {
					this.leftSideClosed  = true;
					this.rightSideClosed = false;
				} break;
				case 'TUBE': {
					this.leftSideClosed  = false;
					this.rightSideClosed = false;
				} break;
				case 'CYST': {
					this.leftSideClosed  = true;
					this.rightSideClosed = true;
				} break;
			}
		}
		if (data.length) {
			this.lengthSpecified = true;
			this.lengthMin = data.length.min;
			this.lengthMax = data.length.max;
		}
		if (data.thickness) {
			this.thicknessSpecified = true;
			this.thicknessMin = data.thickness.min;
			this.thicknessMax = data.thickness.max;
		}
		
		this.layerCount = data.layers ? data.layers.length : 0;
		for (let i = 0; i < this.layerCount; ++i) {
			let layerModel = new LyphModel();
			layerModel.parent = this;
			layerModel.layerNr = i;
			this.p('createdLayer').next(layerModel);
			layerModel.setFromData(lyphDataById[data.layers[i]]);
		}
		
	}
	
	////////////////////////////////////////////////////////////////////////////
	
}
