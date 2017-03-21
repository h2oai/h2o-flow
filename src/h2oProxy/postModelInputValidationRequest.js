import { doPost } from './doPost';
import { encodeObjectForPost } from './encodeObjectForPost';

export function postModelInputValidationRequest(_, algo, parameters, go) {
  return doPost(_, `${_.__.modelBuilderEndpoints[algo]}/parameters`, encodeObjectForPost(parameters), go);
}
