import { getNetworkTestRequest } from '../h2oProxy/getNetworkTestRequest';
import { extendNetworkTest } from './extendNetworkTest';

export function requestNetworkTest(_, go) {
  return getNetworkTestRequest(_, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendNetworkTest(_, result));
  });
}
