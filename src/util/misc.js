import {isFinite as _isFinite} from 'lodash';
import {isFunction} from 'lodash-bound';
import {Observable, Scheduler} from 'rxjs';

export * from 'utilities';

const {sin, PI} = Math;


export const _isNonNegative = (v) =>
	(_isFinite(v) && v >= 0);

export function emitWhenComplete(value) {
	return this.ignoreElements().concat(Observable.of(value));
}

export function withLatestFrom(stream, combinator = (a, b) => [a, b]) {
	return Observable.create((observer) => {
		let value;
		const subscription1 = stream.subscribe((v) => { value = v });
		const subscription2 = this.map(v => combinator(v, value)).subscribe(observer);
		return () => {
			subscription1.unsubscribe();
			subscription2.unsubscribe();
		};
	}).share();
}

export function sineWave(...waves) {
	return (time) => {
		let result = 0;
		for (let {
			amplitude,
			period    = 1/frequency,
			frequency = 1/period,
			phase     = 0
		} of waves) {
			result += amplitude * sin(2 * PI * frequency * time + phase);
		}
		return result;
	};
}

export const animationFrames = Observable.interval(1000/30, Scheduler.animationFrame);

export function strictSubclassOf(cls) {
	return this.prototype instanceof cls;
}

export function subclassOf(cls) {
	return this === cls || this::strictSubclassOf(cls);
}

export function callIfFunction(...args) {
	if (this::isFunction()) {
		return this(...args);
	}
}
