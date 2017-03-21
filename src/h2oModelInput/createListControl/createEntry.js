import { incrementSelectionCount } from './incrementSelectionCount';

export function createEntry(value, _selectionCount, _isUpdatingSelectionCount) {
  const Flow = window.Flow;
  const isSelected = Flow.Dataflow.signal(false);
  Flow.Dataflow.react(isSelected, isSelected => {
    if (!_isUpdatingSelectionCount) {
      if (isSelected) {
        incrementSelectionCount(1, _selectionCount);
      } else {
        incrementSelectionCount(-1, _selectionCount);
      }
    }
  });
  return {
    isSelected,
    value: value.value,
    type: value.type,
    missingLabel: value.missingLabel,
    missingPercent: value.missingPercent,
  };
}
