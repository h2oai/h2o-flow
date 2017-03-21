import { _fork } from './_fork';
import { requestTimeline } from './requestTimeline';

export function getTimeline(_) {
  return _fork(requestTimeline, _);
}
