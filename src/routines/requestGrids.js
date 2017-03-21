import { extendGrids } from './extendGrids';
import { getGridsRequest } from '../h2oProxy/getGridsRequest';

export function requestGrids(_, go) {
  return getGridsRequest(_, (error, grids) => {
    if (error) {
      return go(error);
    }
    return go(null, extendGrids(_, grids));
  });
}
