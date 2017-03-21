import { flow_ } from './flow_';

export function inspect_(raw, inspectors) {
  let attr;
  const root = flow_(raw);
  if (root.inspect == null) {
    root.inspect = {};
  }
  for (attr in inspectors) {
    if ({}.hasOwnProperty.call(inspectors, attr)) {
      const f = inspectors[attr];
      root.inspect[attr] = f;
    }
  }
  return raw;
}
