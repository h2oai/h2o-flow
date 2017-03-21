import { doPost } from './doPost';

export function postAsDataFrameRequest(_, hfId, name, go) {
  if (name === void 0) {
    return doPost(_, `/3/h2oframes/${hfId}/dataframe`, {}, go);
  }
  return doPost(_, `/3/h2oframes/${hfId}/dataframe`, { dataframe_id: name }, go);
}
