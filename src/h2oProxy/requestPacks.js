import { download } from './download';
import { unwrap } from './unwrap';
import { getLines } from './getLines';

export function requestPacks(go) {
  return download('text', '/flow/packs/index.list', unwrap(go, getLines));
}
