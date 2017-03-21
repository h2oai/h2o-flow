import { splitTime } from './splitTime';
import { padTime } from './padTime';

export function formatMilliseconds(s) {
  const _ref = splitTime(s);
  const hrs = _ref[0];
  const mins = _ref[1];
  const secs = _ref[2];
  const ms = _ref[3];
  return `${padTime(hrs)}:${padTime(mins)}:${padTime(secs)}.${ms}`;
}
