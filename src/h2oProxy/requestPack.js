import { download } from './download';
import { unwrap } from './unwrap';
import { getLines } from './getLines';

export function requestPack(packName, go) {
  return download('text', `/flow/packs/${encodeURIComponent(packName)}/index.list`, unwrap(go, getLines));
}
