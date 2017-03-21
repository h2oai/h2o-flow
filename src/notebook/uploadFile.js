import { flowFileUploadDialog } from '../flowFileUploadDialog';
import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function uploadFile(_) {
  return _.dialog(flowFileUploadDialog, result => {
    let error;
    let _ref;
    if (result) {
      error = result.error;
      if (error) {
        _ref = error.message;
        return _.growl((_ref) != null ? _ref : error);
      }
      _.growl('File uploaded successfully!');
      return _.insertAndExecuteCell('cs', `setupParse source_frames: [ ${flowPrelude.stringify(result.result.destination_frame)}]`);
    }
  });
}
