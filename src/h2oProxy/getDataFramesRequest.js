import { doGet } from './doGet';

export function getDataFramesRequest(_, go) {
  return doGet(_, '/3/dataframes', go);
}
