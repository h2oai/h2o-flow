export function createControl(kind, parameter) {
  const Flow = window.Flow;
  const _hasError = Flow.Dataflow.signal(false);
  const _hasWarning = Flow.Dataflow.signal(false);
  const _hasInfo = Flow.Dataflow.signal(false);
  const _message = Flow.Dataflow.signal('');
  const _hasMessage = Flow.Dataflow.lift(_message, message => {
    if (message) {
      return true;
    }
    return false;
  });
  const _isVisible = Flow.Dataflow.signal(true);
  const _isGrided = Flow.Dataflow.signal(false);
  const _isNotGrided = Flow.Dataflow.lift(_isGrided, value => !value);
  return {
    kind,
    name: parameter.name,
    label: parameter.label,
    description: parameter.help,
    isRequired: parameter.required,
    hasError: _hasError,
    hasWarning: _hasWarning,
    hasInfo: _hasInfo,
    message: _message,
    hasMessage: _hasMessage,
    isVisible: _isVisible,
    isGridable: parameter.gridable,
    isGrided: _isGrided,
    isNotGrided: _isNotGrided,
  };
}
