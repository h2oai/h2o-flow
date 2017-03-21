export function _unlink(arrows) {
  const lodash = window._;
  let arrow;
  let _i;
  let _len;
  let _results;
  if (lodash.isArray(arrows)) {
    _results = [];
    for (_i = 0, _len = arrows.length; _i < _len; _i++) {
      arrow = arrows[_i];
      console.assert(lodash.isFunction(arrow.dispose, '[arrow] does not have a [dispose] method'));
      _results.push(arrow.dispose());
    }
    return _results;
  }
  console.assert(lodash.isFunction(arrows.dispose, '[arrow] does not have a [dispose] method'));
  return arrows.dispose();
}
