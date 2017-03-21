import { doPost } from './doPost';

export function postAsH2OFrameFromDFRequest(_, dfId, name, go) {
  if (name === void 0) {
    return doPost(_, `/3/dataframes/${dfId}/h2oframe`, {}, go);
  }
  return doPost(_, `/3/dataframes/${dfId}/h2oframe`, { h2oframe_id: name }, go);
}
