import { doGet } from './doGet';

export function getEndpointsRequest(_, go) {
  return doGet(_, '/3/Metadata/endpoints', go);
}
