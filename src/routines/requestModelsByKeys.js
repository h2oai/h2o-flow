import { _fork } from './_fork';
import { extendModels } from './extendModels';
import { getModelRequest } from '../h2oProxy/getModelRequest';

export function requestModelsByKeys(_, modelKeys, go) {
  const lodash = window._;
  const Flow = window.Flow;
  const futures = lodash.map(modelKeys, key => _fork(getModelRequest, _, key));
  return Flow.Async.join(futures, (error, models) => {
    if (error) {
      return go(error);
    }
    return go(null, extendModels(_, models));
  });
}
