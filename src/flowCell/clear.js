export default function clear(
  _result,
  _outputs,
  _errors,
  _hasError,
  _isCode,
  _hasInput
) {
  // console.log('arguments from flowCell clear', arguments);
  _result(null);
  _outputs([]);
  // Only for headless use
  _errors.length = 0;
  _hasError(false);
  if (!_isCode()) {
    return _hasInput(true);
  }
}
