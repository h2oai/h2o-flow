H2O.FrameOutput = (_, _frame) ->
  createMinMaxRow = (attribute, columns) ->
    map columns, (column) ->
      switch column.type
        when 'time'
          Flow.Format.Date head column[attribute]
        when 'real'
          (Flow.Format.Real column.precision) head column[attribute]
        when 'int'
          Flow.Format.Digits 6, head column[attribute]
        else
          '-'

  createMeanRow = (columns) ->
    map columns, (column) ->
      switch column.type
        when 'time'
          Flow.Format.Date column.mean
        when 'real'
          (Flow.Format.Real column.precision) column.mean
        when 'int'
          Flow.Format.Digits 6, column.mean
        else
          '-'

  createSigmaRow = (columns) ->
    map columns, (column) ->
      switch column.type
        when 'time', 'real', 'int'
          Flow.Format.Digits 6, column.sigma
        else
          '-'

  createCardinalityRow = (columns) ->
    map columns, (column) ->
      switch column.type
        when 'enum'
          column.domain.length
        else
          '-'

  createPlainRow = (attribute, columns) ->
    map columns, (column) -> column[attribute]

  createMissingsRow = (columns) ->
    map columns, (column) ->
      if column.missing is 0 then '-' else column.missing

  createInfRow = (attribute, columns) ->
    map columns, (column) ->
      switch column.type
        when 'real', 'int'
          if column[attribute] is 0 then '-' else column[attribute]
        else
          '-'

  createSummaryRow = (frameKey, columns) ->
    map columns, (column) ->
      displaySummary: ->
        _.insertAndExecuteCell 'cs', "getColumnSummary #{stringify frameKey}, #{stringify column.label}"

  createDataRow = (offset, index, columns) ->
    header: "Row #{offset + index + 1}"
    cells: map columns, (column) ->
      switch column.type
        when 'uuid', 'string'
          column.str_data[index] or '-'
        when 'enum'
          column.domain[column.data[index]]
        when 'time'
          Flow.Format.Date column.data[index]
        else
          value = column.data[index]
          if value is 'NaN'
            '-'
          else
            if column.type is 'real'
              (Flow.Format.Real column.precision) value
            else
              value

  createDataRows = (offset, rowCount, columns) ->
    rows = []
    for index in [0 ... rowCount]
      rows.push createDataRow offset, index, columns
    rows

  createFrameTable = (offset, rowCount, columns) ->
    hasMissings = hasZeros = hasPinfs = hasNinfs = hasEnums = no
    for column in columns
      hasMissings = yes if not hasMissings and column.missing > 0
      hasZeros = yes if not hasZeros and column.zeros > 0
      hasPinfs = yes if not hasPinfs and column.pinfs > 0
      hasNinfs = yes if not hasNinfs and column.ninfs > 0
      hasEnums = yes if not hasEnums and column.type is 'enum'

    header: createPlainRow 'label', columns
    typeRow: createPlainRow 'type', columns
    minRow: createMinMaxRow 'mins', columns
    maxRow: createMinMaxRow 'maxs', columns
    meanRow: createMeanRow columns
    sigmaRow: createSigmaRow columns
    cardinalityRow: if hasEnums then createCardinalityRow columns else null
    missingsRow: if hasMissings then createMissingsRow columns else null
    zerosRow: if hasZeros then createInfRow 'zeros', columns else null
    pinfsRow: if hasPinfs then createInfRow 'pinfs', columns else null
    ninfsRow: if hasNinfs then createInfRow 'ninfs', columns else null
    summaryRow: createSummaryRow _frame.key.name, columns
    #summaryRows: createSummaryRows columns
    hasMissings: hasMissings
    hasZeros: hasZeros
    hasPinfs: hasPinfs
    hasNinfs: hasNinfs
    hasEnums: hasEnums
    dataRows: createDataRows offset, rowCount, columns

  createModel = ->
    _.insertAndExecuteCell 'cs', "assist buildModel, null, training_frame: #{stringify _frame.key.name}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getFrame #{stringify _frame.key.name}"

  data: _frame
  key: _frame.key.name
  timestamp: _frame.creation_epoch_time_millis
  title: _frame.key.name
  columns: _frame.column_names
  table: createFrameTable _frame.off, _frame.len, _frame.columns
  dispose: ->
  inspect: inspect
  createModel: createModel
  template: 'flow-frame-output'

