import { getFrameSummarySliceRequest } from '../h2oProxy/getFrameSummarySliceRequest';
import { extendFrameSummary } from './extendFrameSummary';

export function requestFrameSummary(_, frameKey, go) {
  return getFrameSummarySliceRequest(_, frameKey, void 0, 0, 20, (error, frame) => {
    if (error) {
      return go(error);
    }
    return go(null, extendFrameSummary(_, frameKey, frame));
  });
}
