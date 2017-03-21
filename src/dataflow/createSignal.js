import { createObservableFunction } from './createObservableFunction';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function createSignal(value, equalityComparer) {
  const lodash = window._;
  const ko = window.ko;

  // decide if we use knockout observables
  // or Flow custom observables
  let createObservable;
  if (typeof ko !== 'undefined' && ko !== null) {
    createObservable = ko.observable;
  } else {
    createObservable = createObservableFunction;
  }

  // create the signal
  if (arguments.length === 0) {
    return createSignal(void 0, flowPrelude.never);
  }
  const observable = createObservable(value);
  if (lodash.isFunction(equalityComparer)) {
    observable.equalityComparer = equalityComparer;
  }
  return observable;
}
