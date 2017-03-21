import { format6fi } from './format6fi';

export function parseAndFormatArray(source) {
  const lodash = window._;
  let element;
  let i;
  let _i;
  let _len;
  const target = new Array(source.length);
  for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
    element = source[i];
    target[i] = element != null ? lodash.isNumber(element) ? format6fi(element) : element : void 0;
  }
  return target;
}
