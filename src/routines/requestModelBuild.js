import { extendJob } from './extendJob';
import { postModelBuildRequest } from '../h2oProxy/postModelBuildRequest';

export function requestModelBuild(_, algo, opts, go) {
  return postModelBuildRequest(_, algo, opts, (error, result) => {
    const Flow = window.Flow;
    let messages;
    let validation;
    if (error) {
      return go(error);
    }
    if (result.error_count > 0) {
      messages = (() => {
        let _i;
        let _len;
        const _ref1 = result.messages;
        const _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          validation = _ref1[_i];
          _results.push(validation.message);
        }
        return _results;
      })();
      return go(new Flow.Error(`Model build failure: ${messages.join('; ')}`));
    }
    return go(null, extendJob(_, result.job));
  });
}
