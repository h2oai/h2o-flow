import { doGet } from './doGet';
import { unwrap } from './unwrap';

export function requestFrameSlice(_, key, searchTerm, offset, count, go) {
  const lodash = window._;
  // TODO send search term
  return doGet(_, `/3/Frames/${encodeURIComponent(key)}?column_offset=${offset}&column_count=${count}`, unwrap(go, result => lodash.head(result.frames)));
}
