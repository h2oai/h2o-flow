import { doPost } from './doPost';

export function postExportFrameRequest(_, key, path, overwrite, go) {
  const params = {
    path,
    force: overwrite ? 'true' : 'false',
  };
  return doPost(_, `/3/Frames/${encodeURIComponent(key)}/export`, params, go);
}
