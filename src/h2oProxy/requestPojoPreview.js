import { download } from './download';

export function requestPojoPreview(key, go) {
  return download('text', `/3/Models.java/${encodeURIComponent(key)}/preview`, go);
}
