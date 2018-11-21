{ defer, map } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _models) ->
  _modelViews = signal []
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

  createModelView = (model) ->
    _isChecked = signal no

    react _isChecked, ->
      return if _isCheckingAll
      checkedViews = (view for view in _modelViews() when view.isChecked())
      _checkedModelCount checkedViews.length

    predict = ->
      _.insertAndExecuteCell 'cs', "predict model: #{stringify model.model_id.name}"

    cloneModel = ->
      return alert 'Not implemented'
      _.insertAndExecuteCell 'cs', "cloneModel #{stringify model.model_id.name}"

    view = ->
      _.insertAndExecuteCell 'cs', "getModel #{stringify model.model_id.name}"

    inspect = ->
      _.insertAndExecuteCell 'cs', "inspect getModel #{stringify model.model_id.name}"

    key: model.model_id.name
    algo: model.algo_full_name
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


  inspectAll = ->
    allKeys = (view.key for view in _modelViews())
    #TODO use table origin
    _.insertAndExecuteCell 'cs', "inspect getModels #{stringify allKeys}"

  initialize = (models) ->
    _modelViews map models, createModelView
    defer _go

  initialize _models

  modelViews: _modelViews
  hasModels: _models.length > 0
  buildModel: buildModel
  compareModels: compareModels
  predictUsingModels: predictUsingModels
  deleteModels: deleteModels
  checkedModelCount: _checkedModelCount
  canCompareModels: _canCompareModels
  hasSelectedModels: _hasSelectedModels
  checkAllModels: _checkAllModels
  inspect: inspectAll
  template: 'flow-models-output'

