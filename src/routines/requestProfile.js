import { getProfileRequest } from '../h2oProxy/getProfileRequest';
import { extendProfile } from './extendProfile';

export function requestProfile(_, depth, go) {
  return getProfileRequest(_, depth, (error, profile) => {
    if (error) {
      return go(error);
    }
    return go(null, extendProfile(_, profile));
  });
}
