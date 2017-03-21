import { extendStackTrace } from './extendStackTrace';
import { getStackTraceRequest } from '../h2oProxy/getStackTraceRequest';

export function requestStackTrace(_, go) {
  return getStackTraceRequest(_, (error, stackTrace) => {
    if (error) {
      return go(error);
    }
    return go(null, extendStackTrace(_, stackTrace));
  });
}
