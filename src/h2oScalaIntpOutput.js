export function h2oScalaIntpOutput(_, _go, _result) {
  console.log('_result from h2oScalaIntpOutput', _result);
  const lodash = window._;
  const Flow = window.Flow;
  const _scalaIntpView = Flow.Dataflow.signal(null);
  const createScalaIntpView = result => ({
    session_id: result.session_id,
  });
  _scalaIntpView(createScalaIntpView(_result));
  lodash.defer(_go);
  return {
    scalaIntpView: _scalaIntpView,
    template: 'flow-scala-intp-output',
  };
}

