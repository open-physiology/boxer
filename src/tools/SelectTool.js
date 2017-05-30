import $ from '../libs/jquery.js';
import Tool from './Tool';
import {handleBoxer} from '../Coach.js';
import {Observable} from '../libs/expect-rxjs.js';
import {withMod, flag} from 'utilities';
import {elementController} from '../Coach';
import {Point2D} from '../util/svg';

export class SelectTool extends Tool {
	
	init({coach}) {
		super.init({ coach, events: ['mouseover', 'mouseout', 'mouseenter', 'mouseleave'] });
		
		this.reacquire = ()=>{};
		const reacquires = Observable.create((observer) => {
			this.reacquire = (point) => {
				let element;
				if (point) {
					point = point.in(coach.root.svg.children);
					let {left, top} = coach.root.svg.main.offset();
					element = document.elementFromPoint(
						left + point.x,
						top  + point.y
					);
				} else {
					let hover = $(':hover');
					element = hover[hover.length-1];
				}
				if (element instanceof SVGElement) {
					observer.next({
						artefact: elementController(element),
						point: new Point2D({ x: 0, y: 0, coordinateSystem: element })
					});
				}
			};
			return () => {
				this.reacquire = ()=>{};
			};
		}).share();
		
		coach.setSelectedArtefact = ()=>{};
		const apiAcquires = Observable.create((observer) => {
			coach.setSelectedArtefact = (artefact) => {
				if (!artefact) {
					observer.next(null);
				} else {
					const element = artefact.svg.handles.find('*')[0];
					if (element) {
						observer.next({
							artefact: elementController(element),
							point: new Point2D({ x: 0, y: 0, coordinateSystem: element })
						});
					}
				}
			};
			return () => {
				coach.setSelectedArtefact = ()=>{};
			};
		}).share();
		
		const mouseEnter = this.e('mouseover')
			.merge(reacquires)
			.merge(apiAcquires)
			::handleBoxer('*') // TODO: <-- selectable?
			.map(handler => handler.originalArtefact || handler.artefact);
		
		const mouseLeave = this.e('mouseout')
			.merge(reacquires)
			::handleBoxer('*') // TODO: <-- selectable?
			.map(handler => handler.originalArtefact || handler.artefact);
		
		const altScroll = this.rootE('mousewheel')
			.filter(withMod('alt'))
			.do((e) => { e.preventDefault() })
			.map(e=>e.deltaY);
		
		const mouseArtefact = mouseEnter.switchMap(enter => {
			
			const initialSelect = Observable.of(enter);
			
			const mouseleaveSelect = Observable.merge(
				mouseEnter.filter(next  => next  !== enter),
				mouseLeave.filter(leave => leave === enter).map(() => null)
			).take(1);
			
			const stack = [];
			const altScrollSelect = altScroll.scan((s, d) => {
				let next;
				if (d > 0) { // up
					if (stack[0] !== s) {
						stack.unshift(s);
						next = s.parent; // TODO: search upward by selection criteria (like supported handlers)
					}
				} else { // back down
					next = stack.shift();
				}
				if (!next) { return s }
				return next;
			}, enter);
			
			return Observable.merge(
				initialSelect,
				altScrollSelect,
				mouseleaveSelect.delay(1)
			);
		}).startWith(null);
		
		coach.newProperty('selectedArtefact', {
			source: mouseArtefact,
			allowSynchronousAccess: true
		});
		
		// coach.p('selectedArtefact').subscribe((a) => {
		// 	console.log('selected:', a && a.svg.main.attr('class'));
		// });
		
		
	}
}
