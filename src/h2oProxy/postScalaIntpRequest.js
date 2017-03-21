import { doPost } from './doPost';

export function postScalaIntpRequest(_, go) {
  return doPost(_, '/3/scalaint', {}, go);
}
