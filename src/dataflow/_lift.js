import { createSignal } from './createSignal';
import { _link } from './_link';
import { _apply } from './_apply';

export function _lift(...args) {
  const lodash = window._;
  const __slice = [].slice;
  let _i;
  const sources = args.length >= 2 ? __slice.call(args, 0, _i = args.length - 1) : (_i = 0, []);
  const func = args[_i++];
  const evaluate = () => _apply(sources, func);
  const target = createSignal(evaluate());
  lodash.map(sources, source => _link(source, () => target(evaluate())));
  return target;
}
