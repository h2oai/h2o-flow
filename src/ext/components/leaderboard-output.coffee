{ defer, map, delay } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ act, react, lift, link, signal, signals } = require("../../core/modules/dataflow")

html = require('../../core/modules/html')
failure = require('../../core/components/failure')
FlowError = require('../../core/modules/flow-error')

module.exports = (_, _go, _result) ->

  _leaderboard = signal ''
  _leaderboardDescription = signal ''
  _eventLog = signal ''
  _eventLogDescription = signal ''
  _exception = signal null
  _isLive = signal no

  renderLeaderboard = (leaderboard) ->
    [table, thead, tbody, tr, th, td, a] = html.template 'table', 'thead', 'tbody', 'tr', 'th', 'td', "a href='#' data-key='$1'"

    { description, columns, rowcount, data } = leaderboard

    modelIdColumnIndex = -1
    for column, i in columns when column.name is 'model_id'
      modelIdColumnIndex = i

    ths = map columns, (column) -> th column.name

    trs = []
    for i in [0 ... rowcount]
      trs.push tr map data, (d, j) ->
        if j is modelIdColumnIndex
          td a d[i], d[i]
        else
          td d[i]

    leaderboardEl = html.render 'div', table [
      thead tr ths
      tbody trs
    ]

    $('a', leaderboardEl).on 'click', (e) ->
      $a = $ e.target
      _.insertAndExecuteCell 'cs', "getModel #{stringify $a.attr 'data-key'}"

    _leaderboardDescription description
    _leaderboard leaderboardEl

  renderEventLog = (event_log) ->
    [table, thead, tbody, tr, th, td] = html.template 'table', 'thead', 'tbody', 'tr', 'th', 'td'

    { description, columns, rowcount, data } = event_log

    ths = map columns, (column) -> th column.name

    trs = []
    for i in [0 ... rowcount]
      trs.push tr map data, (d) -> td d[i]

    _eventLogDescription description
    _eventLog html.render 'div', table [
      thead tr ths
      tbody trs
    ]

  render = (result) ->
    renderLeaderboard result.leaderboard_table
    renderEventLog result.event_log_table

  toggleRefresh = ->
    _isLive not _isLive()

  refresh = ->
    _.requestLeaderboard _result.automl_id.name, (error, result) ->
      if error
        _exception failure _, new FlowError 'Error fetching leaderboard', error
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
  eventLog: _eventLog
  eventLogDescription: _eventLogDescription
  isLive: _isLive
  toggleRefresh: toggleRefresh
  exception: _exception
  template: 'flow-leaderboard-output'

