import { flow_ } from './flow_';

export function render_() {
  const Flow = window.Flow;
  const __slice = [].slice;
  const _ = arguments[0];
  const raw = arguments[1];
  const render = arguments[2];
  const args = arguments.length >= 4 ? __slice.call(arguments, 3) : [];
  // Prepend current context (_) and a continuation (go)
  flow_(raw).render = go => render(
    ...[
      _,
      go,
    ].concat(args)
  );
  return raw;
}
