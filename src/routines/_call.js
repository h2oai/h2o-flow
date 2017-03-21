export function _call() {
  const Flow = window.Flow;
  const __slice = [].slice;
  const go = arguments[0];
  const args = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
  return Flow.Async.join(args, Flow.Async.applicate(go));
}
