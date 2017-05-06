import {handleBoxer} from '../Coach.js';
import {MouseTool}   from './MouseTool';
import {sineWave} from '../util/misc';

const {min, max, floor, PI} = Math;


export class DeleteTool extends MouseTool {
	
	/* 'selectable' related highlighting */
	HIGHLIGHT_DELETING = (() => {
		const wave = sineWave({ amplitude: 140, period: 1000 });
		// const greenWave = sineWave({ amplitude: 30, period:  3000               });
		// const blueWave  = sineWave({ amplitude: 30, period:  6000, phase: 1500  });
		return {
			colorCycle: () => {
				const t = Date.now();
				return `rgb(
					${floor(max( 255, 215-wave(t) ))},
					${floor(min( 255,  50+wave(t) ))},
					${floor(min( 255,  50+wave(t) ))}
				)`;
			},
			dashArray: [6, 4],
			dashSpeed: 7
		};
	})();
	
	init({ coach }) {
		super.init({ coach });
		
		coach.highlightTool.register(['IDLE'], ['deletable'], ()=>this.active, () => this.HIGHLIGHT_DELETING);
		
		/* mouse cursor */
		coach.mouseCursorTool.register(['IDLE'], ['deletable'], ()=>this.active, () => `url(${require('./images/trash-32x32.png')}) 10 10, auto`);
		
		/* handle click */
		this.mouseMachine.CLICKING::handleBoxer('deletable').subscribe(({artefact}) => {
			console.log('???');
			artefact.delete();
		});
	}
	
}

