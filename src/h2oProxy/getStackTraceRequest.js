import { doGet } from './doGet';

export function getStackTraceRequest(_, go) {
  return doGet(_, '/3/JStack', go);
}
