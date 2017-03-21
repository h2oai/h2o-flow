export default function errorFunction(
  _,
  _hasError,
  _outputs,
  _errors,
  error
) {
  const Flow = window.Flow;
  _hasError(true);
  if (error.name === 'FlowError') {
    // XXX review
    _outputs.push(Flow.failure(_, error));
  } else {
    _outputs.push({
      text: JSON.stringify(error, null, 2),
      template: 'flow-raw',
    });
  }
  // Only for headless use
  return _errors.push(error);
}
