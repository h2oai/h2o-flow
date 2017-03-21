import { render_ } from './render_';

import { h2oGridsOutput } from '../h2oGridsOutput';

export function extendGrids(_, grids) {
  return render_(_, grids, h2oGridsOutput, grids);
}
