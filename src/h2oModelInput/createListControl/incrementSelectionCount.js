export function incrementSelectionCount(amount, _selectionCount) {
  const Flow = window.Flow;
  return _selectionCount(_selectionCount() + amount);
}
