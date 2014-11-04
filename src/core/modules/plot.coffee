Flow.Plot = (_config, go) ->

  renderTextTable = (config, go) ->
    [ table, thead, tbody, tr, th, td ] = Flow.HTML.template 'table', '=thead', 'tbody', 'tr', '=th', '=td'
    
    ths = for column in config.data.columns
      th column.name

    trs = for row in config.data.rows
      tds = for column in config.data.columns
        #XXX formatting
        td row[column.name]
      tr tds

    go null, Flow.HTML.render 'div',
      table [
        thead tr ths
        tbody trs
      ]

  initialize = (config) ->
    switch config.type
      when 'text'
        renderTextTable config, go
      else
        go new Error 'Not implemented'

  initialize _config
