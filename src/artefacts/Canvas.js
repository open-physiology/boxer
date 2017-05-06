import {SvgArtefact} from './SvgArtefact.js';
import {SvgTransformable} from './SvgTransformable';
import {subclassOf} from '../util/misc';
import {predicate, smartMerge} from '../Coach';

/**
 * Representation of an svg canvas used to house Boxer artefacts.
 */
export class Canvas extends SvgArtefact {
	
	postCreate(options = {}) {
		this.registerHandlers({
			dropzone: {
				artefact: this,
				accepts: () => true
			},
			drawzone: {
				artefact: this,
				@predicate('conjunctive') accepts({ class: cls }) {
					return cls::subclassOf(SvgTransformable);
				}
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
