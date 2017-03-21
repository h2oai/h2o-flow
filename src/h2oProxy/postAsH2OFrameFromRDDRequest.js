import { doPost } from './doPost';

export function postAsH2OFrameFromRDDRequest(_, rddId, name, go) {
  if (name === void 0) {
    return doPost(_, `/3/RDDs/${rddId}/h2oframe`, {}, go);
  }
  return doPost(_, `/3/RDDs/${rddId}/h2oframe`, { h2oframe_id: name }, go);
}
