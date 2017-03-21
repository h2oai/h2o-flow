import { doPost } from './doPost';

export function postCreateFrameRequest(_, opts, go) {
  return doPost(_, '/3/CreateFrame', opts, go);
}
