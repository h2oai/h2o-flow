import { createObservableFunction } from './createObservableFunction';

export function createSignals(array) {
  const ko = window.ko;
  let createObservableArray;
  if (typeof ko !== 'undefined' && ko !== null) {
    createObservableArray = ko.observableArray;
  } else {
    createObservableArray = createObservableFunction;
  }
  return createObservableArray(array || []);
}
