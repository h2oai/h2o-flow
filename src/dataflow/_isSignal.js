import { isObservableFunction } from './isObservableFunction';

export function _isSignal() {
  const ko = window.ko;
  let isObservable;
  if (typeof ko !== 'undefined' && ko !== null) {
    isObservable = ko.isObservable;
  } else {
    isObservable = isObservableFunction;
  }
  return isObservable;
}
