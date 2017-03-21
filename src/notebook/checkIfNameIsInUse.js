import { getObjectExistsRequest } from '../h2oProxy/getObjectExistsRequest';

export function checkIfNameIsInUse(_, name, go) {
  return getObjectExistsRequest(_, 'notebook', name, (error, exists) => go(exists));
}
