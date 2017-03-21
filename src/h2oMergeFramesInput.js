import { uuid } from './utils/uuid';

import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oMergeFramesInput(_, _go) {
  const lodash = window._;
  const Flow = window.Flow;
  // TODO display in .jade
  const _exception = Flow.Dataflow.signal(null);
  const _destinationKey = Flow.Dataflow.signal(`merged-${uuid()}`);
  const _frames = Flow.Dataflow.signals([]);
  const _selectedLeftFrame = Flow.Dataflow.signal(null);
  const _leftColumns = Flow.Dataflow.signals([]);
  const _selectedLeftColumn = Flow.Dataflow.signal(null);
  const _includeAllLeftRows = Flow.Dataflow.signal(false);
  const _selectedRightFrame = Flow.Dataflow.signal(null);
  const _rightColumns = Flow.Dataflow.signals([]);
  const _selectedRightColumn = Flow.Dataflow.signal(null);
  const _includeAllRightRows = Flow.Dataflow.signal(false);
  const _canMerge = Flow.Dataflow.lift(_selectedLeftFrame, _selectedLeftColumn, _selectedRightFrame, _selectedRightColumn, (lf, lc, rf, rc) => lf && lc && rf && rc);
  Flow.Dataflow.react(_selectedLeftFrame, frameKey => {
    if (frameKey) {
      return _.requestFrameSummaryWithoutData(_, frameKey, (error, frame) => _leftColumns(lodash.map(frame.columns, (column, i) => ({
        label: column.label,
        index: i,
      }))));
    }
    _selectedLeftColumn(null);
    return _leftColumns([]);
  });
  Flow.Dataflow.react(_selectedRightFrame, frameKey => {
    if (frameKey) {
      return _.requestFrameSummaryWithoutData(_, frameKey, (error, frame) => _rightColumns(lodash.map(frame.columns, (column, i) => ({
        label: column.label,
        index: i,
      }))));
    }
    _selectedRightColumn(null);
    return _rightColumns([]);
  });
  const _merge = () => {
    if (!_canMerge()) {
      return;
    }
    const cs = `mergeFrames ${flowPrelude.stringify(_destinationKey())}, ${flowPrelude.stringify(_selectedLeftFrame())}, ${_selectedLeftColumn().index}, ${_includeAllLeftRows()}, ${flowPrelude.stringify(_selectedRightFrame())}, ${_selectedRightColumn().index}, ${_includeAllRightRows()}`;
    return _.insertAndExecuteCell('cs', cs);
  };
  _.requestFrames(_, (error, frames) => {
    let frame;
    if (error) {
      return _exception(new Flow.Error('Error fetching frame list.', error));
    }
    return _frames((() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = frames.length; _i < _len; _i++) {
        frame = frames[_i];
        if (!frame.is_text) {
          _results.push(frame.frame_id.name);
        }
      }
      return _results;
    })());
  });
  lodash.defer(_go);
  return {
    destinationKey: _destinationKey,
    frames: _frames,
    selectedLeftFrame: _selectedLeftFrame,
    leftColumns: _leftColumns,
    selectedLeftColumn: _selectedLeftColumn,
    includeAllLeftRows: _includeAllLeftRows,
    selectedRightFrame: _selectedRightFrame,
    rightColumns: _rightColumns,
    selectedRightColumn: _selectedRightColumn,
    includeAllRightRows: _includeAllRightRows,
    merge: _merge,
    canMerge: _canMerge,
    template: 'flow-merge-frames-input',
  };
}

