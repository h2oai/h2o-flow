import { render_ } from './render_';

import { h2oProfileOutput } from '../h2oProfileOutput';

export function extendProfile(_, profile) {
  return render_(_, profile, h2oProfileOutput, profile);
}
