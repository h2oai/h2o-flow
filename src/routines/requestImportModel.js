import { extendImportModel } from './extendImportModel';
import { postImportModelRequest } from '../h2oProxy/postImportModelRequest';

export function requestImportModel(_, path, opts, go) {
  return postImportModelRequest(_, path, opts.overwrite, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendImportModel(_, result));
  });
}
