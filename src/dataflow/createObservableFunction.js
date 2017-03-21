import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function createObservableFunction(initialValue) {
  const lodash = window._;
  let currentValue;
  const arrows = [];
  currentValue = initialValue;
  const notifySubscribers = (arrows, newValue) => {
    let arrow;
    let _i;
    let _len;
    for (_i = 0, _len = arrows.length; _i < _len; _i++) {
      arrow = arrows[_i];
      arrow.func(newValue);
    }
  };
  const self = function (newValue) {
    if (arguments.length === 0) {
      return currentValue;
    }
    const unchanged = self.equalityComparer ? self.equalityComparer(currentValue, newValue) : currentValue === newValue;
    if (!unchanged) {
      currentValue = newValue;
      return notifySubscribers(arrows, newValue);
    }
  };
  self.subscribe = func => {
    let arrow;
    console.assert(lodash.isFunction(func));
    arrows.push(arrow = {
      func,
      dispose() {
        return flowPrelude.remove(arrows, arrow);
      },
    });
    return arrow;
  };
  self.__observable__ = true;
  return self;
}
