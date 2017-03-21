export function h2oDataFrameOutput(_, _go, _result) {
  const lodash = window._;
  const Flow = window.Flow;
  const _dataFrameView = Flow.Dataflow.signal(null);
  const createDataFrameView = result => ({
    dataframe_id: result.dataframe_id,
  });
  _dataFrameView(createDataFrameView(_result));
  lodash.defer(_go);
  return {
    dataFrameView: _dataFrameView,
    template: 'flow-dataframe-output',
  };
}

