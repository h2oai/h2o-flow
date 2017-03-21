import { doGet } from './doGet';

export function getNetworkTestRequest(_, go) {
  return doGet(_, '/3/NetworkTest', go);
}

