import { getFrameSummarySliceRequest } from '../h2oProxy/getFrameSummarySliceRequest';
import { extendFrameSummary } from './extendFrameSummary';

export function requestFrameSummarySlice(_, frameKey, searchTerm, offset, length, go) {
  return getFrameSummarySliceRequest(_, frameKey, searchTerm, offset, length, (error, frame) => {
    if (error) {
      return go(error);
    }
    return go(null, extendFrameSummary(_, frameKey, frame));
  });
}
