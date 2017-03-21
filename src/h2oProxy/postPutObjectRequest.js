import { doPost } from './doPost';
import { unwrap } from './unwrap';

export function postPutObjectRequest(_, type, name, value, go) {
  let uri;
  uri = `/3/NodePersistentStorage/${encodeURIComponent(type)}`;
  if (name) {
    uri += `/${encodeURIComponent(name)}`;
  }
  return doPost(_, uri, { value: JSON.stringify(value, null, 2) }, unwrap(go, result => result.name));
}
