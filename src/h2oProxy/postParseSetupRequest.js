import { encodeArrayForPost } from './encodeArrayForPost';
import { doPost } from './doPost';

export function postParseSetupRequest(_, sourceKeys, go) {
  const opts = { source_frames: encodeArrayForPost(sourceKeys) };
  return doPost(_, '/3/ParseSetup', opts, go);
}
