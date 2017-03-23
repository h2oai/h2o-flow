H2O.LeaderboardOutput = (_, _go, _result) ->

  _feedback = signal ''
  _feedbackDescription = signal ''

  renderFeedback = (feedback) ->
    [table, thead, tbody, tr, th, td] = Flow.HTML.template 'table', 'thead', 'tbody', 'tr', 'th', 'td'

    { description, columns, rowcount, data } = feedback

    columnCount = columns.length
    ths = map columns, (column) -> th column.name
    
    trs = []
    for i in [0 ... rowcount]
      trs.push tr map data, (d) -> td d[i]
    
    _feedbackDescription description
    _feedback Flow.HTML.render 'div', table [
      thead tr ths
      tbody trs
    ]

  renderFeedback _result.user_feedback

  defer _go 

  feedback: _feedback
  feedbackDescription: _feedbackDescription
  template: 'flow-leaderboard-output'

