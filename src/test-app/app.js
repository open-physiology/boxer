import {NgModule, Component, Input, ElementRef} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {animationLoop} from 'rxjs-animation-loop';

import $ from 'jquery';


import {Box, LineSegment, BoxCorner, Canvas} from '../index.js';
import {ID_MATRIX, Point2D} from '../util/svg.js';

import {DragDropTool} from '../tools/DragDropTool.js';
import {ResizeTool}   from '../tools/ResizeTool.js';


/**
 * The HelloApp test application, which can greet the world or the universe!
 */
@Component({
	selector: 'body',
	styles: [`
		:host {
			padding: 0;
			margin: 0;
			width: 100%;
			height: 100%;
		}
		:host > svg {
			padding: 0;
			margin: 0;
			width: 100%;
			height: 100%;
		}
	`],
	template: `
	    <svg></svg>
	`
})
export class TestApp {
	
	constructor({nativeElement}: ElementRef) {
		this.nativeElement = $(nativeElement);
	}
	
	ngOnInit() {
		
		/* canvas artefact */
		let canvas = new Canvas({
			svg: this.nativeElement.children('svg')
		});
		
		
		/* coach / tools */
		const context = { coordinateSystem: canvas };
		new DragDropTool({ context });
		new ResizeTool  ({ context });
		
		
		/* test box */
		let bigBox = new Box({
			style: { '> .ink > *': { 'fill': '#eeffff' } },
			coordinateSystem: canvas,
			width:  500,
			height: 500
		});
		bigBox.transformation = ID_MATRIX.translate(250, 250);


		/* test box */
		let box = new Box({
			style: { '> .ink > *': { 'fill': 'green' } },
			coordinateSystem: bigBox,
			width: 100,
			height: 80
		});
		box.transformation = ID_MATRIX.translate(70, 70);
		box.corners.top.left .rounded = true;
		box.corners.top.right.rounded = true;


		/* test box */
		let innerBox = new Box({
			style: { '> .ink > *': { 'fill': 'red' } },
			coordinateSystem: box,
			width:  25,
			height: 25
		});
		innerBox.corners.bottom.left .rounded = true;
		innerBox.corners.bottom.right.rounded = true;
		
	}
	
}

/**
 *
 */
@NgModule({
	imports: [
		BrowserModule
	],
	declarations: [
		TestApp
	],
	bootstrap: [TestApp],
})
export class TestAppModule {}
