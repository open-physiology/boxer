import {NgModule, Component, Input, ElementRef, ViewChild} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {PerfectScrollbarModule} from 'angular2-perfect-scrollbar';
import {animationLoop} from 'rxjs-animation-loop';
import assert from 'power-assert';
import FileSaver from 'file-saver';

import $ from 'jquery';
import Rx from '../libs/provide-rxjs.js';
const {Observable} = Rx;
import {pull, values, pick, assign} from 'lodash-bound';


import {Box, Glyph, Edge, LineSegment, BoxCorner, Canvas, Coach} from '../index.js';
import {ID_MATRIX, Point2D} from '../util/svg.js';

import {NgBoxerModule, NgBoxer} from './NgBoxer.js';
import {InfoPanelModule} from './InfoPanel.js';

import {Model} from './Model.js';
import {match, property, ValueTracker} from 'utilities';
import {LyphModel} from './LyphModel';
import {ProcessModel} from './ProcessModel';
import {LyphBox} from './LyphBox';
import {LyphInfoPanelModule} from './LyphInfoPanel';
import {ProcessInfoPanelModule} from './ProcessInfoPanel';
import {ProcessNode} from './ProcessNode';
import {ProcessChain} from './ProcessChain';
import {ProcessNodeModel} from './ProcessNodeModel';
import {UniversalInfoPanel, UniversalInfoPanelModule} from './UniversalInfoPanel';

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
			width:    calc(100% - 202px);
			height:   100%;
		}
		
		div.button-section {
			position: fixed;
			top: 0;
			right: 0;
			margin: 0;
			padding: 2px;
			width: 202px;
			height: 80px;
			border: solid 1px black;
			z-index: 10;
			background-color: white;
			display: flex;
			flex-wrap: wrap; 
			justify-content: space-between;
			align-content: stretch;
		}
		
		div.button-section > button {
			border: solid 1px gray;
			margin: 2px;
			outline: none;
			cursor: pointer;
			background-color: transparent;
			flex-basis: 90px;
			flex-grow: 1;
		}
		
		div.button-section > button:hover {
			border-color: black;
			background-color: #eee;
		}
		
		div.button-section > button.selected {
			border-color: black;
			background-color: #aff;
		}
		
		div.right-panel-bottom {
			position: fixed;
			bottom: 0;
			right: 0;
			margin: 0;
			padding: 0;
			width: 202px;
			border: solid 1px black;
			z-index: 10;
		}
		
		perfect-scrollbar.right-panel {
			margin: 0;
			padding: 0;
			position: absolute;
			top: 80px;
			right: 0;
			height: calc(100% - 80px);
			width:  202px;
			/*overflow-y: auto;*/
		}
		
		perfect-scrollbar.right-panel.color-picker-open {
			width: 100%;
		}
		
		div.right-panel-inner {
			position: absolute;
			top: 0;
			right: 0;
			margin: 0;
			padding: 0;
			width:  202px;
			border: 1px black;
			border-style: none solid;
			overflow: visible;
			background-color: white;
			min-height: 100%;
		}
		
		div.right-panel-inner > .model-section {
			width: 100%;
			padding-bottom: 5px;
			overflow: visible;
		}
		
		div.right-panel-inner > .model-section.animating {
			overflow: hidden;
		}
		
		div.right-panel-inner > .model-section > h2 {
			margin: 16px 0 6px 0;
			padding: 0 0 0 9px;
			font-family: sans-serif;
			font-size: 18px;
			border-bottom: solid 1px black;
		}
		
		div.right-panel-inner > .model-section > h2 > div {
			margin-bottom: -4px;
		}
		
		div.right-panel-inner > .model-section > .info-panel {
			margin: 2px 4px 0 4px;
		}
		
		div.right-panel-inner > .model-section > .info-panel.visible {
		    animation: slide-in 0.3s both;
		}
		
		div.right-panel-inner > .model-section > .info-panel:not(.visible) {
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
		
		<div><svg ng-boxer [delayStart]="true" #boxer=boxer></svg></div>
		
		<div class="button-section">
			<input #fileInput
				[type]          = " 'file'                     "
				[accept]        = " '.json'                    "
				[style.display] = " 'none'                     "
				(change)        = " loadFiles(fileInput.files) " />
			<button
		        [style.font-weight]     = " 'bold'                          "
		        (click)                 = " fileInput.click()               "> Load </button
	        ><button
		        [style.font-weight]     = " 'bold'                          "
		        (click)                 = " save()                          "> Save </button
	        ><button
	            *ngFor                  = " let toolMode of boxer.toolModes "
			    [class.selected]        = " boxer.toolMode === toolMode     "
			    (click)                 = " boxer.toolMode =   toolMode     ">{{ toolMode }}</button
	    ></div>
		<perfect-scrollbar class="right-panel" [class.color-picker-open]="colorPickerOpen">
			<div class="right-panel-inner">
				
				<div *ngIf="lyphModels.length"
				     [class.model-section] = " true               "
				     [class.animating]     = " animationCount > 0 ">
					<h2><div>Lyphs</div></h2>
					<lyph-info-panel
						*ngFor            = " let model of lyphModels  "
						[model]           = " model                    "
						[class.info-panel]= " true                     "
						[class.visible]   = " !model.deleted           "
						(colorPickerOpen) = " colorPickerOpen = $event "
					></lyph-info-panel>
				</div>
				
				<div *ngIf="processModels.length"
				     [class.model-section] = " true               "
				     [class.animating]     = " animationCount > 0 ">
					<h2><div>Processes</div></h2>
					<process-info-panel
					    *ngFor            = " let model of processModels "
						[model]           = " model                      "
						[class.info-panel]= " true                       "
						[class.visible]   = " !model.deleted             "
						(colorPickerOpen) = "colorPickerOpen = $event    "
					></process-info-panel>
				</div>
				
			</div>
			
		</perfect-scrollbar>
			
		<div class="right-panel-bottom"
			*ngIf                    = " selectedModel               "
			[style.background-color] = " selectedModel.color "
		>
			<universal-info-panel
				[model]           = " selectedModel            "
				(colorPickerOpen) = " colorPickerOpen = $event "
			></universal-info-panel>
		</div>
	    
	`
})
export class DemoApp extends ValueTracker {
	
	@ViewChild('boxer') boxer: NgBoxer;
	
	lyphModels:    Array<Model> = [];
	nodeModels:    Array<Model> = [];
	processModels: Array<Model> = [];
	
	artefactsById = {};
	
	animationCount: number = 0;
	colorPickerOpen = false;
	
	@property({ initial: null }) selectedModel;
	
	
	constructor({nativeElement}: ElementRef) {
		super();
		this.nativeElement = $(nativeElement);
	}
	
	ngOnInit() {
		
		/* react to artefact creation */
		// TODO: the .e() version of this caused errors. Why??
		this.boxer.drawTool.p('artefactCreated')
		    .filter(v=>!!v)
		    .subscribe(::this.onArtefactCreated);
		
		/* highlighting */
		this.boxer.highlightTool.register(this.boxer.highlightTool, this.boxer.stateMachine.p('state').switchMap(state => match(state)({
			'IDLE': this.p('selectedModel').map((model) => model ? this.artefactsById[model.id] : null),
			'BUSY': Observable.of(null)
		})).map(artefact => artefact && {
			...this.boxer.highlightTool.HIGHLIGHT_DEFAULT,
			artefact
		}));
		
		
		// this.boxer.stateMachine.p('state').subscribe((s) => {
		// 	console.info('STATE:', s);
		// });
		// this.p('selectedModel').subscribe((m) => {
		// 	console.log('SELECTED MODEL:', m);
		// });
		
		
		this.boxer.start();
		
		
	}
	
	save() {
		let result = JSON.stringify({
			lyphs:     this.lyphModels,
			nodes:     this.nodeModels,
			processes: this.processModels
		}, null, 4);
		const blob = new Blob([result], {type: 'text/plain;charset=utf-8'});
		FileSaver.saveAs(blob, 'apinatomy-model.json');
	}
	
	loadFiles(files) {
		const reader = new FileReader();
        reader.onload = () => { this.load(JSON.parse(reader.result)) };
		reader.readAsText(files[0]);
	}
	
	load(json) {
		/* convenient map of mode classes by name */
		const modelClasses = {
			LyphModel,
			ProcessNodeModel,
			ProcessModel
		};
		
		/* create a map from model id to corresponding json object */
		const jsonById = {};
		for (let [cls, key] of [
			[LyphModel,        'lyphs'    ],
			[ProcessNodeModel, 'nodes'    ],
			[ProcessModel,     'processes']
		]) for (let jsn of json[key]) {
			jsonById[jsn.id] = jsn;
		}
		
		/* how to create a new model (it is called recursively to create prerequisites first) */
		const modelsById = {};
		const createModel = (jsn) => {
			if (!modelsById[jsn.id]) {
				const cls = modelClasses[jsn.class];
				
				/* do parents or connected glyphs first */
				if (jsn.parent) { createModel(jsonById[jsn.parent]) }
				if (jsn.glyph1) { createModel(jsonById[jsn.glyph1]) }
				if (jsn.glyph2) { createModel(jsonById[jsn.glyph2]) }
				
				/* then create this model */
				const model = cls.fromJSON(jsn, {modelClasses, modelsById});
				modelsById[model.id] = model;
				
				/* and register it */
				this.onModelCreated(model);
			}
		};
		
		/* kick off model creation */
		for (let jsn of jsonById::values()) {
			createModel(jsn);
		}
	}
	
	createLayer({parentId, layerId, layerNr}) {
		
		const model = cls.fromJSON(jsn, {modelClasses, modelsById});
		modelsById[model.id] = model;
		this.onModelCreated(model);
		
	}
	
	onArtefactCreated(newArtefact) {
		
		const isLyph    = newArtefact instanceof LyphBox;
		const isGlyph   = newArtefact instanceof ProcessNode;
		const isProcess = newArtefact instanceof ProcessChain;
		
		/* create model */
		const modelClass = isLyph ? LyphModel : isGlyph ? ProcessNodeModel : ProcessModel;
		const newModel = new modelClass();
		
		/* register both into the system */
		this.registerModelArtefactPair(newModel, newArtefact);
	}
	
	onModelCreated(newModel) {
		
		const isLyph    = newModel instanceof LyphModel;
		const isGlyph   = newModel instanceof ProcessNodeModel;
		const isProcess = newModel instanceof ProcessModel;
		
		/* create artefact */
		const artefactClass = isLyph ? LyphBox : isGlyph ? ProcessNode : ProcessChain;
		// let newArtefact = new artefactClass();
		
		
		const newArtefactOptions = {
			model: newModel,
			css: { '&': { 'fill': 'white', 'stroke': 'black' } }
		};
		if (isProcess) {
			newArtefactOptions::assign({
				glyph1: this.artefactsById[newModel.glyph1.id],
				glyph2: this.artefactsById[newModel.glyph2.id]
			});
		} else {
			newArtefactOptions::assign({
				parent: newModel.parent && this.artefactsById[newModel.parent.id]
			});
		}
		
		const newArtefact = new artefactClass(newArtefactOptions);
		
		/* register both into the system */
		this.registerModelArtefactPair(newModel, newArtefact);
	}
	
	registerModelArtefactPair(newModel, newArtefact) {
		
		const isLyph    = newModel instanceof LyphModel;
		const isGlyph   = newModel instanceof ProcessNodeModel;
		const isProcess = newModel instanceof ProcessModel;
		
		newArtefact.model = newModel;
		this.artefactsById[newModel.id] = newArtefact;
		newArtefact.registerContext({
			artefactsById: this.artefactsById,
			root:          this.boxer.root
		});
		newModel.p('deleted').filter(d=>!!d).subscribe(() => {
			delete this.artefactsById[newModel.id];
		});
		
		/* register + delete handling */
		const models = isLyph ? this.lyphModels : isGlyph ? this.nodeModels : this.processModels;
		Observable.of(null)
			.do(() => { this.animationCount += 1 })
			.do(() => { models.push(newModel) })
			.delay(301) // wait for the slide-out animation
			.do(() => { this.animationCount -= 1 })
			.subscribe(()=>{});
		newModel.p('deleted')
			.filter(d=>!!d)
			.do(() => { this.animationCount += 1 })
			.delay(301) // wait for the slide-out animation
			.do(() => { this.animationCount -= 1 })
			.subscribe(() => { models::pull(newModel) });
		
		/* selecting */
		// newModel.p('selected').filter(s => !!s)
		//         .map(() => newArtefact)
		//         .subscribe(::this.boxer.setSelectedArtefact);
		
		
		newModel.p('selected').withLatestFrom(this.p('selectedModel')).subscribe(([selected, current]) => {
			if (selected) {
				this.selectedModel = newModel;
			} else if (current === newModel) {
				this.selectedModel = null;
			}
		});
		this.p('selectedModel')
		    .map(m => m === newModel)
		    .subscribe(newModel.p('selected'));
		
		this.boxer.p('selectedArtefact')
		    .map(a => !!a && !!a.handlers && !!a.handlers.highlightable
		           && a.handlers.highlightable.artefact === newArtefact)
		    .subscribe(newModel.p('selected'));
		
		/* registering layers created by this model */
		newModel.p('createdLayer').filter(m=>!!m).subscribe((layerModel) => {
			this.onModelCreated(layerModel);
		});
	}
	
}

/**
 * The lyph editor demo application.
 */
@NgModule({
	imports: [
		BrowserModule,
		NgBoxerModule,
		LyphInfoPanelModule,
		ProcessInfoPanelModule,
		UniversalInfoPanelModule,
		PerfectScrollbarModule.forRoot({ suppressScrollX: true })
	],
	declarations: [
		DemoApp
	],
	bootstrap: [DemoApp],
})
export class DemoAppModule {}
