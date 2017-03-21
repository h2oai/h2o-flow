import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oSplitFrameOutput(_, _go, _splitFrameResult) {
  const lodash = window._;
  let index;
  let key;
  const computeRatios = sourceRatios => {
    let ratio;
    let total;
    total = 0;
    const ratios = ((() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = sourceRatios.length; _i < _len; _i++) {
        ratio = sourceRatios[_i];
        total += ratio;
        _results.push(ratio);
      }
      return _results;
    })());
    ratios.push(1 - total);
    return ratios;
  };
  const createFrameView = (key, ratio) => {
    const view = () => _.insertAndExecuteCell('cs', `getFrameSummary ${flowPrelude.stringify(key)}`);
    const self = {
      key,
      ratio,
      view,
    };
    return self;
  };
  const _ratios = computeRatios(_splitFrameResult.ratios);
  const _frames = ((() => {
    let _i;
    let _len;
    const _ref = _splitFrameResult.keys;
    const _results = [];
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      key = _ref[index];
      _results.push(createFrameView(key, _ratios[index]));
    }
    return _results;
  })());
  lodash.defer(_go);
  return {
    frames: _frames,
    template: 'flow-split-frame-output',
  };
}

