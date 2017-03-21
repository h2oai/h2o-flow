import { getModelsRequest } from '../h2oProxy/getModelsRequest';
import { extendModels } from './extendModels';

export function requestModels(_, go) {
  return getModelsRequest(_, (error, models) => {
    if (error) {
      return go(error);
    }
    return go(null, extendModels(_, models));
  });
}
