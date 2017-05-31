import $ from 'jquery';
import {NgModule, Input, Output, ElementRef, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ColorPickerModule} from 'angular2-color-picker'
import {FormsModule}       from '@angular/forms';
import { NguiAutoCompleteModule } from '@ngui/auto-complete';

import ExtensibleComponent from './ExtensibleComponent.js';

import KeyCode from 'keycode-js';
import {plainDOM} from '../libs/jquery';
import {InfoPanel} from './InfoPanel';
import {LyphInfoPanelModule} from './LyphInfoPanel';
import {ProcessInfoPanelModule} from './ProcessInfoPanel';
const {KEY_ESCAPE} = KeyCode;


const Component = ExtensibleComponent; // to get WebStorm syntax highlighting

/**
 * The universal-info-panel component.
 */
@Component({
	selector: 'universal-info-panel',
	styles: [],
	template: `

		<lyph-info-panel
			*ngIf             = " model && model.constructor.name === 'LyphModel' "
			[model]           = " model                                  "
			[class.info-panel]= " true                                   "
			[class.visible]   = " !model.deleted                         "
			(colorPickerOpen) = " colorPickerOpen.next($event)           "
		></lyph-info-panel>
		
		<process-info-panel
			*ngIf             = " model && model.constructor.name === 'ProcessModel' "
			[model]           = " model                                     "
			[class.info-panel]= " true                                      "
			[class.visible]   = " !model.deleted                            "
			(colorPickerOpen) = " colorPickerOpen.next($event)              "
		></process-info-panel>

	`
})
export class UniversalInfoPanel {
	
	@Input()  model;
	
	@Output() colorPickerOpen = new EventEmitter;
		
}

/**
 *
 */
@NgModule({
	imports: [
		LyphInfoPanelModule,
		ProcessInfoPanelModule,
		CommonModule
	],
	declarations: [UniversalInfoPanel],
	exports:      [
		UniversalInfoPanel
	]
})
export class UniversalInfoPanelModule {}

