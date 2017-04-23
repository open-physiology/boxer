import {isFinite as _isFinite} from 'lodash';
import {Observable, Scheduler} from 'rxjs';

export * from 'utilities';

const {sin, PI} = Math;


export const _isNonNegative = (v) =>
	(_isFinite(v) && v >= 0);

export function emitWhenComplete(value) {
	return this.ignoreElements().concat(Observable.of(value));
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
