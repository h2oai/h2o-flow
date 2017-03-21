export function ls(obj) {
  const lodash = window._;
  const Flow = window.Flow;
  const _isFuture = Flow.Async.isFuture;
  const _async = Flow.Async.async;
  let inspectors;
  let _ref1;
  if (_isFuture(obj)) {
    return _async(ls, obj);
  }
  // if we refactor this for the rule no-cond-assign
  // then the model output breaks
  // TODO find a way to refactor that does not break model output
  if (inspectors = obj != null ? (_ref1 = obj._flow_) != null ? _ref1.inspect : void 0 : void 0) { // eslint-disable-line
    return lodash.keys(inspectors);
  }
  return [];
}
