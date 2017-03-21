import { _fork } from './_fork';
import { extendDeletedKeys } from './extendDeletedKeys';
import { deleteModelRequest } from '../h2oProxy/deleteModelRequest';

export function requestDeleteModels(_, modelKeys, go) {
  const lodash = window._;
  const Flow = window.Flow;
  const futures = lodash.map(modelKeys, modelKey => _fork(deleteModelRequest, _, modelKey));
  return Flow.Async.join(futures, (error, results) => {
    if (error) {
      return go(error);
    }
    return go(null, extendDeletedKeys(_, modelKeys));
  });
}
