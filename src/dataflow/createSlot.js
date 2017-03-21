export function createSlot() {
  const lodash = window._;
  const __slice = [].slice;
  let arrow;
  arrow = null;
  const self = function () {
    const args = arguments.length >= 1 ? __slice.call(arguments, 0) : [];
    if (arrow) {
      return arrow.func.apply(null, args);
    }
    return void 0;
  };
  self.subscribe = func => {
    console.assert(lodash.isFunction(func));
    if (arrow) {
      throw new Error('Cannot re-attach slot');
    } else {
      arrow = {
        func,
        dispose() {
          arrow = null;
          return arrow;
        },
      };
      return arrow;
    }
  };
  self.dispose = () => {
    if (arrow) {
      return arrow.dispose();
    }
  };
  return self;
}
