H2O.DataFramesOutput = (_, _go, _dataFrames) ->
  _dataFramesViews = signal []

  createDataFrameView = (dataFrame) ->
    dataframe_id: dataFrame.dataframe_id
    partitions: dataFrame.partitions

  _dataFramesViews map _dataFrames, createDataFrameView

  defer _go

  dataFrameViews: _dataFramesViews
  hasDataFrames: _dataFrames.length > 0
  template: 'flow-dataframes-output'


