import { doGet } from './doGet';

export function getExportModelRequest(_, key, path, overwrite, go) {
  return doGet(_, `/99/Models.bin/${encodeURIComponent(key)}?dir=${encodeURIComponent(path)}&force=${overwrite}`, go);
}
