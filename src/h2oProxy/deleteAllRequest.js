import { doDelete } from './doDelete';

export function deleteAllRequest(_, go) {
  return doDelete(_, '/3/DKV', go);
}
