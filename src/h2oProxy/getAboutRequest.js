import { doGet } from './doGet';

export function getAboutRequest(_, go) {
  return doGet(_, '/3/About', go);
}
