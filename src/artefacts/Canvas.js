import {SvgArtefact} from './SvgArtefact.js';
import {SvgTransformable} from './SvgTransformable';
import {property} from 'utilities';
import {ID_MATRIX, setCTM} from '../util/svg';

/**
 * Representation of an svg canvas used to house boxer artefacts.
 */
export class Canvas extends SvgArtefact {
	
	@property({ initial: ID_MATRIX, isValid: v => v instanceof SVGMatrix }) transformation;
	@property({ initial: ID_MATRIX, isValid: v => v instanceof SVGMatrix }) globalTransformation;
	
	preCreate(options = {}) {
		super.preCreate(options);
		
		/* set transformation if given */
		if (options.transformation) { this.transformation = options.transformation }
		
		/* apply canvas transformation (zooming, panning, etc.) */
		this.p('transformation').subscribe( this.svg.children::setCTM );
		
		/* keep track of the global transformation */
		this.p('transformation').subscribe(this.p('globalTransformation'));
	}
	
	postCreate(options = {}) {
		
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
				accepts({ artefact }) {
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
