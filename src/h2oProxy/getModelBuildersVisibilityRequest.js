import { doGet } from './doGet';
import { unwrap } from './unwrap';

// TODO Obsolete
export function requestModelBuildersVisibility(_, go) {
  return doGet(_, '/3/Configuration/ModelBuilders/visibility', unwrap(go, result => result.value));
}
