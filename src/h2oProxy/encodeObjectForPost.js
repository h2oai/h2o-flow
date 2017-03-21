import { encodeArrayForPost } from './encodeArrayForPost';

export function encodeObjectForPost(source) {
  const lodash = window._;
  let k;
  let v;
  const target = {};
  for (k in source) {
    if ({}.hasOwnProperty.call(source, k)) {
      v = source[k];
      target[k] = lodash.isArray(v) ? encodeArrayForPost(v) : v;
    }
  }
  return target;
}
