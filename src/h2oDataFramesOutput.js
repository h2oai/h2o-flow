export function h2oDataFramesOutput(_, _go, _dataFrames) {
  const lodash = window._;
  const Flow = window.Flow;
  const _dataFramesViews = Flow.Dataflow.signal([]);
  const createDataFrameView = dataFrame => ({
    dataframe_id: dataFrame.dataframe_id,
    partitions: dataFrame.partitions,
  });
  _dataFramesViews(lodash.map(_dataFrames, createDataFrameView));
  lodash.defer(_go);
  return {
    dataFrameViews: _dataFramesViews,
    hasDataFrames: _dataFrames.length > 0,
    template: 'flow-dataframes-output',
  };
}

