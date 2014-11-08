H2O.ModelsOutput = (_, _models) ->
  _modelViews = signal []
  _checkAllModels = signal no
  _canCompareModels = signal no

  _isCheckingAll = no
  react _checkAllModels, (checkAll) ->
    _isCheckingAll = yes
    for view in _modelViews()
      view.isChecked checkAll
    _isCheckingAll = no
    return

  createModelView = (model) ->
    _isChecked = signal no

    react _isChecked, ->
      return if _isCheckingAll
      checkedViews = (view for view in _modelViews() when view.isChecked())
      _canCompareModels checkedViews.length > 1

    predict = ->
      _.insertAndExecuteCell 'cs', "predict #{stringify model.key}"

    clone = ->
      return alert 'Not implemented'
      _.insertAndExecuteCell 'cs', "cloneModel #{stringify model.key}"

    view = ->
      _.insertAndExecuteCell 'cs', "getModel #{stringify model.key}"

    inspect = ->
      _.insertAndExecuteCell 'cs', "inspect getModel #{stringify model.key}"


    key: model.key
    isChecked: _isChecked
    predict: predict
    clone: clone
    inspect: inspect
    view: view

  buildModel = ->
    _.insertAndExecuteCell 'cs', 'buildModel'

  compareModels = ->
    keys = (view.key for view in _modelViews() when view.isChecked())
    _.insertAndExecuteCell 'cs', "inspect getModels #{stringify keys}"

  initialize = (models) ->
    _modelViews map models, createModelView

  initialize _models

  modelViews: _modelViews
  hasModels: _models.length > 0
  buildModel: buildModel
  compareModels: compareModels
  canCompareModels: _canCompareModels
  checkAllModels: _checkAllModels
  template: 'flow-models-output'

