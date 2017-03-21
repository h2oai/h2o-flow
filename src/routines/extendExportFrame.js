import { render_ } from './render_';

import { h2oExportFrameOutput } from '../h2oExportFrameOutput';

// not used anywhere?
export function extendExportFrame(_, result) {
  return render_(_, result, h2oExportFrameOutput, result);
}
