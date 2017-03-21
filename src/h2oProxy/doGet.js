import { http } from './http';

export function doGet(_, path, go) {
  return http(_, 'GET', path, null, go);
}
