import assert from 'power-assert';
import $      from '../libs/jquery.js';
import {isBoolean as _isBoolean} from 'lodash';
import {assign, merge, cloneDeep, values, isUndefined} from 'lodash-bound';
import {Observable} from '../libs/expect-rxjs.js';

import {ID_MATRIX, Point2D} from '../util/svg.js';
import {property, flag, definePropertiesByValue, ValueTracker} from 'utilities';
import {_isNonNegative} from '../util/misc.js';

import {SvgArtefact, Glyph, Edge} from '../index.js';

 
/**
 *
 */
export class ProcessChain extends SvgArtefact {
	
	@property() model;
	
	@property() glyph1;
	@property() glyph2;
	
	@property({ initial: [] }) intermediateGlyphs;
	@property({ initial: [] }) edges;
	
	
	constructor(options = {}) {
		super({
			...options,
			css: (options.css)::cloneDeep()::merge({
				'&': { 'fill': 'white', 'stroke': 'black' }
			})
		});
		if (options.model) { this.model = options.model }
		
		/* when the model is deleted, this artefact is deleted */
		this.p('model.deleted').filter(v=>!!v).subscribe( this.p('deleted') );
		this.p('deleted').filter(v=>!!v).subscribe(() => { this.model.delete() });
	}
	
	registerContext({artefactsById, root}) {
		/* glyph (essentially: parent) synchronization */
		for (let key of ['glyph1', 'glyph2']) {
			this.p([key, 'model'])
			    .filter(([g,m]) => !g::isUndefined() && !!m)
			    .subscribe(([glyphArtefact, model]) => {
					model[key] = glyphArtefact && glyphArtefact.model;
				});
			this.p(`model.${key}`)
			    .filter(p => !p::isUndefined())
				.map(p => p && artefactsById[p.id])
				.subscribe( this.p(key) );
		}
	}
	
	
	_createEdge() {
		const result = new Edge({
			glyph1: this.glyph1,
			glyph2: this.glyph2
		});
		result.handlers.deletable::assign({
			artefact: this
		});
		// TODO
		return result;
	}
	
	create(options = {}) {
		super.create(options);
		
		/* initialize glyphs */
		for (let g of [1, 2]) {
			// assert(options[`glyph${g}`]);
			this[`glyph${g}`] = options[`glyph${g}`];
		}
		
		/* initial edge */
		this.edges = [this._createEdge()];
		
	}
	
	postCreate(options = {}) {
		super.postCreate(options);
		
		/* set standard handlers */
		this.p('edges').subscribe((edges) => {
			let elements = $();
			for (let edge of edges) {
				elements = elements.add(edge.svg.overlay);
			}
			for (let edge of edges) {
				edge.handlers.deletable::assign({
					artefact: this
				});
				edge.handlers.highlightable::assign({
					artefact: this,
					effect: { elements }
				});
			}
			this.handlers.highlightable = { // TODO: had to use =, because it was never assigned in the first place
				artefact: this,
				effect: { elements }
			};
		});
		
		// /* reassign handlers */
		// // assign particular responsibilities between inner artefacts and the main ProcessChain
		// this.p(['intermediateGlyphs', 'edges']).subscribe(([glyph1, glyph2, iGlyphs, edges]) => {
		// 	for (let key of ['deletable', 'highlightable']) for (let thing of [...edges, ...iGlyphs]) {
		// 		thing.handlers[key]::assign(this.handlers[key]);
		// 	}
		// });
		
		/* when this ProcessChain is deleted, delete all its edges */
		this.p('deleted').filter(d=>!!d).subscribe(() => {
			for (let edge  of this.edges)              { edge .delete() }
			for (let glyph of this.intermediateGlyphs) { glyph.delete() }
		});
		
		/* delete this when either glyph is deleted */
		Observable.merge(
			this.p('glyph1.deleted').filter(d=>!!d),
			this.p('glyph2.deleted').filter(d=>!!d)
		).take(1).subscribe( this.p('deleted') );
		
		
		/* set glyph handlers */
		const handlers = {
			movable: {
				before: () => { this.handlesActive = false },
				after:  () => { this.handlesActive = true  }
			}
		};
		this.p('glyph1').filter(g=>!!g).subscribe((glyph1) => { glyph1.registerHandlers(handlers) });
		this.p('glyph2').filter(g=>!!g).subscribe((glyph2) => { glyph2.registerHandlers(handlers) });
		// TODO: same for intermediate glyphs, dynamically
		
		/* propagate 'handlesActive' */
		this.p('handlesActive').subscribe((ha) => {
			for (let artefact of [
				...this.edges,
				...this.intermediateGlyphs,
				this.glyph1,
				this.glyph2
			]) { artefact.handlesActive = ha }
		});
		
		/* manifest color */
		this.p('model.color').subscribe((color) => {
			for (let artefact of [...this.edges, ...this.intermediateGlyphs]) {
				artefact.setCSS({ '&': { stroke: color, fill: color } });
			}
		});
		
	}
	
}
