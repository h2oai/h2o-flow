{ defer, map } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _grid) ->
  _modelViews = signal []
  _hasModels = _grid.model_ids.length > 0
  _errorViews = signal []
  _hasErrors = _grid.failure_details.length > 0
  _checkAllModels = signal no
  _checkedModelCount = signal 0
  _canCompareModels = lift _checkedModelCount, (count) -> count > 1
  _hasSelectedModels = lift _checkedModelCount, (count) -> count > 0


  _isCheckingAll = no
  react _checkAllModels, (checkAll) ->
    _isCheckingAll = yes
    views = _modelViews()
    for view in views
      view.isChecked checkAll
    _checkedModelCount if checkAll then views.length else 0
    _isCheckingAll = no
    return

  createModelView = (model_id) ->
    _isChecked = signal no

    react _isChecked, ->
      return if _isCheckingAll
      checkedViews = (view for view in _modelViews() when view.isChecked())
      _checkedModelCount checkedViews.length

    predict = ->
      _.insertAndExecuteCell 'cs', "predict model: #{stringify model_id.name}"

    cloneModel = ->
      return alert 'Not implemented'
      _.insertAndExecuteCell 'cs', "cloneModel #{stringify model_id.name}"

    view = ->
      _.insertAndExecuteCell 'cs', "getModel #{stringify model_id.name}"

    inspect = ->
      _.insertAndExecuteCell 'cs', "inspect getModel #{stringify model_id.name}"

    key: model_id.name
    isChecked: _isChecked
    predict: predict
    clone: cloneModel
    inspect: inspect
    view: view

  buildModel = ->
    _.insertAndExecuteCell 'cs', 'buildModel'

  collectSelectedKeys = ->
    for view in _modelViews() when view.isChecked()
      view.key 

  compareModels = ->
    _.insertAndExecuteCell 'cs', "inspect getModels #{stringify collectSelectedKeys()}"

  predictUsingModels = ->
    _.insertAndExecuteCell 'cs', "predict models: #{stringify collectSelectedKeys()}"

  deleteModels = ->
    _.confirm 'Are you sure you want to delete these models?', { acceptCaption: 'Delete Models', declineCaption: 'Cancel' }, (accept) ->
      if accept
        _.insertAndExecuteCell 'cs', "deleteModels #{stringify collectSelectedKeys()}"

  inspect = ->
    summary = _.inspect 'summary', _grid
    _.insertAndExecuteCell 'cs', "grid inspect 'summary', #{summary.metadata.origin}"

  inspectHistory = ->
    history = _.inspect 'scoring_history', _grid
    _.insertAndExecuteCell 'cs', "grid inspect 'scoring_history', #{history.metadata.origin}"

  inspectAll = ->
    allKeys = (view.key for view in _modelViews())
    #TODO use table origin
    _.insertAndExecuteCell 'cs', "inspect getModels #{stringify allKeys}"

  initialize = (grid) ->
    _modelViews map grid.model_ids, createModelView
    errorViews = for i in [0 ... grid.failure_details.length]
      title: "Error #{i + 1}"
      detail: grid.failure_details[i]
      params: "Parameters: [ #{ grid.failed_raw_params[i].join ', ' } ]"
      stacktrace: grid.failure_stack_traces[i]
    _errorViews errorViews
    defer _go

  initialize _grid

  modelViews: _modelViews
  hasModels: _hasModels
  errorViews: _errorViews
  hasErrors: _hasErrors
  buildModel: buildModel
  compareModels: compareModels
  predictUsingModels: predictUsingModels
  deleteModels: deleteModels
  checkedModelCount: _checkedModelCount
  canCompareModels: _canCompareModels
  hasSelectedModels: _hasSelectedModels
  checkAllModels: _checkAllModels
  inspect: inspect
  inspectHistory: inspectHistory
  inspectAll: inspectAll
  template: 'flow-grid-output'


