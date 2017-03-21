import { deleteAllRequest } from '../h2oProxy/deleteAllRequest';
import { extendDeletedKeys } from './extendDeletedKeys';

export function requestRemoveAll(_, go) {
  return deleteAllRequest(_, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendDeletedKeys(_, []));
  });
}
