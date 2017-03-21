import { _link } from './_link';
import { _apply } from './_apply';

export function _merge(...args) {
  const lodash = window._;
  const __slice = [].slice;
  let _i;
  const sources = args.length >= 3 ? __slice.call(args, 0, _i = args.length - 2) : (_i = 0, []);
  const target = args[_i++];
  const func = args[_i++];
  const evaluate = () => _apply(sources, func);
  target(evaluate());
  return lodash.map(sources, source => _link(source, () => target(evaluate())));
}
