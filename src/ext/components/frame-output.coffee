H2O.FrameOutput = (_, _go, _frame) ->

  _grid = signal null

  renderPlot = (render) ->
    render (error, vis) ->
      if error
        debug error
      else
        $('a', vis.element).on 'click', (e) ->
          $a = $ e.target
          if 'label' is $a.attr 'data-type'
            _.insertAndExecuteCell 'cs', "getColumnSummary #{stringify _frame.frame_id.name}, #{stringify $a.attr 'data-key'}"

        _grid vis.element

  createModel = ->
    _.insertAndExecuteCell 'cs', "assist buildModel, null, training_frame: #{stringify _frame.frame_id.name}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getFrameSummary #{stringify _frame.frame_id.name}"

  inspectData = ->
    _.insertAndExecuteCell 'cs', "grid inspect 'data', getFrame #{stringify _frame.frame_id.name}"

  predict = ->
    _.insertAndExecuteCell 'cs', "predict frame: #{stringify _frame.frame_id.name}"

  download = ->
    window.open "/3/DownloadDataset?frame_id=#{encodeURIComponent _frame.frame_id.name}", '_blank'

  deleteFrame = ->
    _.confirm 'Are you sure you want to delete this frame?', { acceptCaption: 'Delete Frame', declineCaption: 'Cancel' }, (accept) ->
      if accept
        _.insertAndExecuteCell 'cs', "deleteFrame #{stringify _frame.frame_id.name}"

  renderPlot _.plot (g) ->
    g(
      g.select()
      g.from _.inspect 'columns', _frame
    )

  defer _go

  key: _frame.frame_id.name
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

