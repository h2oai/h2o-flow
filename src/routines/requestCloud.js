import { getCloudRequest } from '../h2oProxy/getCloudRequest';
import { extendCloud } from './extendCloud';

export function requestCloud(_, go) {
  return getCloudRequest(_, (error, cloud) => {
    if (error) {
      return go(error);
    }
    return go(null, extendCloud(_, cloud));
  });
}
