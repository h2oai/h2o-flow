import { _fork } from './_fork';
import { requestGrids } from './requestGrids';

export function getGrids(_) {
  return _fork(requestGrids, _);
}
