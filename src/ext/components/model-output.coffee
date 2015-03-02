H2O.ModelOutput = (_, _go, _model) ->
  _isExpanded = signal no
  _plots = signals []

  #TODO use _.enumerate()
  _inputParameters = map _model.parameters, (parameter) ->
    { type, default_value, actual_value, label, help } = parameter

    value = switch type
      when 'Key<Frame>', 'Key<Model>'
        if actual_value then actual_value.name else null
      when 'VecSpecifier'
        if actual_value then actual_value.column_name else null
      when 'string[]'
        if actual_value then join actual_value, ', ' else null
      else
        actual_value

    label: label
    value: value
    help: help
    isModified: default_value is actual_value

  renderPlot = (title, render) ->
    container = signal null

    render (error, vis) ->
      if error
        debug error
      else
        container vis.element

    _plots.push title: title, plot: container

  switch _model.algo
    when 'glm'
      if table = _.inspect 'output', _model
        renderPlot 'Output', _.plot (g) ->
          g(
            g.table()
            g.from table
          )

      if table = _.inspect 'Normalized Coefficient Magnitudes', _model
        renderPlot 'Normalized Coefficient Magnitudes', _.plot (g) ->
          g(
            g.rect(
              g.position 'Scaled', 'Variable'
            )
            g.from table
            g.limit 25
          )

    when 'deeplearning'
      if table = _.inspect 'Status of Neuron Layers', _model
        renderPlot 'Status of Neuron Layers', _.plot (g) ->
          g(
            g.table()
            g.from table
          )

      if table = _.inspect 'Training Metrics', _model
        renderPlot 'Training Metrics', _.plot (g) ->
          g(
            g.table()
            g.from table
          )

      if table = _.inspect 'Training Confusion Matrix', _model
        renderPlot 'Training Confusion Matrix', _.plot (g) ->
          g(
            g.table()
            g.from table
          )

      if table = _.inspect 'Validation Metrics', _model
        renderPlot 'Validation Metrics', _.plot (g) ->
          g(
            g.table()
            g.from table
          )

      if table = _.inspect 'Validation Confusion Matrix', _model
        renderPlot 'Validation Confusion Matrix', _.plot (g) ->
          g(
            g.table()
            g.from table
          )

      if table = _.inspect 'Variable Importances', _model
        renderPlot 'Variable Importances', _.plot (g) ->
          g(
            g.rect(
              g.position 'Scaled Importance', 'Variable'
            )
            g.from table
            g.limit 25
          )

      if table = _.inspect 'Scoring History', _model
        renderPlot 'Scoring History', _.plot (g) ->
          g(
            g.table()
            g.from table
          )

    when 'gbm'
      if table = _.inspect 'output', _model
        renderPlot 'Output', _.plot (g) ->
          g(
            g.path(
              g.position 'tree', 'mse_train'
              g.strokeColor g.value '#1f77b4'
            )
            g.path(
              g.position 'tree', 'mse_valid'
              g.strokeColor g.value '#ff7f0e'
            )
            g.from table
          )

      if table = _.inspect 'Variable Importances', _model
        renderPlot 'Variable Importances', _.plot (g) ->
          g(
            g.rect(
              g.position 'Scaled Importance', 'Variable'
            )
            g.from table
            g.limit 25
          )

  toggle = ->
    _isExpanded not _isExpanded()

  cloneModel = ->
    # _.insertAndExecuteCell 'cs', 'assist buildModel, 
    alert 'Not implemented'

  predict = ->
    _.insertAndExecuteCell 'cs', "predict model: #{stringify _model.key.name}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getModel #{stringify _model.key.name}"

  deleteModel = ->
    _.confirm 'Are you sure you want to delete this model?', { acceptCaption: 'Delete Model', declineCaption: 'Cancel' }, (accept) ->
      if accept
        _.insertAndExecuteCell 'cs', "deleteModel #{stringify _model.key.name}"

  defer _go

  key: _model.key
  algo: _model.algo
  plots: _plots
  inputParameters: _inputParameters
  isExpanded: _isExpanded
  toggle: toggle
  cloneModel: cloneModel
  predict: predict
  inspect: inspect
  deleteModel: deleteModel
  template: 'flow-model-output'

