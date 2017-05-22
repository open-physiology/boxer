import {NgModule, Component, Input, ElementRef, ViewChild} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {animationLoop} from 'rxjs-animation-loop';

import $ from 'jquery';
import {pull, values} from 'lodash-bound';


import {Box, Glyph, Edge, LineSegment, BoxCorner, Canvas, Coach} from '../index.js';
import {ID_MATRIX, Point2D} from '../util/svg.js';

import {NgBoxerModule, NgBoxer} from '../ng-boxer/NgBoxer.js';
import {InfoPanelModule} from './InfoPanel.js';

import {Model} from './Model.js';


const LEFT_PANEL_WIDTH = '200px';


/**
 * The demo application.
 */
@Component({
	selector: 'body',
	styles: [`
		:host {
			padding:  0;
			margin:   0;
			width:  100%;
			height: 100%;
		}
		svg {
			padding:  0;
			margin:   0;
			position: absolute;
			top:      0;
			left:     0;
			width:    calc(100% - 200px);
			height:   100%;
		}
		div.right-panel {
			margin: 0;
			padding: 0;
			position: absolute;
			top: 0;
			right: 0;
			height: 100%;
			width: 200px;
			border: solid 1px black;
			/*overflow-x: visible;*/
			overflow-y: auto;
		}
		
		div.right-panel > .button-section {
			margin: -1px 0 0 -1px;
			width: 100%;
			border-bottom: solid 1px black;
		}
		
		div.right-panel > .button-section > button {
			border: 1px black;
			border-style: solid none solid solid;
			margin: 0 -1px -2px 0;
			width: calc(50% + 1px);
			outline: none;
		}
		
		div.right-panel > .button-section > .full-width {
			width: calc(100% + 1px);
		}
		
		div.right-panel > .model-section > h2 {
			margin: 16px 0 0 0;
			padding: 0 4px;
			font-family: sans-serif;
			font-size: 18px;
			/*background-color: lightgray;*/
			border-bottom: solid 1px black;
		}
		
		div.right-panel > .model-section > h2 > div {
			margin-bottom: -4px;
		}
		
		div.right-panel > .model-section.animating {
			overflow: hidden;
		}
		
		div.right-panel > .model-section > info-panel {
			margin: 4px 4px 0 4px;
		}
		
		div.right-panel > .model-section > info-panel.visible {
		    animation: slide-in 0.3s both;
		}
		
		div.right-panel > .model-section > info-panel:not(.visible) {
		    animation: slide-out 0.3s both;
		}
		
		@keyframes slide-in {
			  0% { transform: translateX(200px) }
			100% { transform: translateX(0)     }
		}
		
		@keyframes slide-out {
			  0% { transform: translateX(0)     }
			100% { transform: translateX(200px) }
		}
		
		
`],
	template: `
		
		<div><svg ng-boxer #boxer=boxer></svg></div>
		
		<div class="right-panel">
			
			<div class="button-section">
				<button *ngFor                  = " let toolMode of boxer.toolModes                "
				        (click)                 = " boxer.toolMode = toolMode                      "
				        [class.full-width]      = " toolMode === 'Manipulate'                      "
				        [style.backgroundColor] = " boxer.toolMode === toolMode ? '#aff' : 'white' "
				>{{ toolMode }}</button>
			</div>
			
			<div *ngIf="lyphModels.length" class="model-section" [class.animating]=" animatingInfoPanel ">
				<h2><div>Lyphs</div></h2>
				<info-panel *ngFor  = " let model of lyphModels "
					[model]         = " model                   "
					[class.visible] = " !model.deleted          "
				></info-panel>
			</div>
			
			<div *ngIf="processModels.length" class="model-section" [class.animating]=" animatingInfoPanel ">
				<h2><div>Processes</div></h2>
				<info-panel *ngFor  = " let model of processModels "
					[model]         = " model                      "
					[class.visible] = " !model.deleted             "
				></info-panel>
			</div>
			
		</div>
	    
	`
})
export class DemoApp {
	
	@ViewChild('boxer') boxer: NgBoxer;
	
	lyphModels:    Array<Model> = [];
	processModels: Array<Model> = [];
	
	animatingInfoPanel: boolean = false;
	
	
	constructor({nativeElement}: ElementRef) {
		this.nativeElement = $(nativeElement);
	}
	
	ngOnInit() {
		
		/* react to artefact creation */
		// TODO: the .e() version of this caused errors. Why??
		this.boxer.drawTool.p('artefactCreated')
		    .filter(v=>!!v)
		    .subscribe(::this.onArtefactCreated);
		
	}
	
	onArtefactCreated(newArtefact) {
		
		let models = (newArtefact instanceof Box) ? this.lyphModels : this.processModels;
		
		if (newArtefact instanceof Box) {
			
			for (let corner of newArtefact.corners::values()) {
				corner.e('click').subscribe(() => {
					corner.rounded = !corner.rounded;
				});
			}
			
		}
		if (newArtefact instanceof Box || newArtefact instanceof Edge) {
			
			const newModel = new Model({ color: 'white' });
			newModel.p('color').subscribe((color) => {
				newArtefact.setColor(color);
			});
			
			/* register + deleting */
			models.push(newModel);
			newArtefact.p('deleted')
				.filter(d => !!d)
				.do(() => {
					newModel.deleted = true;
					this.animatingInfoPanel = true;
				})
				.delay(400) // wait for the slide-out animation
				.subscribe(() => {
					models::pull(newModel);
					this.animatingInfoPanel = false;
				});
			
			/* selecting */
			newModel.p('selected').filter(s => !!s)
			        .map(() => newArtefact)
			        .subscribe(::this.boxer.setSelectedArtefact);
			this.boxer.p('selectedArtefact')
			    .map(a => a === newArtefact)
			    .subscribe(newModel.p('selected'));
			
		}
	}
	
}

/**
 * The lyph editor demo application.
 */
@NgModule({
	imports: [
		BrowserModule,
		NgBoxerModule,
		InfoPanelModule
	],
	declarations: [
		DemoApp
	],
	bootstrap: [DemoApp],
})
export class DemoAppModule {}
