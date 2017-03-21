import { getCloudRequest } from '../h2oProxy/getCloudRequest';
import { getLogFileRequest } from '../h2oProxy/getLogFileRequest';
import { extendLogFile } from './extendLogFile';

export function requestLogFile(_, nodeIndex, fileType, go) {
  return getCloudRequest(_, (error, cloud) => {
    let NODE_INDEX_SELF;
    if (error) {
      return go(error);
    }
    if (nodeIndex < 0 || nodeIndex >= cloud.nodes.length) {
      NODE_INDEX_SELF = -1;
      nodeIndex = NODE_INDEX_SELF;
    }
    return getLogFileRequest(_, nodeIndex, fileType, (error, logFile) => {
      if (error) {
        return go(error);
      }
      return go(null, extendLogFile(_, cloud, nodeIndex, fileType, logFile));
    });
  });
}
