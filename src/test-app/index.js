import $ from 'jquery';
import {assign, entries, keys} from 'lodash-bound';
import KeyCode from 'keycode-js';
const {KEY_ESCAPE} = KeyCode;

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
import {BehaviorSubject} from 'rxjs';
import {DeleteTool} from '../tools/DeleteTool';
import {which} from 'utilities';


/* canvas artefact */
let canvas = new Canvas({
	svg: $('svg')
});


/* coach / tools */
const coach = new Coach({ root: canvas });
coach
	.addTool(new MouseCursorTool)
	.addTool(new HighlightTool  )
	.addTool(new HelperTool     )
	.addTool(new ClickTool      )
	.addTool(new MoveTool       )
	.addTool(new ResizeTool     )
	.addTool(new RotateTool     )
	.addTool(new DeleteTool     )
	.addTool(new DrawTool({
		css:    { '&': { 'fill': 'white', 'stroke': 'black' } }
	}))
	.start();



/* define modes */
const staples = [MouseCursorTool, HighlightTool, HelperTool];
const modes = {
	'Manipulate': [[...staples, ClickTool, MoveTool, ResizeTool, RotateTool]                     ],
	'Delete':     [[...staples, DeleteTool]                                                      ],
	'Draw Box':   [[...staples, DrawTool], () => { coach.drawTool.mode = DrawTool.DRAWING_BOX   }],
	'Draw Glyph': [[...staples, DrawTool], () => { coach.drawTool.mode = DrawTool.DRAWING_GLYPH }],
	'Draw Edge':  [[...staples, DrawTool], () => { coach.drawTool.mode = DrawTool.DRAWING_EDGE  }],
};

/* tracking mode */
const mode = new BehaviorSubject;
mode.next('Manipulate');
coach.windowE('keydown')::which(KEY_ESCAPE).subscribe(() => { mode.next('Manipulate') });
mode.subscribe((m) => {
	const [tools, fn = (()=>{})] = modes[m];
	coach.activateExclusiveTools(tools);
	fn();
});

/* buttons */
for (let label of modes::keys()) {
	const button = $(`<button>${label}</button>`).click(() => {
		mode.next(label);
	}).appendTo('#buttons');
	mode.map(m => m === label).subscribe((active) => {
		button.css('font-weight', active ? 'bold' : 'normal');
	});
}



// [   ['Manipulate', { drawTool: { active: false                              }, moveTool: { active: true  }, deleteTool: { active: false }, resizeTool: { active: true  }, rotateTool: { active: true  }, clickTool: { active: true  } }],
// 	['Delete',     { drawTool: { active: false                              }, moveTool: { active: false }, deleteTool: { active: true  }, resizeTool: { active: false }, rotateTool: { active: false }, clickTool: { active: false } }],
// 	['Draw Box',   { drawTool: { active: true, mode: DrawTool.DRAWING_BOX   }, moveTool: { active: false }, deleteTool: { active: false }, resizeTool: { active: true  }, rotateTool: { active: false }, clickTool: { active: false } }],
// 	['Draw Glyph', { drawTool: { active: true, mode: DrawTool.DRAWING_GLYPH }, moveTool: { active: false }, deleteTool: { active: false }, resizeTool: { active: true  }, rotateTool: { active: false }, clickTool: { active: false } }],
// 	['Draw Edge',  { drawTool: { active: true, mode: DrawTool.DRAWING_EDGE  }, moveTool: { active: false }, deleteTool: { active: false }, resizeTool: { active: true  }, rotateTool: { active: false }, clickTool: { active: false } }]
// ].forEach(([label, toolSettings]) => {
//
// });




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
				transformation: ID_MATRIX.translate(15, 15)
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
