import { doGet } from './doGet';

export function getSchemaRequest(_, name, go) {
  return doGet(_, `/3/Metadata/schemas/${encodeURIComponent(name)}`, go);
}
