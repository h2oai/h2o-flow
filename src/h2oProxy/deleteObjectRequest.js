import { doDelete } from './doDelete';

export function deleteObjectRequest(_, type, name, go) {
  return doDelete(_, `/3/NodePersistentStorage/${encodeURIComponent(type)}/${encodeURIComponent(name)}`, go);
}
