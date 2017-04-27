import {NgModule, Component, Input, ElementRef} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {animationLoop} from 'rxjs-animation-loop';

import $ from 'jquery';


import {Box, Glyph, Edge, LineSegment, BoxCorner, Canvas, Coach} from '../index.js';
import {ID_MATRIX, Point2D} from '../util/svg.js';

import {HelperTool}      from '../tools/HelperTool.js';
import {DragDropTool}    from '../tools/DragDropTool.js';
import {ResizeTool}      from '../tools/ResizeTool.js';
import {HighlightTool}   from '../tools/HighlightTool.js'
import {MouseCursorTool} from '../tools/MouseCursorTool.js';

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
		const coach = new Coach({ coordinateSystem: canvas });
		coach.addTool(new HelperTool     );
		coach.addTool(new DragDropTool   );
		coach.addTool(new ResizeTool     );
		coach.addTool(new HighlightTool  );
		coach.addTool(new MouseCursorTool);
		
		
		/* test box */
		let bigBox = new Box({
			style: { '&': { 'fill': 'cyan', 'stroke': 'black' } },
			coordinateSystem: canvas,
			width:  400,
			height: 400
		});
		bigBox.transformation = ID_MATRIX.translate(250, 250);


		/* test glyph 1 */
		let glyph1 = new Glyph({
			style: { '&': { 'fill': 'purple', 'stroke': 'black' } },
			coordinateSystem: bigBox
		});
		glyph1.transformation = ID_MATRIX.translate(-100, -100);
		
		/* test glyph 2 */
		let glyph2 = new Glyph({
			style: { '&': { 'fill': 'purple', 'stroke': 'black' } },
			coordinateSystem: canvas
		});
		glyph2.transformation = ID_MATRIX.translate(10, 10);
		
		/* test edge */
		let edge = new Edge({
			style: { '&': { 'stroke': 'black' } },
			glyph1,
			glyph2,
			coordinateSystem: canvas
		});
		
		
		/* test box */
		let box = new Box({
			style: { '&': { 'fill': 'green', 'stroke': 'black' } },
			coordinateSystem: bigBox,
			width: 100,
			height: 80
		});
		box.transformation = ID_MATRIX.translate(70, 70).rotate(45);
		box.corners.top.left .rounded = true;
		box.corners.top.right.rounded = true;


		/* test box */
		let innerBox = new Box({
			style: { '&': { 'fill': 'red', 'stroke': 'black' } },
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
