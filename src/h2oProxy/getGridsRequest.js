import { doGet } from './doGet';

export function getGridsRequest(_, go, opts) {
  return doGet(_, '/99/Grids', (error, result) => {
    if (error) {
      return go(error, result);
    }
    return go(error, result.grids);
  });
}
