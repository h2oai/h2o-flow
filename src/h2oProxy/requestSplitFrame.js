import { encodeArrayForPost } from './encodeArrayForPost';
import { doPost } from './doPost';

export function requestSplitFrame(_, frameKey, splitRatios, splitKeys, go) {
  const opts = {
    dataset: frameKey,
    ratios: encodeArrayForPost(splitRatios),
    dest_keys: encodeArrayForPost(splitKeys),
  };
  return doPost(_, '/3/SplitFrame', opts, go);
}
