Flow.Plot = (_config, go) ->

  renderInterval = (config, go) ->


  renderTextTable = (config, go) ->
    [ table, thead, tbody, tr, th, td, tdr ] = Flow.HTML.template 'table', '=thead', 'tbody', 'tr', '=th', '=td', '=td.rt'
    
    ths = for column in config.data.columns
      th column.name

    trs = for row in config.data.rows
      tds = for column in config.data.columns
        #XXX formatting
        value = row[column.name]
        switch column.type
          when Flow.Data.StringEnum
            td if value is null then '-' else column.domain[value]
          when Flow.Data.Integer, Flow.Data.Real
            tdr if value is null then '-' else value
          else
            td if value is null then '-' else value
      tr tds

    go null, Flow.HTML.render 'div',
      table [
        thead tr ths
        tbody trs
      ]

  initialize = (config) ->
    switch config.type
      when 'interval'
        renderInterval config, go
      when 'text'
        renderTextTable config, go
      else
        go new Error 'Not implemented'

  initialize _config
