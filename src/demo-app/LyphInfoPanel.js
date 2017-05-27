import $ from 'jquery';
import {NgModule, Component, Input, Output, ElementRef, EventEmitter} from '@angular/core';
import {ColorPickerModule} from 'angular2-color-picker'
import {FormsModule}       from '@angular/forms';
import assert from 'power-assert';
import {fromPairs, keys} from 'lodash-bound';

import lyphData from './data.json';
const lyphDataByName = lyphData.lyphs.map(obj => [obj.name, obj])::fromPairs();

import KeyCode from 'keycode-js';
import {InfoPanel, InfoPanelModule} from './InfoPanel';
import {LyphModel} from './LyphModel';
const {KEY_ESCAPE} = KeyCode;

/**
 * The info-panel component.
 */
@Component({
	selector: 'lyph-info-panel',
	styles: [...InfoPanel.ComponentAnnotation.styles, `

		button > .button-symbol {
			display: block;
			margin-top: -3px;
		}
		
	`],
	template: `

		${InfoPanel.ComponentAnnotation.template}
		
		<div class="other-fields" [style.border-color]=" model.darkenedColor ">
			
			<table>
				<tr>
					<td>Length</td>
					<td>
						<span class="input"
						    [class.disabled]         = " !model.lengthSpecified "
							[style.border-color]     = "  model.darkenedColor   "
						>
							<input type="number" dir="rtl"
								[(ngModel)] = " model.lengthMin        "
								[min]       = " 1                      "
								[max]       = " model.lengthMax        "
								[disabled]  = " !model.lengthSpecified " />
							..
							<input type="number" dir="ltr"
								[(ngModel)] = " model.lengthMax        "
								[min]       = " model.lengthMin        "
								[max]       = " 9                      "
								[disabled]  = " !model.lengthSpecified " />
							<input type="checkbox" style="float: right"
								[(ngModel)] = " model.lengthSpecified  " />
						</span>
					</td>
				</tr>
				<tr>
					<td>Thickness</td>
					<td>
						<span class="input"
						    [class.disabled]         = " !model.thicknessSpecified "
							[style.border-color]     = "  model.darkenedColor      "
						>
							<input type="number" dir="rtl"
								[(ngModel)] = " model.thicknessMin         "
								[min]       = " 0                          "
								[max]       = " model.thicknessMax         "
								[disabled]  = " !model.thicknessSpecified  " />
							..
							<input type="number" dir="ltr"
								[(ngModel)] = " model.thicknessMax         "
								[min]       = " model.thicknessMin         "
								[max]       = " 9                          "
								[disabled]  = " !model.thicknessSpecified  " />
							<input type="checkbox" style="float: right"
								[(ngModel)] = " model.thicknessSpecified   " />
						</span>
					</td>
				</tr>
				<tr>
					<td>External</td>
					<td>
						<input type="text"
							[(ngModel)]         = " model.external      "
							[style.border-color]= " model.darkenedColor " />
					</td>
				</tr>
			</table>
			
		</div>
		
	`
})
export class LyphInfoPanel extends InfoPanel {
	
	get autoCompleteOptions() { return lyphDataByName::keys() }
	
	get symbol() { return '▤' }
	
	constructor(elementRef: ElementRef) {
		super(elementRef);
	}
	
	ngOnInit() {
		assert(this.model instanceof LyphModel);
		
		super.ngOnInit();
		
		
		
	}
	
	onDataSelected(name) {
		if (this.model.selected) {
			this.model.setFromData(lyphDataByName[name]);
		}
	}
	
	
}

/**
 *
 */
@NgModule({
	imports: [
		FormsModule,
		ColorPickerModule,
		InfoPanelModule
	],
	declarations: [LyphInfoPanel],
	exports:      [LyphInfoPanel]
})
export class LyphInfoPanelModule {}

