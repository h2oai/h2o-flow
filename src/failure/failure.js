export function failure() {
  const Flow = window.Flow;
  const traceCauses = (error, causes) => {
    causes.push(error.message);
    if (error.cause) {
      traceCauses(error.cause, causes);
    }
    return causes;
  };
  Flow.failure = (_, error) => {
    const causes = traceCauses(error, []);
    const message = causes.shift();
    const _isStackVisible = Flow.Dataflow.signal(false);
    const toggleStack = () => _isStackVisible(!_isStackVisible());
    _.trackException(`${message}; ${causes.join('; ')}`);
    return {
      message,
      stack: error.stack,
      causes,
      isStackVisible: _isStackVisible,
      toggleStack,
      template: 'flow-failure',
    };
  };
}
