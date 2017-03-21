import { getModelRequest } from '../h2oProxy/getModelRequest';
import { extendModel } from './extendModel';

export function requestModel(_, modelKey, go) {
  return getModelRequest(_, modelKey, (error, model) => {
    if (error) {
      return go(error);
    }
    return go(null, extendModel(_, model));
  });
}
