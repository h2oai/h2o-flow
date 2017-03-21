import { requestWithOpts } from './requestWithOpts';

export function requestInspect(_, key, go) {
  const opts = { key: encodeURIComponent(key) };
  return requestWithOpts(_, '/3/Inspect', opts, go);
}
