export function _join() {
  const Flow = window.Flow;
  const __slice = [].slice;
  let _i;
  const args = arguments.length >= 2 ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []);
  const go = arguments[_i++];
  return Flow.Async.join(args, Flow.Async.applicate(go));
}
