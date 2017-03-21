import { doGet } from './doGet';

export function getProfileRequest(_, depth, go) {
  return doGet(_, `/3/Profiler?depth=${depth}`, go);
}
