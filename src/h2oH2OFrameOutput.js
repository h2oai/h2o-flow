export function h2oH2OFrameOutput(_, _go, _result) {
  const lodash = window._;
  const Flow = window.Flow;
  const _h2oframeView = Flow.Dataflow.signal(null);
  const createH2oFrameView = result => ({
    h2oframe_id: result.h2oframe_id,
  });
  _h2oframeView(createH2oFrameView(_result));
  lodash.defer(_go);
  return {
    h2oframeView: _h2oframeView,
    template: 'flow-h2oframe-output',
  };
}

