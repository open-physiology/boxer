import {SvgArtefact} from './SvgArtefact.js';
import {SvgTransformable} from './SvgTransformable';
import {subclassOf} from '../util/misc';
import {predicate, smartMerge} from '../Coach';
import {property} from 'utilities';
import {ID_MATRIX, setCTM} from '../util/svg';

/**
 * Representation of an svg canvas used to house Boxer artefacts.
 */
export class Canvas extends SvgArtefact {
	
	@property({ initial: ID_MATRIX, isValid: v => v instanceof SVGMatrix }) transformation;
	
	postCreate(options = {}) {
		/* apply canvas transformation (zooming, panning, etc.) */
		this.p('transformation').subscribe( this.svg.children::setCTM );
		
		/* register canvas handlers */
		this.registerHandlers({
			dropzone:  {
				artefact: this,
				accepts: () => true,
				after: ({artefact}) => {
					artefact.parent = this;
				}
			},
			drawzone: {
				artefact: this,
				@predicate('conjunctive') accepts({ artefact }) {
					return artefact instanceof SvgTransformable;
				}
			},
			pannable: {
				artefact: this
			}
		});
		super.postCreate(options);
	}
	
	registerHandlers(handlers: Object = {}) {
		// Canvas is special: its handler element is this.svg.main
		super.registerHandlers(handlers);
		this.svg.main.data('boxer-handlers', this.handlers);
	}
	
}
