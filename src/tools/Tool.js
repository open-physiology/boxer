import {ValueTracker, property} from 'utilities';
import {isUndefined}            from 'lodash-bound';
import {Observable}             from '../libs/expect-rxjs.js';


export default class Tool extends ValueTracker {
	
	@property({ initial: true }) active;
	
	constructor({active} = {}) {
		super();
		if (!active::isUndefined()) { this.active = active }
	}
	
	init({coach, events = []} = {}) {
		this.coach = coach;
		for (let e of events) {
			coach.registerArtefactEvent(e);
		}
	}
	
	myE(stream)  { return this.p('active').switchMap(a => a ? stream : Observable.never()) }
	rootE    (e) { return this.myE(this.coach.rootE    (e)) }
	windowE  (e) { return this.myE(this.coach.windowE  (e)) }
	documentE(e) { return this.myE(this.coach.documentE(e)) }
	e        (e) { return this.myE(this.coach.e        (e)) }
	
}
