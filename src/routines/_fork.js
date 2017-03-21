export function _fork() {
  const Flow = window.Flow;
  const f = arguments[0];
  const __slice = [].slice;
  const args = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
  return Flow.Async.fork(f, args);
}
