import { doGet } from './doGet';

export function getTimelineRequest(_, go) {
  return doGet(_, '/3/Timeline', go);
}
