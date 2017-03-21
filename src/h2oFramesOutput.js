import { formatBytes } from './utils/formatBytes';

import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oFramesOutput(_, _go, _frames) {
  const lodash = window._;
  const Flow = window.Flow;
  let _isCheckingAll;
  const _frameViews = Flow.Dataflow.signal([]);
  const _checkAllFrames = Flow.Dataflow.signal(false);
  const _hasSelectedFrames = Flow.Dataflow.signal(false);
  _isCheckingAll = false;
  Flow.Dataflow.react(_checkAllFrames, checkAll => {
    let _i;
    let _len;
    let view;
    _isCheckingAll = true;
    const _ref = _frameViews();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      view = _ref[_i];
      view.isChecked(checkAll);
    }
    _hasSelectedFrames(checkAll);
    _isCheckingAll = false;
  });
  const createFrameView = frame => {
    const _isChecked = Flow.Dataflow.signal(false);
    Flow.Dataflow.react(_isChecked, () => {
      let view;
      if (_isCheckingAll) {
        return;
      }
      const checkedViews = (() => {
        let _i;
        let _len;
        const _ref = _frameViews();
        const _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (view.isChecked()) {
            _results.push(view);
          }
        }
        return _results;
      })();
      return _hasSelectedFrames(checkedViews.length > 0);
    });
    const columnLabels = lodash.head(lodash.map(frame.columns, column => column.label), 15);
    const view = () => {
      if (frame.is_text) {
        return _.insertAndExecuteCell('cs', `setupParse source_frames: [ ${flowPrelude.stringify(frame.frame_id.name)} ]`);
      }
      return _.insertAndExecuteCell('cs', `getFrameSummary ${flowPrelude.stringify(frame.frame_id.name)}`);
    };
    const predict = () => _.insertAndExecuteCell('cs', `predict frame: ${flowPrelude.stringify(frame.frame_id.name)}`);
    const inspect = () => _.insertAndExecuteCell('cs', `inspect getFrameSummary ${flowPrelude.stringify(frame.frame_id.name)}`);
    const createModel = () => _.insertAndExecuteCell('cs', `assist buildModel, null, training_frame: ${flowPrelude.stringify(frame.frame_id.name)}`);
    return {
      key: frame.frame_id.name,
      isChecked: _isChecked,
      size: formatBytes(frame.byte_size),
      rowCount: frame.rows,
      columnCount: frame.columns,
      isText: frame.is_text,
      view,
      predict,
      inspect,
      createModel,
    };
  };
  const importFiles = () => _.insertAndExecuteCell('cs', 'importFiles');
  const collectSelectedKeys = () => {
    let view;
    let _i;
    let _len;
    const _ref = _frameViews();
    const _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      view = _ref[_i];
      if (view.isChecked()) {
        _results.push(view.key);
      }
    }
    return _results;
  };
  const predictOnFrames = () => _.insertAndExecuteCell('cs', `predict frames: ${flowPrelude.stringify(collectSelectedKeys())}`);
  const deleteFrames = () => _.confirm('Are you sure you want to delete these frames?', {
    acceptCaption: 'Delete Frames',
    declineCaption: 'Cancel',
  }, accept => {
    if (accept) {
      return _.insertAndExecuteCell('cs', `deleteFrames ${flowPrelude.stringify(collectSelectedKeys())}`);
    }
  });
  _frameViews(lodash.map(_frames, createFrameView));
  lodash.defer(_go);
  return {
    frameViews: _frameViews,
    hasFrames: _frames.length > 0,
    importFiles,
    predictOnFrames,
    deleteFrames,
    hasSelectedFrames: _hasSelectedFrames,
    checkAllFrames: _checkAllFrames,
    template: 'flow-frames-output',
  };
}

