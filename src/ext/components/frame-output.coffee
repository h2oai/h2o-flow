H2O.FrameOutput = (_, _frame) ->
  createGrid = (data) ->
    [ grid, table, thead, tbody, tr, th, thr, td, tdr, action ] = Flow.HTML.template '.grid', 'table', '=thead', 'tbody', 'tr', '=th', '=th.rt', '=td', '=td.rt', "+a data-action='summary' data-index='{0}' class='action' href='#'"
    
    ths = for variable in data.variables
      switch variable.type
        when TNumber
          thr escape variable.label
        else
          th escape variable.label

    ths.push th 'Actions'

    trs = for row, rowIndex in data.rows
      tds = for variable in data.variables
        #XXX formatting
        value = row[variable.label]
        switch variable.type
          when TFactor
            td if value is null then '-' else escape variable.domain[value]
          when TNumber
            tdr if value is null then '-' else value
          when TArray
            td if value is null then '-' else value.join ', '
          else
            td if value is null then '-' else value
      tds.push td action 'Summary...', rowIndex
      tr tds

    el = Flow.HTML.render 'div',
      grid [
        table [
          thead tr ths
          tbody trs
        ]
      ]

    $('a.action', el).click (e) ->
      e.preventDefault()
      $link = $ @
      action = $link.attr 'data-action'
      index = parseInt ($link.attr 'data-index'), 10
      switch action
        when 'summary'
          if index >= 0
            row = data.rows[index]
            if row
              _.insertAndExecuteCell 'cs', "inspect getColumnSummary #{stringify _frame.key.name}, #{stringify row.label}"

    el

  createModel = ->
    _.insertAndExecuteCell 'cs', "assist buildModel, null, training_frame: #{stringify _frame.key.name}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getFrame #{stringify _frame.key.name}"

  inspectData = ->
    _.insertAndExecuteCell 'cs', "grid inspect 'data', getFrame #{stringify _frame.key.name}"

  predict = ->
    _.insertAndExecuteCell 'cs', "predict null, #{stringify _frame.key.name}"

  download = ->
    window.open "/3/DownloadDataset?key=#{encodeURIComponent _frame.key.name}", '_blank'

  _grid = createGrid _.inspect 'columns', _frame

  key: _frame.key.name
  grid: _grid
  inspect: inspect
  createModel: createModel
  inspectData: inspectData
  predict: predict
  download: download
  template: 'flow-frame-output'

