import { extendPartialDependence } from './extendPartialDependence';
import { postPartialDependenceDataRequest } from '../h2oProxy/postPartialDependenceDataRequest';

export function requestPartialDependenceData(_, key, go) {
  return postPartialDependenceDataRequest(_, key, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendPartialDependence(_, result));
  });
}
