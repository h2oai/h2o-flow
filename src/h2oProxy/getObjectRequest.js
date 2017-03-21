import { doGet } from './doGet';
import { unwrap } from './unwrap';

export function getObjectRequest(_, type, name, go) {
  const urlString = `/3/NodePersistentStorage/${encodeURIComponent(type)}/${encodeURIComponent(name)}`;
  return doGet(_, urlString, unwrap(go, result => JSON.parse(result.value)));
}
