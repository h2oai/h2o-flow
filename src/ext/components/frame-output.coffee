H2O.FrameOutput = (_, _go, _frame) ->

  createGrid = (data) ->
    [ grid, table, thead, tbody, tr, th, thr, td, tdr, action ] = Flow.HTML.template '.grid', 'table', 'thead', 'tbody', 'tr', 'th', 'th.rt', 'td', 'td.rt', "a data-action='summary' data-index='$1' class='action' href='#'"
    
    ths = for vector in data.vectors
      switch vector.type
        when TNumber
          thr escape vector.label
        else
          th escape vector.label

    ths.push th 'Actions'

    trs = for i in data.indices
      tds = for vector, vectorIndex in data.vectors
        value = vector.format i
        switch vector.type
          when TString
            td if value isnt undefined then escape value else '-'
          when TNumber
            tdr if value isnt undefined then value else '-'
          else
            td '?'
      tds.push td action 'Summary...', i
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
      if index >= 0
        switch action
          when 'summary'
            _.insertAndExecuteCell 'cs', "getColumnSummary #{stringify _frame.key.name}, #{stringify data.schema.label.valueAt index}"

    el

  createModel = ->
    _.insertAndExecuteCell 'cs', "assist buildModel, null, training_frame: #{stringify _frame.key.name}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getFrameSummary #{stringify _frame.key.name}"

  inspectData = ->
    _.insertAndExecuteCell 'cs', "grid inspect 'data', getFrame #{stringify _frame.key.name}"

  predict = ->
    _.insertAndExecuteCell 'cs', "predict frame: #{stringify _frame.key.name}"

  download = ->
    window.open "/3/DownloadDataset?key=#{encodeURIComponent _frame.key.name}", '_blank'

  deleteFrame = ->
    _.confirm 'Are you sure you want to delete this frame?', { acceptCaption: 'Delete Frame', declineCaption: 'Cancel' }, (accept) ->
      if accept
        _.insertAndExecuteCell 'cs', "deleteFrame #{stringify _frame.key.name}"

  _grid = createGrid _.inspect 'columns', _frame

  defer _go

  key: _frame.key.name
  rowCount: _frame.rows
  columnCount: _frame.columns.length
  size: Flow.Util.formatBytes _frame.byte_size
  grid: _grid
  inspect: inspect
  createModel: createModel
  inspectData: inspectData
  predict: predict
  download: download
  deleteFrame: deleteFrame
  template: 'flow-frame-output'

