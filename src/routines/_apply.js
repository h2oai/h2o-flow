export function _apply(go, args) {
  const Flow = window.Flow;
  return Flow.Async.join(args, go);
}
