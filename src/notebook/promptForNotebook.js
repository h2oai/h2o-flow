import { flowFileOpenDialog } from '../flowFileOpenDialog';
import { loadNotebook } from './loadNotebook';

export function promptForNotebook(_) {
  return _.dialog(flowFileOpenDialog, result => {
    let error;
    let filename;
    let _ref;
    if (result) {
      error = result.error;
      filename = result.filename;
      if (error) {
        _ref = error.message;
        return _.growl(_ref != null ? _ref : error);
      }
      loadNotebook(_, filename);
      return _.loaded();
    }
  });
}
