import { http } from './http';

export function doPost(_, path, opts, go) {
  return http(_, 'POST', path, opts, go);
}
