H2O.ModelOutput = (_, _go, _model) ->
  _isExpanded = signal no
  _plots = signals []
  _pojoPreview = signal null
  _isPojoLoaded = lift _pojoPreview, (preview) -> if preview then yes else no

  #TODO use _.enumerate()
  _inputParameters = map _model.parameters, (parameter) ->
    { type, default_value, actual_value, label, help } = parameter

    value = switch type
      when 'Key<Frame>', 'Key<Model>'
        if actual_value then actual_value.name else null
      when 'VecSpecifier'
        if actual_value then actual_value.column_name else null
      when 'string[]', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
        if actual_value then join actual_value, ', ' else null
      else
        actual_value

    label: label
    value: value
    help: help
    isModified: default_value is actual_value

  renderPlot = (title, isCollapsed, render) ->
    container = signal null
    linkedFrame = signal null

    render (error, vis) ->
      if error
        debug error
      else
        $('a', vis.element).on 'click', (e) ->
          $a = $ e.target
          switch $a.attr 'data-type'
            when 'frame'
              _.insertAndExecuteCell 'cs', "getFrameSummary #{stringify $a.attr 'data-key'}"
            when 'model'
              _.insertAndExecuteCell 'cs', "getModel #{stringify $a.attr 'data-key'}"
        container vis.element

        if vis.subscribe
          vis.subscribe 'markselect', ({frame, indices}) ->
            subframe = window.plot.createFrame frame.label, frame.vectors, indices

            renderTable = (g) ->
              g(
                if indices.length > 1 then g.select() else g.select head indices
                g.from subframe
              )
            (_.plot renderTable) (error, table) ->
              unless error
                linkedFrame table.element
            return

          vis.subscribe 'markdeselect', ->
            linkedFrame null

    _plots.push 
      title: title
      plot: container
      frame: linkedFrame
      isCollapsed: isCollapsed

  switch _model.algo
    when 'kmeans'
      if table = _.inspect 'output - Scoring History', _model
        renderPlot 'Scoring History', no, _.plot (g) ->
          g(
            g.path(
              g.position 'number_of_iterations', 'average_within_cluster_sum_of_squares'
              g.strokeColor g.value '#1f77b4'
            )
            g.point(
              g.position 'number_of_iterations', 'average_within_cluster_sum_of_squares'
              g.strokeColor g.value '#1f77b4'
            )
            g.from table
          )

    when 'glm'
      if table = _.inspect 'output - training_metrics - Metrics for Thresholds', _model
        renderPlot 'ROC Curve - Training Metrics', no, _.plot (g) ->
          g(
            g.path g.position 'fpr', 'tpr'
            g.line(
              g.position (g.value 1), (g.value 0)
              g.strokeColor g.value 'red'
            )
            g.from table
            g.domainX_HACK 0, 1
            g.domainY_HACK 0, 1
          )

      if table = _.inspect 'output - validation_metrics - Metrics for Thresholds', _model
        renderPlot 'ROC Curve - Validation Metrics', no, _.plot (g) ->
          g(
            g.path g.position 'fpr', 'tpr'
            g.line(
              g.position (g.value 1), (g.value 0)
              g.strokeColor g.value 'red'
            )
            g.from table
            g.domainX_HACK 0, 1
            g.domainY_HACK 0, 1
          )

      if table = _.inspect 'output - Standardized Coefficient Magnitudes', _model
        renderPlot 'Standardized Coefficient Magnitudes', no, _.plot (g) ->
          g(
            g.rect(
              g.position 'coefficients', 'names'
              g.fillColor 'sign'
            )
            g.from table
            g.limit 25
          )

      if table = _.inspect 'output - Scoring History', _model
        lambdaSearchParameter = find _model.parameters, (parameter) -> parameter.name is 'lambda_search'
      
        if lambdaSearchParameter?.actual_value
          renderPlot 'Scoring History', no, _.plot (g) ->
            g(
              g.path(
                g.position 'lambdaid', 'explained_deviance_train'
                g.strokeColor g.value '#1f77b4'
              )
              g.path(
                g.position 'lambdaid', 'explained_deviance_test'
                g.strokeColor g.value '#ff7f0e'
              )
              g.point(
                g.position 'lambdaid', 'explained_deviance_train'
                g.strokeColor g.value '#1f77b4'
              )
              g.point(
                g.position 'lambdaid', 'explained_deviance_test'
                g.strokeColor g.value '#ff7f0e'
              )
              g.from table
            )
        else
          renderPlot 'Scoring History', no, _.plot (g) ->
            g(
              g.path(
                g.position 'iteration', 'objective'
                g.strokeColor g.value '#1f77b4'
              )
              g.point(
                g.position 'iteration', 'objective'
                g.strokeColor g.value '#1f77b4'
              )
              g.from table
            )

    when 'deeplearning'
      if table = _.inspect 'output - training_metrics - Metrics for Thresholds', _model
        renderPlot 'ROC Curve - Training Metrics', no, _.plot (g) ->
          g(
            g.path g.position 'fpr', 'tpr'
            g.line(
              g.position (g.value 1), (g.value 0)
              g.strokeColor g.value 'red'
            )
            g.from table
            g.domainX_HACK 0, 1
            g.domainY_HACK 0, 1
          )

      if table = _.inspect 'output - validation_metrics - Metrics for Thresholds', _model
        renderPlot 'ROC Curve - Validation Metrics', no, _.plot (g) ->
          g(
            g.path g.position 'fpr', 'tpr'
            g.line(
              g.position (g.value 1), (g.value 0)
              g.strokeColor g.value 'red'
            )
            g.from table
            g.domainX_HACK 0, 1
            g.domainY_HACK 0, 1
          )

      if table = _.inspect 'output - Variable Importances', _model
        renderPlot 'Variable Importances', no, _.plot (g) ->
          g(
            g.rect(
              g.position 'scaled_importance', 'variable'
            )
            g.from table
            g.limit 25
          )

      if table = _.inspect 'output - Scoring History', _model
        if table.schema['validation_MSE']
          renderPlot 'Scoring History', no, _.plot (g) ->
            g(
              g.path(
                g.position 'epochs', 'training_MSE'
                g.strokeColor g.value '#1f77b4'
              )
              g.path(
                g.position 'epochs', 'validation_MSE'
                g.strokeColor g.value '#ff7f0e'
              )
              g.point(
                g.position 'epochs', 'training_MSE'
                g.strokeColor g.value '#1f77b4'
              )
              g.point(
                g.position 'epochs', 'validation_MSE'
                g.strokeColor g.value '#ff7f0e'
              )
              g.from table
            )
        else
          renderPlot 'Scoring History', no, _.plot (g) ->
            g(
              g.path(
                g.position 'epochs', 'training_MSE'
                g.strokeColor g.value '#1f77b4'
              )
              g.point(
                g.position 'epochs', 'training_MSE'
                g.strokeColor g.value '#1f77b4'
              )
              g.from table
            )

    when 'gbm', 'drf'
      if table = _.inspect 'output - Scoring History', _model
        if table.schema['validation_MSE']
          renderPlot 'Scoring History', no, _.plot (g) ->
            g(
              g.path(
                g.position 'number_of_trees', 'training_MSE'
                g.strokeColor g.value '#1f77b4'
              )
              g.path(
                g.position 'number_of_trees', 'validation_MSE'
                g.strokeColor g.value '#ff7f0e'
              )
              g.point(
                g.position 'number_of_trees', 'training_MSE'
                g.strokeColor g.value '#1f77b4'
              )
              g.point(
                g.position 'number_of_trees', 'validation_MSE'
                g.strokeColor g.value '#ff7f0e'
              )
              g.from table
            )
        else
          renderPlot 'Scoring History', no, _.plot (g) ->
            g(
              g.path(
                g.position 'number_of_trees', 'training_MSE'
                g.strokeColor g.value '#1f77b4'
              )
              g.point(
                g.position 'number_of_trees', 'training_MSE'
                g.strokeColor g.value '#1f77b4'
              )
              g.from table
            )
          
      if table = _.inspect 'output - training_metrics - Metrics for Thresholds', _model
        renderPlot 'ROC Curve - Training Metrics', no, _.plot (g) ->
          g(
            g.path g.position 'fpr', 'tpr'
            g.line(
              g.position (g.value 1), (g.value 0)
              g.strokeColor g.value 'red'
            )
            g.from table
            g.domainX_HACK 0, 1
            g.domainY_HACK 0, 1
          )

      if table = _.inspect 'output - validation_metrics - Metrics for Thresholds', _model
        renderPlot 'ROC Curve - Validation Metrics', no, _.plot (g) ->
          g(
            g.path g.position 'fpr', 'tpr'
            g.line(
              g.position (g.value 1), (g.value 0)
              g.strokeColor g.value 'red'
            )
            g.from table
            g.domainX_HACK 0, 1
            g.domainY_HACK 0, 1
          )

      if table = _.inspect 'output - Variable Importances', _model
        renderPlot 'Variable Importances', no, _.plot (g) ->
          g(
            g.rect(
              g.position 'scaled_importance', 'variable'
            )
            g.from table
            g.limit 25
          )

  for tableName in _.ls _model when tableName isnt 'parameters'
    if table = _.inspect tableName, _model
      renderPlot tableName + (if table.metadata.description then " (#{table.metadata.description})" else ''), yes, _.plot (g) ->
        g(
          if table.indices.length > 1 then g.select() else g.select 0
          g.from table
        )

  toggle = ->
    _isExpanded not _isExpanded()

  cloneModel = ->
    # _.insertAndExecuteCell 'cs', 'assist buildModel, 
    alert 'Not implemented'

  predict = ->
    _.insertAndExecuteCell 'cs', "predict model: #{stringify _model.model_id.name}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getModel #{stringify _model.model_id.name}"

  previewPojo = ->
    _.requestPojoPreview _model.model_id.name, (error, result) ->
      if error
        _pojoPreview "<pre>#{escape error}</pre>"
      else
        _pojoPreview "<pre>#{Flow.Util.highlight result, 'java'}</pre>"

  downloadPojo = ->
    window.open "/3/Models.java/#{encodeURIComponent _model.model_id.name}", '_blank'

  deleteModel = ->
    _.confirm 'Are you sure you want to delete this model?', { acceptCaption: 'Delete Model', declineCaption: 'Cancel' }, (accept) ->
      if accept
        _.insertAndExecuteCell 'cs', "deleteModel #{stringify _model.model_id.name}"

  defer _go

  key: _model.model_id
  algo: _model.algo_full_name
  plots: _plots
  inputParameters: _inputParameters
  isExpanded: _isExpanded
  toggle: toggle
  cloneModel: cloneModel
  predict: predict
  inspect: inspect
  previewPojo: previewPojo
  downloadPojo: downloadPojo
  pojoPreview: _pojoPreview
  isPojoLoaded: _isPojoLoaded
  deleteModel: deleteModel
  template: 'flow-model-output'

