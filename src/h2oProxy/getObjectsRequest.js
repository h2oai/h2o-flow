import { doGet } from './doGet';
import { unwrap } from './unwrap';

export function getObjectsRequest(_, type, go) {
  doGet(_, `/3/NodePersistentStorage/${encodeURIComponent(type)}`, unwrap(go, result => result.entries));
}
