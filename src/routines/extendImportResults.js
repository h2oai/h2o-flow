import { render_ } from './render_';

import { h2oImportFilesOutput } from '../h2oImportFilesOutput';

export function extendImportResults(_, importResults) {
  return render_(_, importResults, h2oImportFilesOutput, importResults);
}
