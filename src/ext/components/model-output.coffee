H2O.ModelOutput = (_, _go, _model, refresh) ->
  _output = signal null

  createOutput = (_model) ->
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
        when 'StringPair[]'
          if actual_value
            pairs = actual_value.map (pair) -> pair.a + ':' + pair.b
            join pairs, ', '
          else
            null
        when 'string[]', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
          if actual_value then join actual_value, ', ' else null
        else
          actual_value

      label: label
      value: value
      help: help
      isModified: default_value is actual_value

    #TODO copied over from routines.coffee. replace post h2o.js integration.
    format4f = (number) ->
      if number
        if number is 'NaN'
          undefined
        else
          number.toFixed(4).replace(/\.0+$/, '.0')
      else
        number

    getAucAsLabel = (model, tableName) ->
      if metrics = _.inspect tableName, model
        " , AUC = #{metrics.schema.AUC.at 0}"
      else
        ''

    getThresholdsAndCriteria = (model, tableName) ->
      if criterionTable = _.inspect tableName, _model

        # Threshold dropdown items
        thresholdVector = table.schema.threshold
        thresholds = for i in [0 ... thresholdVector.count()]
          index: i
          value: thresholdVector.at i

        # Threshold criterion dropdown item
        metricVector = criterionTable.schema.metric
        idxVector = criterionTable.schema.idx
        criteria = for i in [0 ... metricVector.count()]
          index: idxVector.at i
          value: metricVector.valueAt i

        { thresholds, criteria }
      else
        undefined

    # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
    renderPlot = (title, isCollapsed, render, thresholdsAndCriteria) ->
      container = signal null
      linkedFrame = signal null

      if thresholdsAndCriteria # TODO HACK
        rocPanel =
          thresholds: signals thresholdsAndCriteria.thresholds
          threshold: signal null
          criteria: signals thresholdsAndCriteria.criteria
          criterion: signal null

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

          _autoHighlight = yes
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

              if rocPanel # TODO HACK
                if indices.length is 1
                  selectedIndex = head indices

                  _autoHighlight = no
                  rocPanel.threshold find rocPanel.thresholds(), (threshold) -> threshold.index is selectedIndex

                  currentCriterion = rocPanel.criterion()
                  # More than one criterion can point to the same threshold, so ensure that
                  #  we're preserving the existing criterion, if any.
                  if (not currentCriterion) or (currentCriterion and (currentCriterion.index isnt selectedIndex))
                    rocPanel.criterion find rocPanel.criteria(), (criterion) -> criterion.index is selectedIndex

                  _autoHighlight = yes
                else
                  rocPanel.criterion null
                  rocPanel.threshold null
              return

            vis.subscribe 'markdeselect', ->
              linkedFrame null

              if rocPanel # TODO HACK
                rocPanel.criterion null
                rocPanel.threshold null

            if rocPanel # TODO HACK
              react rocPanel.threshold, (threshold) ->
                if threshold and _autoHighlight
                  vis.highlight [ threshold.index ]

              react rocPanel.criterion, (criterion) ->
                if criterion and _autoHighlight
                  vis.highlight [ criterion.index ]

      _plots.push
        title: title
        plot: container
        frame: linkedFrame
        controls: signal rocPanel
        isCollapsed: isCollapsed

    calcRecall = (cm, index) ->
        tp = cm.data[index][index]
        result = tp / cm.data[index][cm.data[index].length - 2]
        return parseFloat(result).toFixed(2).replace(/\.0+$/, '.0')

    calcPrecision = (cm, index) ->
        tp = cm.data[index][index]
        fp = 0
        for column, i in cm.data # iterate over all columns
            if i > cm.data.length - 3 # do not count Error, Rate and Recall columns
                break
            if i != index # if not on diagonal
                fp += column[index] # pick value at index from each column; sum of row
        result = tp / (tp + fp)
        return parseFloat(result).toFixed(2).replace(/\.0+$/, '.0')

    renderMultinomialConfusionMatrix = (title, cm) ->
      cm.columns.push({'name':'Recall', 'type':'long', 'format': '%.2f', 'description': 'Recall'})
      recallValues = []
      for column, i in cm.data
          if i > cm.data.length - 3
              break
          column.push(calcPrecision(cm, i))
          recallValues.push(calcRecall(cm, i))
      cm.data.push(recallValues)
      cm.rowcount += 1

      [table, tbody, tr, normal, bold] = Flow.HTML.template 'table.flow-confusion-matrix', 'tbody', 'tr', 'td', 'td.strong'
      tooltip = (text) ->
          Flow.HTML.template "td tooltip='#{text}' testTop='500px'"
      tooltipYellowBg = (text) ->
          Flow.HTML.template "td.bg-yellow tooltip='#{text}'"
      tooltipBold = (text) ->
          Flow.HTML.template "td.strong tooltip='#{text}'"
      columnCount = cm.columns.length
      rowCount = cm.rowcount
      headers = map cm.columns, (column, i) -> bold column.description
      headers.unshift normal ' ' # NW corner cell
      rows = [tr headers]
      errorColumnIndex = columnCount - 3
      recallColumnIndex = columnCount - 1
      totalRowIndex = rowCount - 2
      precisionRowIndex = rowCount - 1
      for rowIndex in [0 ... rowCount]
        cells = for column, i in cm.data
          tooltipText = "Actual: #{cm.columns[rowIndex].description}&#013;&#010;Predicted: #{cm.columns[i].description}"
          cell = if i < errorColumnIndex
            if i is rowIndex
              tooltipYellowBg(tooltipText) # Yellow lines on diagonal
            else
              if rowIndex < totalRowIndex
                tooltip(tooltipText) # "Basic" cells inside cm
              else
                if rowIndex is totalRowIndex
                    tooltipBold("Total: #{cm.columns[i].description}") # Totals of features
                else
                    if rowIndex is precisionRowIndex
                        tooltipBold("Precision: #{cm.columns[i].description}") # Precision of features
                    else
                        bold
          else
            if (rowIndex < totalRowIndex)
                tooltipBold("#{cm.columns[i].description}: #{cm.columns[rowIndex].description}") # Error, Rate and Recall of features
            else
                if i < recallColumnIndex
                    tooltipBold("Total: #{cm.columns[i].description}") # Totals of Error and Rate
                else
                    bold
          # special-format error column
          cell if i is errorColumnIndex then format4f column[rowIndex] else column[rowIndex]
        # Add the corresponding column label
        cells.unshift bold if rowIndex is rowCount - 2 then 'Total' else if rowIndex is rowCount - 1 then 'Precision' else cm.columns[rowIndex].description
        rows.push tr cells

      _plots.push
        title: title + if cm.description then " #{cm.description}" else ''
        plot: signal Flow.HTML.render 'div', table tbody rows
        frame: signal null
        controls: signal null
        isCollapsed: no

    switch _model.algo
      when 'kmeans'
        if table = _.inspect 'output - Scoring History', _model
          renderPlot 'Scoring History', no, _.plot (g) ->
            g(
              g.path(
                g.position 'iterations', 'within_cluster_sum_of_squares'
                g.strokeColor g.value '#1f77b4'
              )
              g.point(
                g.position 'iterations', 'within_cluster_sum_of_squares'
                g.strokeColor g.value '#1f77b4'
              )
              g.from table
            )

      when 'glm'
        if table = _.inspect 'output - Scoring History', _model
          lambdaSearchParameter = find _model.parameters, (parameter) -> parameter.name is 'lambda_search'

          if lambdaSearchParameter?.actual_value
            renderPlot 'Scoring History', no, _.plot (g) ->
              g(
                g.path(
                  g.position 'lambda', 'explained_deviance_train'
                  g.strokeColor g.value '#1f77b4'
                )
                g.path(
                  g.position 'lambda', 'explained_deviance_test'
                  g.strokeColor g.value '#ff7f0e'
                )
                g.point(
                  g.position 'lambda', 'explained_deviance_train'
                  g.strokeColor g.value '#1f77b4'
                )
                g.point(
                  g.position 'lambda', 'explained_deviance_test'
                  g.strokeColor g.value '#ff7f0e'
                )
                g.from table
              )
          else
            renderPlot 'Scoring History', no, _.plot (g) ->
              g(
                g.path(
                  g.position 'iterations', 'objective'
                  g.strokeColor g.value '#1f77b4'
                )
                g.point(
                  g.position 'iterations', 'objective'
                  g.strokeColor g.value '#1f77b4'
                )
                g.from table
              )

        if table = _.inspect 'output - training_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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
          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Training Metrics#{getAucAsLabel _model, 'output - training_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - training_metrics - Maximum Metrics'

        if table = _.inspect 'output - validation_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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
          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Validation Metrics#{getAucAsLabel _model, 'output - validation_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - validation_metrics - Maximum Metrics'

        if table = _.inspect 'output - cross_validation_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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
          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Cross Validation Metrics#{getAucAsLabel _model, 'output - cross_validation_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - cross_validation_metrics - Maximum Metrics'

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

        if output = _model.output
          if output.model_category is 'Multinomial'
            if confusionMatrix = output.training_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Training Metrics - Confusion Matrix', confusionMatrix
            if confusionMatrix = output.validation_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Validation Metrics - Confusion Matrix', confusionMatrix
            if confusionMatrix = output.cross_validation_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Cross Validation Metrics - Confusion Matrix', confusionMatrix

      when 'deeplearning', 'deepwater'
        if table = _.inspect 'output - Scoring History', _model
          if table.schema['validation_logloss'] and table.schema['training_logloss']
            renderPlot 'Scoring History - logloss', no, _.plot (g) ->
              g(
                g.path(
                  g.position 'epochs', 'training_logloss'
                  g.strokeColor g.value '#1f77b4'
                )
                g.path(
                  g.position 'epochs', 'validation_logloss'
                  g.strokeColor g.value '#ff7f0e'
                )
                g.point(
                  g.position 'epochs', 'training_logloss'
                  g.strokeColor g.value '#1f77b4'
                )
                g.point(
                  g.position 'epochs', 'validation_logloss'
                  g.strokeColor g.value '#ff7f0e'
                )
                g.from table
              )
          else if table.schema['training_logloss']
            renderPlot 'Scoring History - logloss', no, _.plot (g) ->
              g(
                g.path(
                  g.position 'epochs', 'training_logloss'
                  g.strokeColor g.value '#1f77b4'
                )
                g.point(
                  g.position 'epochs', 'training_logloss'
                  g.strokeColor g.value '#1f77b4'
                )
                g.from table
              )

          if table.schema['training_deviance']
            if table.schema['validation_deviance']
              renderPlot 'Scoring History - Deviance', no, _.plot (g) ->
                g(
                  g.path(
                    g.position 'epochs', 'training_deviance'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.path(
                    g.position 'epochs', 'validation_deviance'
                    g.strokeColor g.value '#ff7f0e'
                  )
                  g.point(
                    g.position 'epochs', 'training_deviance'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.point(
                    g.position 'epochs', 'validation_deviance'
                    g.strokeColor g.value '#ff7f0e'
                  )
                  g.from table
                )
            else
              renderPlot 'Scoring History - Deviance', no, _.plot (g) ->
                g(
                  g.path(
                    g.position 'epochs', 'training_deviance'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.point(
                    g.position 'epochs', 'training_deviance'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.from table
                )
          else if table.schema['training_mse']
            if table.schema['validation_mse']
              renderPlot 'Scoring History - MSE', no, _.plot (g) ->
                g(
                  g.path(
                    g.position 'epochs', 'training_mse'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.path(
                    g.position 'epochs', 'validation_mse'
                    g.strokeColor g.value '#ff7f0e'
                  )
                  g.point(
                    g.position 'epochs', 'training_mse'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.point(
                    g.position 'epochs', 'validation_mse'
                    g.strokeColor g.value '#ff7f0e'
                  )
                  g.from table
                )
            else
              renderPlot 'Scoring History - MSE', no, _.plot (g) ->
                g(
                  g.path(
                    g.position 'epochs', 'training_mse'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.point(
                    g.position 'epochs', 'training_mse'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.from table
                )

        if table = _.inspect 'output - training_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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
          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Training Metrics#{getAucAsLabel _model, 'output - training_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - training_metrics - Maximum Metrics'

        if table = _.inspect 'output - validation_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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
          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Validation Metrics#{getAucAsLabel _model, 'output - validation_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - validation_metrics - Maximum Metrics'

        if table = _.inspect 'output - cross_validation_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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
          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Cross Validation Metrics#{getAucAsLabel _model, 'output - cross_validation_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - cross_validation_metrics - Maximum Metrics'

        if table = _.inspect 'output - Variable Importances', _model
          renderPlot 'Variable Importances', no, _.plot (g) ->
            g(
              g.rect(
                g.position 'scaled_importance', 'variable'
              )
              g.from table
              g.limit 25
            )

        if output = _model.output
          if output.model_category is 'Multinomial'
            if confusionMatrix = output.training_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Training Metrics - Confusion Matrix', confusionMatrix
            if confusionMatrix = output.validation_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Validation Metrics - Confusion Matrix', confusionMatrix
            if confusionMatrix = output.cross_validation_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Cross Validation Metrics - Confusion Matrix', confusionMatrix

      when 'gbm', 'drf', 'svm', 'xgboost'
        if table = _.inspect 'output - Scoring History', _model
          if table.schema['validation_logloss'] and table.schema['training_logloss']
            renderPlot 'Scoring History - logloss', no, _.plot (g) ->
              g(
                g.path(
                  g.position 'number_of_trees', 'training_logloss'
                  g.strokeColor g.value '#1f77b4'
                )
                g.path(
                  g.position 'number_of_trees', 'validation_logloss'
                  g.strokeColor g.value '#ff7f0e'
                )
                g.point(
                  g.position 'number_of_trees', 'training_logloss'
                  g.strokeColor g.value '#1f77b4'
                )
                g.point(
                  g.position 'number_of_trees', 'validation_logloss'
                  g.strokeColor g.value '#ff7f0e'
                )
                g.from table
              )
          else if table.schema['training_logloss']
            renderPlot 'Scoring History - logloss', no, _.plot (g) ->
              g(
                g.path(
                  g.position 'number_of_trees', 'training_logloss'
                  g.strokeColor g.value '#1f77b4'
                )
                g.point(
                  g.position 'number_of_trees', 'training_logloss'
                  g.strokeColor g.value '#1f77b4'
                )
                g.from table
              )

          if table.schema['training_deviance']
            if table.schema['validation_deviance']
              renderPlot 'Scoring History - Deviance', no, _.plot (g) ->
                g(
                  g.path(
                    g.position 'number_of_trees', 'training_deviance'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.path(
                    g.position 'number_of_trees', 'validation_deviance'
                    g.strokeColor g.value '#ff7f0e'
                  )
                  g.point(
                    g.position 'number_of_trees', 'training_deviance'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.point(
                    g.position 'number_of_trees', 'validation_deviance'
                    g.strokeColor g.value '#ff7f0e'
                  )
                  g.from table
                )
            else
              renderPlot 'Scoring History - Deviance', no, _.plot (g) ->
                g(
                  g.path(
                    g.position 'number_of_trees', 'training_deviance'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.point(
                    g.position 'number_of_trees', 'training_deviance'
                    g.strokeColor g.value '#1f77b4'
                  )
                  g.from table
                )

        if table = _.inspect 'output - training_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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

          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Training Metrics#{getAucAsLabel _model, 'output - training_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - training_metrics - Maximum Metrics'

        if table = _.inspect 'output - validation_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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

          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Validation Metrics#{getAucAsLabel _model, 'output - validation_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - validation_metrics - Maximum Metrics'

        if table = _.inspect 'output - cross_validation_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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

          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Cross Validation Metrics#{getAucAsLabel _model, 'output - cross_validation_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - cross_validation_metrics - Maximum Metrics'

        if table = _.inspect 'output - Variable Importances', _model
          renderPlot 'Variable Importances', no, _.plot (g) ->
            g(
              g.rect(
                g.position 'scaled_importance', 'variable'
              )
              g.from table
              g.limit 25
            )

        if output = _model.output
          if output.model_category is 'Multinomial'
            if confusionMatrix = output.training_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Training Metrics - Confusion Matrix', confusionMatrix
            if confusionMatrix = output.validation_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Validation Metrics - Confusion Matrix', confusionMatrix
            if confusionMatrix = output.cross_validation_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Cross Validation Metrics - Confusion Matrix', confusionMatrix
    # end of when 'gbm', 'drf', 'svm', 'xgboost'

      when 'stackedensemble'
        if table = _.inspect 'output - training_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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

          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Training Metrics#{getAucAsLabel _model, 'output - training_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - training_metrics - Maximum Metrics'

        if table = _.inspect 'output - validation_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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

          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Validation Metrics#{getAucAsLabel _model, 'output - validation_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - validation_metrics - Maximum Metrics'

        if table = _.inspect 'output - cross_validation_metrics - Metrics for Thresholds', _model
          plotter = _.plot (g) ->
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

          # TODO Mega-hack alert. Last arg thresholdsAndCriteria applicable only to ROC charts for binomial models.
          renderPlot "ROC Curve - Cross Validation Metrics#{getAucAsLabel _model, 'output - cross_validation_metrics'}", no, plotter, getThresholdsAndCriteria _model, 'output - cross_validation_metrics - Maximum Metrics'

        if table = _.inspect 'output - Variable Importances', _model
          renderPlot 'Variable Importances', no, _.plot (g) ->
            g(
              g.rect(
                g.position 'scaled_importance', 'variable'
              )
              g.from table
              g.limit 25
            )

        if output = _model.output
          if output.model_category is 'Multinomial'
            if confusionMatrix = output.training_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Training Metrics - Confusion Matrix', confusionMatrix
            if confusionMatrix = output.validation_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Validation Metrics - Confusion Matrix', confusionMatrix
            if confusionMatrix = output.cross_validation_metrics?.cm?.table
              renderMultinomialConfusionMatrix 'Cross Validation Metrics - Confusion Matrix', confusionMatrix
    # end of stackedensemble

    if table = _.inspect 'output - training_metrics - Gains/Lift Table', _model
      renderPlot 'Training Metrics - Gains/Lift Table', no, _.plot (g) ->
        g(
          g.path(
            g.position 'cumulative_data_fraction', 'cumulative_capture_rate'
            g.strokeColor g.value 'black'
          )
          g.path(
            g.position 'cumulative_data_fraction', 'cumulative_lift'
            g.strokeColor g.value 'green'
          )
          g.from table
        )
    if table = _.inspect 'output - validation_metrics - Gains/Lift Table', _model
      renderPlot 'Validation Metrics - Gains/Lift Table', no, _.plot (g) ->
        g(
          g.path(
            g.position 'cumulative_data_fraction', 'cumulative_capture_rate'
            g.strokeColor g.value 'black'
          )
          g.path(
            g.position 'cumulative_data_fraction', 'cumulative_lift'
            g.strokeColor g.value 'green'
          )
          g.from table
        )
    if table = _.inspect 'output - cross_validation_metrics - Gains/Lift Table', _model
      renderPlot 'Cross Validation Metrics - Gains/Lift Table', no, _.plot (g) ->
        g(
          g.path(
            g.position 'cumulative_data_fraction', 'cumulative_capture_rate'
            g.strokeColor g.value 'black'
          )
          g.path(
            g.position 'cumulative_data_fraction', 'cumulative_lift'
            g.strokeColor g.value 'green'
          )
          g.from table
        )

    for tableName in _.ls _model when tableName isnt 'parameters'

      # Skip CM tables for multinomial models
      if output = _model.output?.model_category is 'Multinomial'
        if 0 is tableName.indexOf 'output - training_metrics - cm'
          continue
        else if 0 is tableName.indexOf 'output - validation_metrics - cm'
          continue
        else if 0 is tableName.indexOf 'output - cross_validation_metrics - cm'
          continue

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

    downloadGenJar = ->
      window.open "/3/h2o-genmodel.jar",'_blank'

    downloadMojo = ->
      window.open "/3/Models/#{encodeURIComponent _model.model_id.name}/mojo", '_blank'

    exportModel = ->
      _.insertAndExecuteCell 'cs', "exportModel #{stringify _model.model_id.name}"

    deleteModel = ->
      _.confirm 'Are you sure you want to delete this model?', { acceptCaption: 'Delete Model', declineCaption: 'Cancel' }, (accept) ->
        if accept
          _.insertAndExecuteCell 'cs', "deleteModel #{stringify _model.model_id.name}"


    key: _model.model_id
    algo: _model.algo_full_name
    plots: _plots
    inputParameters: _inputParameters
    isExpanded: _isExpanded
    havePojo: _model.have_pojo
    haveMojo: _model.have_mojo
    toggle: toggle
    cloneModel: cloneModel
    predict: predict
    inspect: inspect
    previewPojo: previewPojo
    downloadPojo: downloadPojo
    downloadGenJar: downloadGenJar
    downloadMojo: downloadMojo
    pojoPreview: _pojoPreview
    isPojoLoaded: _isPojoLoaded
    exportModel: exportModel
    deleteModel: deleteModel


  _isLive = signal no
  act _isLive, (isLive) ->
    _refresh() if isLive

  _refresh = ->
    refresh (error, model) ->
      unless error
        _output createOutput model
        delay _refresh, 2000 if _isLive()

  _toggleRefresh = ->
    _isLive not _isLive()

  _output createOutput _model

  defer _go

  output: _output
  toggleRefresh: _toggleRefresh
  isLive: _isLive
  template: 'flow-model-output'
