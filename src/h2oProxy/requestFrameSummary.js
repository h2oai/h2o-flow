import { doGet } from './doGet';
import { unwrap } from './unwrap';

export function requestFrameSummary(_, key, go) {
  const lodash = window._;
  doGet(_, `/3/Frames/${encodeURIComponent(key)}/summary`, unwrap(go, result => lodash.head(result.frames)));
}
