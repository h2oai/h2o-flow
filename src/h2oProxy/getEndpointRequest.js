import { doGet } from './doGet';

export function getEndpointRequest(_, index, go) {
  return doGet(_, `/3/Metadata/endpoints/${index}`, go);
}
