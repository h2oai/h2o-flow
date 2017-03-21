import { render_ } from './render_';

export function proceed(_, func, args, go) {
  return go(null, render_(_, ...[
    {},
    func,
  ].concat(args || [])));
}
