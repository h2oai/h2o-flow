{ signal } = require("../../core/modules/dataflow")
{ defer } = require('lodash')

module.exports = (_, _go, _result) ->
  _dataFrameView = signal null

  createDataFrameView = (result) ->
    dataframe_id: result.dataframe_id

  _dataFrameView (createDataFrameView _result)

  defer _go

  dataFrameView: _dataFrameView
  template: 'flow-dataframe-output'

