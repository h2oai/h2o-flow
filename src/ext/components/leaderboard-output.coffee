H2O.LeaderboardOutput = (_, _go, _result) ->

  _leaderboard = signal ''
  _leaderboardDescription = signal ''
  _feedback = signal ''
  _feedbackDescription = signal ''
  _exception = signal null
  _isLive = signal no

  renderLeaderboard = (leaderboard) ->
    [table, thead, tbody, tr, th, td, a] = Flow.HTML.template 'table', 'thead', 'tbody', 'tr', 'th', 'td', "a href='#' data-key='$1'"

    { description, columns, rowcount, data } = leaderboard

    modelIdColumnIndex = -1
    for column, i in columns when column.name is 'model_id'
      modelIdColumnIndex = i

    columnCount = columns.length
    ths = map columns, (column) -> th column.name

    trs = []
    for i in [0 ... rowcount]
      trs.push tr map data, (d, j) ->
        if j is modelIdColumnIndex
          td a d[i], d[i]
        else
          td d[i]

    leaderboardEl = Flow.HTML.render 'div', table [
      thead tr ths
      tbody trs
    ]

    $('a', leaderboardEl).on 'click', (e) ->
      $a = $ e.target
      _.insertAndExecuteCell 'cs', "getModel #{stringify $a.attr 'data-key'}"

    _leaderboardDescription description
    _leaderboard leaderboardEl

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

  render = (result) ->
    renderLeaderboard result.leaderboard_table
    renderFeedback result.user_feedback_table

  toggleRefresh = ->
    _isLive not _isLive()

  refresh = ->
    _.requestLeaderboard _result.automl_id.name, (error, result) ->
      if error
        _exception Flow.Failure _, new Flow.Error 'Error fetching leaderboard', error
        _isLive no
      else
        render result
        delay refresh, 2000 if _isLive()

  act _isLive, (isLive) ->
    refresh() if isLive

  render _result

  defer _go

  leaderboard: _leaderboard
  leaderboardDescription: _leaderboardDescription
  feedback: _feedback
  feedbackDescription: _feedbackDescription
  isLive: _isLive
  toggleRefresh: toggleRefresh
  exception: _exception
  template: 'flow-leaderboard-output'

