H2O.ModelsOutput = (_, _go, _models) ->
  _modelViews = signal []
  _checkAllModels = signal no
  _canCompareModels = signal no

  _isCheckingAll = no
  react _checkAllModels, (checkAll) ->
    _isCheckingAll = yes
    for view in _modelViews()
      view.isChecked checkAll
    _canCompareModels checkAll
    _isCheckingAll = no
    return

  createModelView = (model) ->
    _isChecked = signal no

    react _isChecked, ->
      return if _isCheckingAll
      checkedViews = (view for view in _modelViews() when view.isChecked())
      _canCompareModels checkedViews.length > 1

    predict = ->
      _.insertAndExecuteCell 'cs', "predict model: #{stringify model.key.name}"

    cloneModel = ->
      return alert 'Not implemented'
      _.insertAndExecuteCell 'cs', "cloneModel #{stringify model.key.name}"

    view = ->
      _.insertAndExecuteCell 'cs', "getModel #{stringify model.key.name}"

    inspect = ->
      _.insertAndExecuteCell 'cs', "inspect getModel #{stringify model.key.name}"

    key: model.key.name
    algo: model.algo
    isChecked: _isChecked
    predict: predict
    clone: cloneModel
    inspect: inspect
    view: view

  buildModel = ->
    _.insertAndExecuteCell 'cs', 'buildModel'

  getSelectedModelKeys = ->
    (view.key for view in _modelViews() when view.isChecked())

  compareModels = ->
    _.insertAndExecuteCell 'cs', "inspect getModels #{stringify getSelectedModelKeys()}"

  predictUsingModels = ->
    _.insertAndExecuteCell 'cs', "predict models: #{stringify getSelectedModelKeys()}"

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
  canCompareModels: _canCompareModels
  checkAllModels: _checkAllModels
  inspect: inspectAll
  template: 'flow-models-output'

