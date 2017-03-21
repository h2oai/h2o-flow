export function changeSelection(source, value) {
  let entry;
  let _i;
  let _len;
  for (_i = 0, _len = source.length; _i < _len; _i++) {
    entry = source[_i];
    entry.isSelected(value);
  }
}
