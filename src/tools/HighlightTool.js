import RxCSS from 'rxcss';
import {sineWave, animationFrames} from '../util/misc';
import {plainDOM} from '../libs/jquery';
import {sum} from 'lodash-bound';
import {GlobalBehaviorTool} from './GlobalBehaviorTool';

const {floor, PI, min} = Math;





export class HighlightTool extends GlobalBehaviorTool {
	
	/* 'selectable' related highlighting */
	HIGHLIGHT_DEFAULT = (() => {
		const redWave   = sineWave({ amplitude: 40, period: 10000               },
		                           { amplitude: 30, period:   800, phase: 50*PI });
		const greenWave = sineWave({ amplitude: 30, period:  3000               });
		const blueWave  = sineWave({ amplitude: 30, period:  6000, phase: 1500  });
		return {
			colorCycle: () => {
				const t = Date.now();
				return `rgb(
					${floor(min( 255, 160+redWave  (t) ))},
					${floor(min( 255, 225+greenWave(t) ))},
					${floor(min( 255, 225+blueWave (t) ))}
				)`;
			},
			dashCycle: () => {
				const t = Date.now();
				return floor(t % 1000 / 1000 * 45);
			},
			dashArray: [10, 5],
			dashSpeed: 3
		};
	})();
	
	
	deactivateBehavior(previous) {
		/* set value */
		this.currentValue = null;
		/* set styling */
		const handler = previous.artefact.handlers.highlightable;
		if (!handler) { return }
		const css = { opacity: 0 };
		if (handler.effect.elements) { handler.effect.elements.css(css)                    }
		if (handler.effect.selector) { artefact.setCSS({ [handler.effect.selector]: css }) }
	}
	
	activateBehavior(current) {
		
		console.log('highlighting', current);
		
		/* set value */
		this.currentValue = current;
		/* set styling */
		const handler = current.artefact.handlers.highlightable;
		if (!handler) { return }
		const css = {
			strokeWidth:      4,
			opacity:          1,
			strokeDasharray:  current.dashArray.join(','),
			stroke:           'var(--boxer-highlight-color)',
			fill:             'var(--boxer-highlight-color)',
			strokeDashoffset: 'var(--boxer-highlight-dash-offset)'
		};
		if (handler.effect.elements) { handler.effect.elements.css(css)                    }
		if (handler.effect.selector) { artefact.setCSS({ [handler.effect.selector]: css }) }
	}
	
	
	init({coach}) {
		super.init({ coach });
		
		/* set initial behavior to 'no effect' = null */
		this.currentValue = null;
		
		/* one-time setup of RxCSS */
		RxCSS({
			'boxer-highlight-color': animationFrames
				.filter(() => this.currentValue)
				.map   (() => this.currentValue.colorCycle()),
			'boxer-highlight-dash-offset': animationFrames
				.filter(() => this.currentValue)
				.map   (() => {
					const t = Date.now();
					const speed = this.currentValue.dashSpeed * this.currentValue.dashArray::sum();
					return floor(t % 1000 / 1000 * speed);
				})
		});//, this.coach.root.svg.main::plainDOM());
	}
}





// export class HighlightTool extends GlobalBehaviorTool {
//
// 	/* 'selectable' related highlighting */
// 	HIGHLIGHT_DEFAULT = (() => {
// 		const redWave   = sineWave({ amplitude: 40, period: 10000               },
// 		                           { amplitude: 30, period:   800, phase: 50*PI });
// 		const greenWave = sineWave({ amplitude: 30, period:  3000               });
// 		const blueWave  = sineWave({ amplitude: 30, period:  6000, phase: 1500  });
// 		return {
// 			colorCycle: () => {
// 				const t = Date.now();
// 				return `rgb(
// 					${floor(min( 255, 160+redWave  (t) ))},
// 					${floor(min( 255, 225+greenWave(t) ))},
// 					${floor(min( 255, 225+blueWave (t) ))}
// 				)`;
// 			},
// 			dashCycle: () => {
// 				const t = Date.now();
// 				return floor(t % 1000 / 1000 * 45);
// 			},
// 			dashArray: [10, 5],
// 			dashSpeed: 3
// 		};
// 	})();
//
//
// 	activateGlobalBehavior({ value }) {
// 		/* set value */
// 		this.currentValue = value;
// 	}
// 	activateLocalBehavior({ value, originalArtefact }) {
// 		/* set styling */
// 		if (!originalArtefact) { return }
// 		const handler = originalArtefact.handlers.highlightable;
// 		if (!handler)  { return }
// 		const css = value ? {
// 			strokeWidth:      4,
// 			opacity:          1,
// 			strokeDasharray:  value.dashArray.join(','),
// 			stroke:           'var(--boxer-highlight-color)',
// 			fill:             'var(--boxer-highlight-color)',
// 			strokeDashoffset: 'var(--boxer-highlight-dash-offset)'
// 		} : {
// 			opacity: 0
// 		};
// 		if (handler.effect.elements) { handler.effect.elements.css(css)                         }
// 		if (handler.effect.selector) { originalArtefact.setCSS({ [this.effect.selector]: css }) }
// 	}
//
//
// 	init({coach}) {
// 		super.init({ coach });
//
// 		/* set initial behavior to 'no effect' = null */
// 		this.currentValue = null;
//
// 		/* one-time setup of RxCSS */
// 		RxCSS({
// 			'boxer-highlight-color': animationFrames
// 				.filter(() => this.currentValue)
// 				.map(() => this.currentValue.colorCycle()),
// 			'boxer-highlight-dash-offset': animationFrames
// 				.filter(() => this.currentValue)
// 				.map(() => {
// 					const t = Date.now();
// 					const speed = this.currentValue.dashSpeed * this.currentValue.dashArray::sum();
// 					return floor(t % 1000 / 1000 * speed);
// 				})
// 		}, this.coach.root.svg.main::plainDOM());
// 	}
// }
