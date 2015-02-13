H2O.ModelOutput = (_, _model) ->
  _isExpanded = signal no
  _output = signal null
  _glmVariableImportancePlot = signal null
  _dlScoringHistory = signal null
  _dlTrainingMetrics = signal null
  _dlVariableImportancePlot = signal null
  _gbmTrees = signal null
  _gbmVariableImportancePlot = signal null

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

  renderPlot = (target, render) ->
    render (error, vis) ->
      if error
        debug error
      else
        target vis.element

  if table = _.inspect 'output', _model
    renderPlot _output, _.enumerate table

  switch _model.algo
    when 'glm'
      if table = _.inspect 'Normalized Coefficient Magnitudes', _model
        renderPlot _glmVariableImportancePlot, _.plot (g) ->
          g(
            g.rect(
              g.position 'Magnitude', 'Column'
            )
            g.from table
            g.limit 25
          )
    when 'deeplearning'
      if table = _.inspect 'Scoring History', _model
        renderPlot _dlScoringHistory, _.plot (g) ->
          g(
            g.table()
            g.from table
          )

      if table = _.inspect 'Training Metrics', _model
        renderPlot _dlTrainingMetrics, _.plot (g) ->
          g(
            g.table()
            g.from table
          )

      if table = _.inspect 'Variable Importances', _model
        renderPlot _dlVariableImportancePlot, _.plot (g) ->
          g(
            g.rect(
              g.position 'Relative Importance', 'Variable'
            )
            g.from table
            g.limit 25
          )

    when 'gbm'
      if table = _.inspect 'output', _model
        renderPlot _gbmTrees, _.plot (g) ->
          g(
            g.table()
            g.from table
          )

      if table = _.inspect 'Variable Importances', _model
        renderPlot _gbmVariableImportancePlot, _.plot (g) ->
          g(
            g.rect(
              g.position 'Relative Importance', 'Variable'
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
    _.insertAndExecuteCell 'cs', "predict #{stringify _model.key.name}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getModel #{stringify _model.key.name}"

  key: _model.key
  algo: _model.algo
  inputParameters: _inputParameters
  output: _output
  dlScoringHistory: _dlScoringHistory
  dlTrainingMetrics: _dlTrainingMetrics
  dlVariableImportancePlot: _dlVariableImportancePlot
  glmVariableImportancePlot: _glmVariableImportancePlot
  gbmTrees: _gbmTrees
  gbmVariableImportancePlot: _gbmVariableImportancePlot
  isExpanded: _isExpanded
  toggle: toggle
  cloneModel: cloneModel
  predict: predict
  inspect: inspect
  template: 'flow-model-output'

