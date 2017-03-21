import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function formulateGetPredictionsOrigin(opts) {
  const lodash = window._;
  let opt;
  let sanitizedOpt;
  let sanitizedOpts;
  if (lodash.isArray(opts)) {
    sanitizedOpts = (() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = opts.length; _i < _len; _i++) {
        opt = opts[_i];
        sanitizedOpt = {};
        if (opt.model) {
          sanitizedOpt.model = opt.model;
        }
        if (opt.frame) {
          sanitizedOpt.frame = opt.frame;
        }
        _results.push(sanitizedOpt);
      }
      return _results;
    })();
    return `getPredictions ${flowPrelude.stringify(sanitizedOpts)}`;
  }
  const modelKey = opts.model;
  const frameKey = opts.frame;
  if (modelKey && frameKey) {
    return `getPredictions model: ${flowPrelude.stringify(modelKey)}, frame: ${flowPrelude.stringify(frameKey)}`;
  } else if (modelKey) {
    return `getPredictions model: ${flowPrelude.stringify(modelKey)}`;
  } else if (frameKey) {
    return `getPredictions frame: ${flowPrelude.stringify(frameKey)}`;
  }
  return 'getPredictions()';
}
