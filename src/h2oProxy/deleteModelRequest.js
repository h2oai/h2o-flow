import { doDelete } from './doDelete';

export function deleteModelRequest(_, key, go) {
  return doDelete(_, `/3/Models/${encodeURIComponent(key)}`, go);
}
