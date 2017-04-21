import {isFinite as _isFinite} from 'lodash';

export * from 'utilities';

export const _isNonNegative = (v) =>
	(_isFinite(v) && v >= 0);

import {Observable} from 'rxjs';
export function emitWhenComplete(value) {
	return this.ignoreElements().concat(Observable.of(value));
}
