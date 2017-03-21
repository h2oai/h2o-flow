import { download } from './download';

export function requestFlow(packName, flowName, go) {
  return download('json', `/flow/packs/${encodeURIComponent(packName)}/${encodeURIComponent(flowName)}`, go);
}
