import { doGet } from './doGet';

export function getLogFileRequest(_, nodeIndex, fileType, go) {
  return doGet(_, `/3/Logs/nodes/${nodeIndex}/files/${fileType}`, go);
}
