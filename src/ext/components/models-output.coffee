H2O.ModelsOutput = (_, _models) ->
  createModelView = (model) ->
    key: model.key
    clone: ->
      return alert 'Not implemented'
      _.insertAndExecuteCell 'cs', "cloneModel #{stringify model.key}"
    view: ->
      _.insertAndExecuteCell 'cs', "getModel #{stringify model.key}"

  buildModel = ->
    _.insertAndExecuteCell 'cs', 'buildModel'

  modelViews: map _models, createModelView
  hasModels: _models.length > 0
  buildModel: buildModel
  template: 'flow-models-output'

