import { requestWithOpts } from './requestWithOpts';

export function getModelsRequest(_, go, opts) {
  return requestWithOpts(_, '/3/Models', opts, (error, result) => {
    if (error) {
      return go(error, result);
    }
    return go(error, result.models);
  });
}
