import {NgModule, Component, Input, ElementRef} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {animationLoop} from 'rxjs-animation-loop';

import $ from 'jquery';


import {Box, Glyph, Edge, LineSegment, BoxCorner, Canvas, Coach} from '../index.js';
import {ID_MATRIX, Point2D} from '../util/svg.js';

import {HelperTool}      from '../tools/HelperTool.js';
import {MoveTool}    from '../tools/MoveTool.js';
import {ResizeTool}      from '../tools/ResizeTool.js';
import {HighlightTool}   from '../tools/HighlightTool.js'
import {MouseCursorTool} from '../tools/MouseCursorTool.js';
import {ClickTool} from '../tools/ClickTool';
import {RotateTool} from '../tools/RotateTool';
import {DrawTool} from '../tools/DrawTool';

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
			svg: this.nativeElement.children('svg'),
			handlers: {
				drawzone: {
					accepts() { return true }
				}
			}
		});
		
		
		/* coach / tools */
		const coach = new Coach({ root: canvas });
		coach.addTool(new HelperTool     );
		coach.addTool(new ClickTool      );
		coach.addTool(new MoveTool       );
		coach.addTool(new ResizeTool     );
		coach.addTool(new RotateTool     );
		coach.addTool(new HighlightTool  );
		coach.addTool(new MouseCursorTool);
		coach.addTool(new DrawTool({
			css:   { '&': { 'fill': 'white', 'stroke': 'black' } },
			// class: Box,
			class: Glyph
		}));
		
		
		/* test box */
		let bigBox = new Box({
			css: { '&': { 'fill': 'cyan', 'stroke': 'black' } },
			parent: canvas,
			width:  400,
			height: 400,
			transformation: ID_MATRIX.translate(250, 250)
		});

		
		/* test edge */
		let edge = new Edge({
			css: { '&': { 'stroke': 'black' } },
			glyph1: new Glyph({
						css: { '&': { 'fill': 'purple', 'stroke': 'black' } },
						parent: bigBox,
						transformation: ID_MATRIX.translate(-100, -100)
					}),
			glyph2: new Glyph({
						css: { '&': { 'fill': 'purple', 'stroke': 'black' } },
						parent: canvas,
						transformation: ID_MATRIX.translate(10, 10)
					}),
			parent: canvas
		});
		
		
		/* test box */
		let box = new Box({
			css: { '&': { 'fill': 'green', 'stroke': 'black' } },
			parent: bigBox,
			width: 100,
			height: 80,
			transformation: ID_MATRIX.translate(70, 70).rotate(45)
		});
		box.corners.top.left .rounded = true;
		box.corners.top.right.rounded = true;


		/* test box */
		let innerBox = new Box({
			css: { '&': { 'fill': 'red', 'stroke': 'black' } },
			parent: box,
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
