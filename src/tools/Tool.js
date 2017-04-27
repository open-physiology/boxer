import {ValueTracker, flag} from 'utilities';
import $                    from '../libs/jquery.js';
import {isUndefined}        from 'lodash-bound';
import {Observable}         from 'rxjs';


export default class Tool extends ValueTracker {
	
	@flag({ initial: true }) active;
	
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
	canvasE  (e) { return this.myE(this.coach.canvasE  (e)) }
	windowE  (e) { return this.myE(this.coach.windowE  (e)) }
	documentE(e) { return this.myE(this.coach.documentE(e)) }
	e        (e) { return this.myE(this.coach.e        (e)) }
	
}

