import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oSplitFrameInput(_, _go, _frameKey) {
  const lodash = window._;
  const Flow = window.Flow;

  const _frames = Flow.Dataflow.signal([]);
  const _frame = Flow.Dataflow.signal(null);
  const _lastSplitRatio = Flow.Dataflow.signal(1);
  const format4f = value => value.toPrecision(4).replace(/0+$/, '0');
  const _lastSplitRatioText = Flow.Dataflow.lift(_lastSplitRatio, ratio => {
    if (lodash.isNaN(ratio)) {
      return ratio;
    }
    return format4f(ratio);
  });
  const _lastSplitKey = Flow.Dataflow.signal('');
  const _splits = Flow.Dataflow.signals([]);
  const _seed = Flow.Dataflow.signal(Math.random() * 1000000 | 0);
  Flow.Dataflow.react(_splits, () => updateSplitRatiosAndNames());
  const _validationMessage = Flow.Dataflow.signal('');
  const collectRatios = () => {
    let entry;
    let _i;
    let _len;
    const _ref = _splits();
    const _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entry = _ref[_i];
      _results.push(entry.ratio());
    }
    return _results;
  };
  const collectKeys = () => {
    let entry;
    const splitKeys = ((() => {
      let _i;
      let _len;
      const _ref = _splits();
      const _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entry = _ref[_i];
        _results.push(entry.key().trim());
      }
      return _results;
    })());
    splitKeys.push(_lastSplitKey().trim());
    return splitKeys;
  };
  const createSplitName = (key, ratio) => `${key}_${format4f(ratio)}`;
  function updateSplitRatiosAndNames() {
    let entry;
    const frame = _frame();
    let ratio;
    let totalRatio;
    let _i;
    let _j;
    let _len;
    let _len1;
    totalRatio = 0;
    const _ref = collectRatios();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ratio = _ref[_i];
      totalRatio += ratio;
    }
    const lastSplitRatio = _lastSplitRatio(1 - totalRatio);
    const frameKey = frame || 'frame';
    const _ref1 = _splits();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      entry = _ref1[_j];
      entry.key(createSplitName(frameKey, entry.ratio()));
    }
    _lastSplitKey(createSplitName(frameKey, _lastSplitRatio()));
  }
  const computeSplits = go => {
    let key;
    let ratio;
    let totalRatio;
    let _i;
    let _j;
    let _len;
    let _len1;
    if (!_frame()) {
      return go('Frame not specified.');
    }
    const splitRatios = collectRatios();
    totalRatio = 0;
    for (_i = 0, _len = splitRatios.length; _i < _len; _i++) {
      ratio = splitRatios[_i];
      if (
        ratio > 0 &&
        ratio < 1
      ) {
        totalRatio += ratio;
      } else {
        return go('One or more split ratios are invalid. Ratios should between 0 and 1.');
      }
    }
    if (totalRatio >= 1) {
      return go('Sum of ratios is >= 1.');
    }
    const splitKeys = collectKeys();
    for (_j = 0, _len1 = splitKeys.length; _j < _len1; _j++) {
      key = splitKeys[_j];
      if (key === '') {
        return go('One or more keys are empty or invalid.');
      }
    }
    if (splitKeys.length < 2) {
      return go('Please specify at least two splits.');
    }
    if (splitKeys.length !== lodash.unique(splitKeys).length) {
      return go('Duplicate keys specified.');
    }
    return go(null, splitRatios, splitKeys);
  };
  const createSplit = ratio => {
    const _ratioText = Flow.Dataflow.signal(`${ratio}`);
    const _key = Flow.Dataflow.signal('');
    const _ratio = Flow.Dataflow.lift(_ratioText, text => parseFloat(text));
    Flow.Dataflow.react(_ratioText, updateSplitRatiosAndNames);
    flowPrelude.remove = () => _splits.remove(self);
    const self = {
      key: _key,
      ratioText: _ratioText,
      ratio: _ratio,
      remove: flowPrelude.remove,
    };
    return self;
  };
  const addSplitRatio = ratio => _splits.push(createSplit(ratio));
  const addSplit = () => addSplitRatio(0);
  const splitFrame = () => computeSplits((error, splitRatios, splitKeys) => {
    if (error) {
      return _validationMessage(error);
    }
    _validationMessage('');
    return _.insertAndExecuteCell('cs',
      `splitFrame ${flowPrelude.stringify(_frame())}, ${flowPrelude.stringify(splitRatios)}, ${flowPrelude.stringify(splitKeys)}, ${_seed()}`); // eslint-disable-line
  });
  const initialize = () => {
    _.requestFrames(_, (error, frames) => {
      let frame;
      let frameKeys;
      if (!error) {
        frameKeys = ((() => {
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
        frameKeys.sort();
        _frames(frameKeys);
        return _frame(_frameKey);
      }
    });
    addSplitRatio(0.75);
    return lodash.defer(_go);
  };
  initialize();
  return {
    frames: _frames,
    frame: _frame,
    lastSplitRatio: _lastSplitRatio,
    lastSplitRatioText: _lastSplitRatioText,
    lastSplitKey: _lastSplitKey,
    splits: _splits,
    seed: _seed,
    addSplit,
    splitFrame,
    validationMessage: _validationMessage,
    template: 'flow-split-frame-input',
  };
}

