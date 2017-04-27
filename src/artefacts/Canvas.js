import {SvgArtefact} from './SvgArtefact.js';

/**
 * Representation of an svg canvas used to house Boxer artefacts.
 */
export class Canvas extends SvgArtefact {
	
	postCreate(options = {}) {
		if (!options.handler) {
			this.handler = { dropzone: { artefact: this } };
		}
		super.postCreate(options);
		
		/* set global stroke-width */
		this.svg.main.css({
			strokeWidth: 2
		});
	}
	
	set handler(handler: Object) {
		// Canvas is special: its handler element is this.svg.main
		this.svg.main.data('boxer-handler', handler);
		super.handler = handler;
	}
	
}
