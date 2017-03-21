import { extendJob } from './extendJob';
import { postAutoModelBuildRequest } from '../h2oProxy/postAutoModelBuildRequest';

export function requestAutoModelBuild(_, opts, go) {
  const params = {
    input_spec: {
      training_frame: opts.frame,
      response_column: opts.column,
    },
    build_control: { stopping_criteria: { max_runtime_secs: opts.maxRunTime } },
  };
  return postAutoModelBuildRequest(_, params, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendJob(_, result.job));
  });
}
