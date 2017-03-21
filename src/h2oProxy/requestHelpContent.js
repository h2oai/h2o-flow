import { download } from './download';

export function requestHelpContent(name, go) {
  return download('text', `/flow/help/${name}.html`, go);
}
