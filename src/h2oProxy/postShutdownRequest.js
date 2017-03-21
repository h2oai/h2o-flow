import { doPost } from './doPost';

export function postShutdownRequest(_, go) {
  return doPost(_, '/3/Shutdown', {}, go);
}
