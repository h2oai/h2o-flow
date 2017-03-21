import { http } from './http';

export function doPut(_, path, opts, go) {
  return http(_, 'PUT', path, opts, go);
}
