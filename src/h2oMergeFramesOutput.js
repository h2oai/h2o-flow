import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oMergeFramesOutput(_, _go, _mergeFramesResult) {
  const lodash = window._;
  const Flow = window.Flow;
  const _frameKey = _mergeFramesResult.key;
  const _viewFrame = () => _.insertAndExecuteCell('cs', `getFrameSummary ${flowPrelude.stringify(_frameKey)}`);
  lodash.defer(_go);
  return {
    frameKey: _frameKey,
    viewFrame: _viewFrame,
    template: 'flow-merge-frames-output',
  };
}

