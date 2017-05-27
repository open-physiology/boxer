import {handleBoxer} from '../Coach.js';
import {MouseTool}   from './MouseTool';
import {sineWave}    from '../util/misc';

import {Observable} from '../libs/expect-rxjs.js';
import {match} from 'utilities';

const {min, max, floor, PI} = Math;


export class DeleteTool extends MouseTool {
	
	/* 'selectable' related highlighting */
	HIGHLIGHT_DELETING = (() => {
		const wave = sineWave({ amplitude: 140, period: 1000 });
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
		
		/* handle click */
		this.mouseMachine.CLICKING::handleBoxer('deletable').subscribe(({artefact}) => {
			
			console.log('((a))', artefact); // TODO
			
			artefact.delete();
		});
		
		/* prep for highlighting and mouse cursors */
		const handlerArtefactOrNull = (key) => (a) => (a && a.handlers[key] && a.handlers['highlightable']) ? a.handlers[key].artefact : null;
		const deletableArtefact = coach.p('selectedArtefact').map(handlerArtefactOrNull('movable'));
		
		/* highlighting */
		coach.highlightTool.register(this, coach.stateMachine.p('state').switchMap(state => match(state)({
			'IDLE': deletableArtefact,
			'BUSY': Observable.of(null)
		})).map(artefact => artefact && {
			...this.HIGHLIGHT_DELETING,
			artefact
		}));
		
		/* mouse cursors */
		const deleteCursor = `url(${require('./images/trash-32x32.png')}) 10 10, auto`;
		coach.mouseCursorTool.register(this, coach.stateMachine.p('state').startWith(null).pairwise().switchMap(([prev, next]) => match(next)({
			'IDLE': deletableArtefact.map(ma => ma && deleteCursor).startWith(prev && deleteCursor),
			'BUSY': Observable.of(null)
		})));
		
	}
	
}

