export function flow_(raw) {
  if (!raw._flow_) {
    raw._flow_ = { _cache_: {} };
  }
  return raw._flow_;
}
