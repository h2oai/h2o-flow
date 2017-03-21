import { doGet } from './doGet';

export function getSchemasRequest(_, go) {
  return doGet(_, '/3/Metadata/schemas', go);
}
