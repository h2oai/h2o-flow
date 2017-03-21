import { http } from './http';

export function doPostJSON(_, path, opts, go) {
  return http(_, 'POSTJSON', path, opts, go);
}
