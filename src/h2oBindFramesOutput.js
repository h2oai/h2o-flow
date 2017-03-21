import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oBindFramesOutput(_, _go, key, result) {
  const lodash = window._;
  const Flow = window.Flow;
  const viewFrame = () => _.insertAndExecuteCell('cs', `getFrameSummary ${flowPrelude.stringify(key)}`);
  lodash.defer(_go);
  return {
    viewFrame,
    template: 'flow-bind-frames-output',
  };
}

