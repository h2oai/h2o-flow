import { doPost } from './doPost';
import { encodeObjectForPost } from './encodeObjectForPost';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function postModelBuildRequest(_, algo, parameters, go) {
  _.trackEvent('model', algo);
  if (parameters.hyper_parameters) {
      // super-hack: nest this object as stringified json
    parameters.hyper_parameters = flowPrelude.stringify(parameters.hyper_parameters);
    if (parameters.search_criteria) {
      parameters.search_criteria = flowPrelude.stringify(parameters.search_criteria);
    }
    return doPost(_, _.__.gridModelBuilderEndpoints[algo], encodeObjectForPost(parameters), go);
  }
  return doPost(_, _.__.modelBuilderEndpoints[algo], encodeObjectForPost(parameters), go);
}
