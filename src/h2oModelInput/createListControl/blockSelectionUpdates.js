export function blockSelectionUpdates(f) {
  let _isUpdatingSelectionCount = true;
  f();
  _isUpdatingSelectionCount = false;
  return _isUpdatingSelectionCount;
}
