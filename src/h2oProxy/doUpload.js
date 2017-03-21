import { http } from './http';

export function doUpload(_, path, formData, go) {
  return http(_, 'UPLOAD', path, formData, go);
}
