import { extendExportModel } from './extendExportModel';
import { getExportModelRequest } from '../h2oProxy/getExportModelRequest';

export function requestExportModel(_, modelKey, path, opts, go) {
  return getExportModelRequest(_, modelKey, path, opts.overwrite, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendExportModel(_, result));
  });
}
