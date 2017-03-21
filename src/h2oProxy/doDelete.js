import { http } from './http';

export function doDelete(_, path, go) {
  return http(_, 'DELETE', path, null, go);
}
