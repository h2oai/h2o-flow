export function toggleAllInputs(_) {
  let cell;
  let _i;
  let _len;
  let _ref;
  const wereHidden = _.areInputsHidden();
  _.areInputsHidden(!wereHidden);
      //
      // If cells are generated while inputs are hidden, the input boxes
      //   do not resize to fit contents. So explicitly ask all cells
      //   to resize themselves.
      //
  if (wereHidden) {
    _ref = _.cells();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cell = _ref[_i];
      cell.autoResize();
    }
  }
}
