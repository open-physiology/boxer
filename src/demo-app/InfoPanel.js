import $ from 'jquery';
import {NgModule, Component, Input, Output, ElementRef, EventEmitter} from '@angular/core';
import {ColorPickerModule} from 'angular2-color-picker'
import {FormsModule}       from '@angular/forms';

import KeyCode from 'keycode-js';
const {KEY_ESCAPE} = KeyCode;



/**
 * The info-panel component.
 */
@Component({
	selector: 'info-panel',
	styles: [`
		:host {
			display: block;
			padding: 4px;
			position: relative;
		}
		
		input {
			margin-left: 30px;
			padding-left: 3px;
			width: calc(100% - 30px);
			border: solid 1px;
			border-radius: 0 6px 6px 0;
			font-weight: bold;
			outline: none;
		}
		
		input:focus {
			background-color: white !important;
		}
		
		button {
			border: solid 1px;
			border-radius: 6px 0 0 6px;
			width: 30px;
			position: absolute;
			top:  4px;
			left: 5px;
			outline: none;
		}
		button:not(:hover):not(:focus) {
			color: transparent !important;
		}
	`],
	template: `
		<button [(colorPicker)]    =" model.color            "
				[cpPosition]       =" 'left'                 "
				[cpAlphaChannel]   =" 'disabled'             "
		        [style.background] =" model.color            "
		        [style.color]      =" model.contrastingColor "
		        [style.borderColor]=" model.darkenedColor    ">C</button>
		<input type="text"
		       placeholder="Name"
			   [(ngModel)]         = " model.name          "
		       [style.borderColor] = " model.darkenedColor " />
		
	`
})
export class InfoPanel {
	
	@Input() model;
	
	constructor({nativeElement}: ElementRef) {
		this.nativeElement = $(nativeElement);
	}
	
	ngOnInit() {
		
		this.model.p('selected').subscribe((s) => {
			this.nativeElement.children('input').css(
				'background-color',
				s ? 'var(--boxer-highlight-color)' : ''
			)
		});
		
		this.nativeElement.children().focusin(() => {
			this.model.selected = true;
		})
		this.nativeElement.children().focusout(() => {
			this.model.selected = false;
		})
		
	}
	
	
}

/**
 *
 */
@NgModule({
	imports: [
		FormsModule,
		ColorPickerModule
	],
	declarations: [InfoPanel],
	exports:      [InfoPanel]
})
export class InfoPanelModule {}

