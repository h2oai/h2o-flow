import { doPost } from './doPost';

export function postEchoRequest(_, message, go) {
  return doPost(_, '/3/LogAndEcho', { message }, go);
}
