import { doUpload } from './doUpload';
import { unwrap } from './unwrap';

export function postUploadObjectRequest(_, type, name, formData, go) {
  let uri;
  uri = `/3/NodePersistentStorage.bin/${encodeURIComponent(type)}`;
  if (name) {
    uri += `/${encodeURIComponent(name)}`;
  }
  return doUpload(_, uri, formData, unwrap(go, result => result.name));
}
