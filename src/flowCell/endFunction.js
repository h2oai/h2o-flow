import { formatElapsedTime } from '../utils/formatElapsedTime';

export default function endFunction(
  _hasInput,
  _isCode,
  _isBusy,
  _time,
  _hasError,
  _errors,
  startTime,
  go
) {
  _hasInput(_isCode());
  _isBusy(false);
  _time(formatElapsedTime(Date.now() - startTime));
  if (go) {
    go(_hasError() ? _errors.slice(0) : null);
  }
}
