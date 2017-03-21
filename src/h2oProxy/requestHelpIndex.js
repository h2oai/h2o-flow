import { download } from './download';

export function requestHelpIndex(go) {
  return download('json', '/flow/help/catalog.json', go);
}
