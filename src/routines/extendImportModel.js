import { render_ } from './render_';
import { h2oImportModelOutput } from '../h2oImportModelOutput';

export function extendImportModel(_, result) {
  const H2O = window.H2O;
  return render_(_, result, h2oImportModelOutput, result);
}
