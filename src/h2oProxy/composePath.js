import { mapWithKey } from './mapWithKey';

export function composePath(path, opts) {
  let params;
  if (opts) {
    params = mapWithKey(opts, (v, k) => `${k}=${v}`);
    return `${path}?${params.join('&')}`;
  }
  return path;
}
