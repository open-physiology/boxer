import RxCSS from 'rxcss';

import {stopPropagation} from 'utilities';

import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {sineWave, animationFrames} from '../util/misc';
import {plainDOM} from '../libs/jquery';

const {floor, sin, PI, min, max} = Math;


export class HighlightTool extends Tool {
	
	init({coach}) {
		super.init({ coach, events: ['mouseenter', 'mouseleave'] });
		
		const redWave   = sineWave({ amplitude: 40, period: 10000               },
		                           { amplitude: 30, period:   800, phase: 50*PI });
		const greenWave = sineWave({ amplitude: 30, period:  3000               });
		const blueWave  = sineWave({ amplitude: 30, period:  6000, phase: 1500  });
		RxCSS({
			'boxer-highlight-color': animationFrames.map(() => {
				const t = Date.now();
				return `rgb(
					${floor(min( 255, 160+redWave  (t) ))},
					${floor(min( 255, 225+greenWave(t) ))},
					${floor(min( 255, 225+blueWave (t) ))}
				)`;
			}),
			'boxer-highlight-dash-offset': animationFrames.map(() => {
				const t = Date.now();
				return floor(t % 1000 / 1000 * 45);
			})
		}, this.coach.root.svg.main::plainDOM());
		
		const $$oldFill = Symbol('$$oldFill');
		function turnOnColorCycle(handler) {
			const css = {
				strokeWidth:      4,
				opacity:          1,
				stroke:           'var(--boxer-highlight-color)',
				fill:             'var(--boxer-highlight-color)',
				strokeDasharray:  '10,5',
				strokeDashoffset: 'var(--boxer-highlight-dash-offset)'
			};
			if (handler.effect.elements) {
				handler.effect.elements.css(css);
			}
			if (handler.effect.selector) {
				handler.artefact.setStyle({
					[handler.effect.selector]: css
				});
			}
		}
		function turnOffColorCycle(handler) {
			const css = { opacity: 0 };
			if (handler.effect.elements) {
				handler.effect.elements.css(css);
			}
			if (handler.effect.selector) {
				handler.artefact.setStyle({
					[handler.effect.selector]: css
				});
			}
		}
		
		// TODO: create 'selected' tool, and just use 'selected' to highlight
		
		let selectedHandler = null;
		coach.stateMachine.extend(({ enterState, subscribeDuringState }) => ({
			'IDLE': () => [
				this.e('mouseenter')
					.do(stopPropagation)
					::handleBoxer('highlightable')
					::subscribeDuringState((handler) => {
						if (selectedHandler) { turnOffColorCycle(selectedHandler) }
						selectedHandler = handler;
						turnOnColorCycle(selectedHandler);
					}),
			    this.e('mouseleave')
				    .do(stopPropagation)
				    ::handleBoxer('highlightable')
				    ::subscribeDuringState((handler) => {
						if (selectedHandler && selectedHandler.artefact === handler.artefact) {
							turnOffColorCycle(selectedHandler);
							selectedHandler = null;
						}
					})
			]
		}));
	}
}
