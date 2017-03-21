import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function createSlots() {
  const lodash = window._;
  const __slice = [].slice;
  const arrows = [];
  const self = function () {
    const args = arguments.length >= 1 ? __slice.call(arguments, 0) : [];
    return lodash.map(arrows, arrow => arrow.func.apply(null, args));
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
  self.dispose = () => lodash.forEach(flowPrelude.copy(arrows), arrow => arrow.dispose());
  return self;
}
