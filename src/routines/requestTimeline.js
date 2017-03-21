import { getTimelineRequest } from '../h2oProxy/getTimelineRequest';
import { extendTimeline } from './extendTimeline';

export function requestTimeline(_, go) {
  return getTimelineRequest(_, (error, timeline) => {
    if (error) {
      return go(error);
    }
    return go(null, extendTimeline(_, timeline));
  });
}
