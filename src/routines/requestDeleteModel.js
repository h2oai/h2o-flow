import { extendDeletedKeys } from './extendDeletedKeys';
import { deleteModelRequest } from '../h2oProxy/deleteModelRequest';

export function requestDeleteModel(_, modelKey, go) {
  return deleteModelRequest(_, modelKey, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendDeletedKeys(_, [modelKey]));
  });
}
