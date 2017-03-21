import { doGet } from './doGet';
import { unwrap } from './unwrap';

export function requestFrame(_, key, go) {
  const lodash = window._;
  return doGet(_, `/3/Frames/${encodeURIComponent(key)}`, unwrap(go, result => lodash.head(result.frames)));
}
