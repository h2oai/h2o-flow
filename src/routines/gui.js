import { _fork } from './_fork';
import { createGui } from './createGui';

// not used anywhere beyond src/routines/routines?
// replaced by src/gui/gui?
export function gui(_, controls) {
  const Flow = window.Flow;
  _fork(createGui, _, controls);
  const _ref = Flow.Gui;
  let nameThing;
  for (nameThing in _ref) {
    if ({}.hasOwnProperty.call(_ref, nameThing)) {
      const f = _ref[nameThing];
      gui[nameThing] = f;
    }
  }
}
