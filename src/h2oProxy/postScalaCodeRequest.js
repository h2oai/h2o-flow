import { doPost } from './doPost';

export function postScalaCodeRequest(_, sessionId, code, go) {
  return doPost(_, `/3/scalaint/${sessionId}`, { code }, go);
}
