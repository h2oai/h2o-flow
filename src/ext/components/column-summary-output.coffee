{ defer, head } = require('lodash')

{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")
{ stringify } = require('../../core/modules/prelude')

module.exports = (_, _go, frameKey, frame, columnName) ->
  column = head frame.columns

  _characteristicsPlot = signal null
  _summaryPlot = signal null
  _distributionPlot = signal null
  _domainPlot = signal null

  renderPlot = (target, render) ->
    render (error, vis) ->
      if error
        console.debug error
      else
        target vis.element

  if table = _.inspect 'characteristics', frame
    renderPlot _characteristicsPlot, _.plot (g) ->
      g(
        g.rect(
          g.position g.stack(g.avg('percent'), 0), 'All'
          g.fillColor 'characteristic'
        )
        g.groupBy g.factor(g.value 'All'), 'characteristic'
        g.from table
      )

  if table = _.inspect 'distribution', frame
    renderPlot _distributionPlot, _.plot (g) ->
      g(
        g.rect(
          g.position 'interval', 'count'
          g.width g.value 1
        )
        g.from table
      )

  if table = _.inspect 'summary', frame
    renderPlot _summaryPlot, _.plot (g) ->
      g(
        g.schema(
          g.position 'min', 'q1', 'q2', 'q3', 'max', 'column'
        )
        g.from table
      )

  if table = _.inspect 'domain', frame
    renderPlot _domainPlot, _.plot (g) ->
      g(
        g.rect(
          g.position 'count', 'label'
        )
        g.from table
        g.limit 1000
      )

  impute = ->
    _.insertAndExecuteCell 'cs', "imputeColumn frame: #{stringify frameKey}, column: #{stringify columnName}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}"


  defer _go

  label: column.label
  characteristicsPlot: _characteristicsPlot
  summaryPlot: _summaryPlot
  distributionPlot: _distributionPlot
  domainPlot: _domainPlot
  impute: impute
  inspect: inspect
  template: 'flow-column-summary-output'
