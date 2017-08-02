import assert        from 'power-assert';
import $, {plainDOM} from '../libs/jquery.js';

import {ID_MATRIX, SVGMatrix, setCTM} from '../util/svg.js';
import {ValueTracker, property}       from 'utilities';

import {SvgArtefact} from './SvgArtefact.js';
import {Point2D} from '../util/svg';

/**
 * Abstract representation of an interactive artefact in svg space that can be transformed by affine matrix.
 */
export class SvgTransformable extends SvgArtefact {
	
	@property({ initial: ID_MATRIX, isValid: v => v instanceof SVGMatrix }) transformation;
	@property({ initial: ID_MATRIX, isValid: v => v instanceof SVGMatrix }) globalTransformation;
	
	preCreate(options = {}) {
		super.preCreate(options);
		
		/* set transformation if given */
		if (options.transformation) { this.transformation = options.transformation }
		
		/* smoothly transitioning to a new coordinateSystem */
		this.p('parent')
			.filter(p=>p)
			.map(p => p.svg.children)
			.pairwise()
			.withLatestFrom(this.p('transformation'), ([prev, curr], t) => ID_MATRIX
				.multiply(curr::plainDOM().getScreenCTM().inverse())
			    .multiply(prev::plainDOM().getScreenCTM())
				.multiply(t))
			.subscribe( this.p('transformation') );
		
		/* keep transformation active on elements */
		this.p('transformation').subscribe(this.svg.main::setCTM);
		
		/* keep track of the transformation of this artefact w.r.t. the canvas */
		this.p(['parent?.globalTransformation', 'transformation'], (pgt, t) => (pgt || ID_MATRIX).multiply(t))
			.subscribe( this.p('globalTransformation') );
	}
	
}
