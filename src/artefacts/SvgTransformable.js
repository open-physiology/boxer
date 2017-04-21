import assert        from 'power-assert';
import $, {plainDOM} from '../libs/jquery.js';

import {ID_MATRIX, SVGMatrix, setCTM} from '../util/svg.js';
import {ValueTracker, property}       from 'utilities';

import {SvgArtefact} from './SvgArtefact.js';

/**
 * Abstract representation of an interactive artefact in svg space.
 */
export class SvgTransformable extends SvgArtefact {
	
	@property({ initial: ID_MATRIX }) transformation;
		
	preCreate(options = {}) {
		super.preCreate(options);
		
		/* smoothly transitioning to a new coordinateSystem */
		this.p('coordinateSystem')
			.filter(p=>p)
			.pairwise()
			.withLatestFrom(this.p('transformation'), ([prev, curr], t) => {
				
				// console.log(...args);
				return t.multiply(prev::plainDOM().getScreenCTM()).multiply(curr::plainDOM().getScreenCTM().inverse());
			})
			.subscribe( this.p('transformation') );
		
		/* keep transformation active on elements */
		this.p('transformation').subscribe(this.svg.main::setCTM);
	}
	
}
