import { splitTime } from './splitTime';
import { format1d0 } from './format1d0';

export function formatElapsedTime(s) {
  const _ref = splitTime(s);
  const hrs = _ref[0];
  const mins = _ref[1];
  const secs = _ref[2];
  const ms = _ref[3];
  if (hrs !== 0) {
    return `${format1d0((hrs * 60 + mins) / 60)}h`;
  } else if (mins !== 0) {
    return `${format1d0((mins * 60 + secs) / 60)}m`;
  } else if (secs !== 0) {
    return `${format1d0((secs * 1000 + ms) / 1000)}s`;
  }
  return `${ms}ms`;
}
