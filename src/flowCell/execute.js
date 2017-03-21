/* eslint no-unused-vars: "error"*/

import { formatClockTime } from '../utils/formatClockTime';
import dataFunction from './dataFunction';
import closeFunction from './closeFunction';
import errorFunction from './errorFunction';
import endFunction from './endFunction';

export default function execute(
  _,
  _time,
  input,
  _input,
  _render,
  _isBusy,
  clear,
  _type,
  _outputs,
  _result,
  _hasError,
  _errors,
  _hasInput,
  _isActive,
  _isCode,
  go
) {
  const startTime = Date.now();
  _time(`Started at ${formatClockTime(startTime)}`);
  input = _input().trim();
  if (!input) {
    if (go) {
      return go(null);
    }
    return void 0;
  }
  const render = _render();
  _isBusy(true);
  clear();
  if (_type() === 'sca') {
    // escape backslashes
    input = input.replace(/\\/g, '\\\\');
    // escape quotes
    input = input.replace(/'/g, '\\\'');
    // escape new-lines
    input = input.replace(/\n/g, '\\n');
    // pass the cell body as an argument, representing the scala code, to the appropriate function
    input = `runScalaCode ${_.scalaIntpId()}, \'${input}\'`;
  }
  const outputObject = {
    data: dataFunction.bind(this, _outputs),
    close: closeFunction.bind(this, _result),
    error: errorFunction.bind(
      this,
      _,
      _hasError,
      _outputs,
      _errors
    ),
    end: endFunction.bind(
      this,
      _hasInput,
      _isCode,
      _isBusy,
      _time,
      _hasError,
      _errors,
      startTime,
      go
    ),
  };
  render(input, outputObject);
  return _isActive(false);
}
