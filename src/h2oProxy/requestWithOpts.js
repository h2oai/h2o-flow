import { doGet } from './doGet';
import { composePath } from './composePath';

export function requestWithOpts(_, path, opts, go) {
  return doGet(_, composePath(path, opts), go);
}
