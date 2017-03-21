import { doGet } from './doGet';
import { composePath } from './composePath';

export function getGridRequest(_, key, opts, go) {
  let params;
  params = void 0;
  if (opts) {
    params = {};
    if (opts.sort_by) {
      params.sort_by = encodeURIComponent(opts.sort_by);
    }
    if (opts.decreasing === true || opts.decreasing === false) {
      params.decreasing = opts.decreasing;
    }
  }
  return doGet(_, composePath(`/99/Grids/${encodeURIComponent(key)}`, params), go);
}
