import { doUpload } from './doUpload';

export function postUploadFileRequest(_, key, formData, go) {
  return doUpload(_, `/3/PostFile?destination_frame=${encodeURIComponent(key)}`, formData, go);
}

