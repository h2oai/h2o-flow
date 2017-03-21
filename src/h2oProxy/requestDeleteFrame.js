import { doDelete } from './doDelete';

export function requestDeleteFrame(_, key, go) {
  doDelete(_, `/3/Frames/${encodeURIComponent(key)}`, go);
}
