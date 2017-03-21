import { doGet } from './doGet';

export function getCloudRequest(_, go) {
  return doGet(_, '/3/Cloud', go);
}
