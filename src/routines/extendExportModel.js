import { render_ } from './render_';

import { h2oExportModelOutput } from '../h2oExportModelOutput';

export function extendExportModel(_, result) {
  return render_(_, result, h2oExportModelOutput, result);
}
