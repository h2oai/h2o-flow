# Performance notes:
#
# Rendering loops should use (row[attr] for row in rows) - not (attr(row) for row in rows) - avoids 1 func call per attr per row. This also implies that attrs should be passed around as strings, not functions.
#

createOrdinalBandScale = (domain, range) ->
  d3.scale.ordinal()
    .domain domain
    .rangeRoundBands range, .1

createLinearScale = (domain, range) ->
  d3.scale.linear()
    .domain domain
    .range range

createAxis = (scale, opts) ->
  axis = d3.svg.axis().scale scale
  axis.orient opts.orient if opts.orient
  axis.ticks opts.ticks if opts.ticks
  axis

renderD3StackedBar = (table, attrX1, attrX2, attrColor) ->
  { schema, columns, rows } = table

  columnX1 = table.schema[attrX1]
  columnX2 = table.schema[attrX2]
  columnColor = table.schema[attrColor]

  domainX = Flow.Data.combineRanges columnX1.domain, columnX2.domain

  availableWidth = 450
  availableHeight = 20
  
  margin =
    top: 0
    right: 0
    bottom: 0
    left: 0

  width = availableWidth - margin.left - margin.right
  height = availableHeight - margin.top - margin.bottom

  scaleX = d3.scale.linear()
    .domain domainX
    .range [ 0, width ]

  scaleColor = d3.scale.category20()
    .domain columnColor.domain

  svg = document.createElementNS 'http://www.w3.org/2000/svg', 'svg'
  viz = d3.select svg
    .attr 'width', availableWidth
    .attr 'height', availableHeight
    .append 'g'
    .attr 'transform', "translate(#{margin.left},#{margin.top})"

  tooltip = (d) ->
    tip = ''
    for column in columns
      tip += "#{column.name}: #{if Flow.Data.isDiscrete column.type then column.domain[d[column.name]] else d[column.name]}\n"
    tip.trim()

  bar = viz.selectAll '.bar'
    .data rows
    .enter()
    .append 'rect'
    .attr 'class', 'bar'
    .attr 'x', (d) -> scaleX d[attrX1]
    .attr 'width', (d) -> scaleX d[attrX2] - d[attrX1]
    .attr 'height', height
    .style 'fill', (d) -> scaleColor d[attrColor]
    .append 'title'
      .text tooltip

  svg

renderD3BarChart = (table, attrX, attrY) ->
  { schema, columns, rows } = table

  columnX = schema[attrX]
  columnY = schema[attrY]

  interpretationX = Flow.Data.computeColumnInterpretation columnX.type
  interpretationY = Flow.Data.computeColumnInterpretation columnY.type
  interpretationXY = interpretationX + interpretationY

  domainX = if interpretationX is 'c'
    Flow.Data.includeZeroInRange columnX.domain
  else
    for row in rows
      columnX.domain[row[attrX]]

  domainY = if interpretationY is 'c'
    Flow.Data.includeZeroInRange columnY.domain 
  else 
    for row in rows
      columnY.domain[row[attrY]]

  availableWidth = if interpretationX is 'c' then 500 else domainX.length * 20
  availableHeight = if interpretationY is 'c' then 500 else domainY.length * 20

  margin =
    top: 20
    right: 20
    bottom: 30
    left: 40

  width = availableWidth - margin.left - margin.right
  height = availableHeight - margin.top - margin.bottom

  scaleX = if interpretationX is 'd'
    createOrdinalBandScale domainX, [ 0, width ]
  else
    createLinearScale domainX, [ 0, width ]

  scaleY = if interpretationY is 'd'
    createOrdinalBandScale domainY, [ 0, height ] # top to bottom
  else
    createLinearScale domainY, [ height, 0 ] # bottom to top

  axisX = createAxis scaleX, 
    orient: 'bottom'

  axisY = createAxis scaleY,
    orient: 'left'

  if interpretationXY is 'dc'
    positionX = (d) -> scaleX columnX.domain[d[attrX]]
    positionY = (d) -> scaleY d[attrY]
    widthX = scaleX.rangeBand()
    heightY = (d) -> height - scaleY d[attrY]
  else #XXX 'cc', 'dd' not handled
    positionX = (d) -> scaleX 0
    positionY = (d) -> scaleY columnY.domain[d[attrY]]
    widthX = (d) -> scaleX d[attrX]
    heightY = scaleY.rangeBand()

  svg = document.createElementNS 'http://www.w3.org/2000/svg', 'svg'
  viz = d3.select svg
    .attr 'class', 'plot'
    .attr 'width', availableWidth
    .attr 'height', availableHeight
    .append 'g'
    .attr 'transform', 'translate(' + margin.left + ',' + margin.top + ')'

  svgAxisX = viz
    .append 'g'
    .attr 'class', 'axis'
    .attr 'transform', 'translate(0,' + height + ')'
    .call axisX

  svgAxisY = viz
    .append 'g'
    .attr 'class', 'axis'
    .call axisY

  if no
    # Axis label
    svgAxisY.append 'text'
      .attr 'transform', 'rotate(-90)'
      .attr 'y', 6
      .attr 'dy', '.71em'
      .style 'text-anchor', 'end'
      .text columnY.name #TODO change to label.

  viz
    .selectAll '.bar'
    .data rows
    .enter()
    .append 'rect'
    .attr 'class', 'bar'
    .attr 'x', positionX
    .attr 'width', widthX
    .attr 'y', positionY
    .attr 'height', heightY

  svg

plot = (_config, go) ->
  #
  # syntax for stacked bar charts
  # data for box plots
  # mean, q1, q2, q3, min, max, outliers...
  # plot
  #   type: 'schema'
  #   data: xxx
  #   x:
  #     mean: 'mean'
  #     q1: 'q1'
  #     q2: 'q2'
  #     q3: 'q3'
  #     outliers: 'outliers'

  renderSchema = (config, go) ->
    config.data

  # TODO characteristics, histogram, boxplot
  renderInterval = (config, go) ->
    #XXX Does not handle all cases - rework
    if config.x and not config.y
      [ attrX1, attrX2 ] = config.x config.data
      el = renderD3StackedBar config.data, attrX1, attrX2, config.color
    else
      el = renderD3BarChart config.data, config.x, config.y
    go null, Flow.HTML.render 'div', el

  renderText = (config, go) ->
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
          when Flow.Data.RealArray
            td if value is null then '-' else value.join ', '
          else
            td if value is null then '-' else value
      tr tds

    go null, Flow.HTML.render 'div',
      table [
        thead tr ths
        tbody trs
      ]

  initialize = (config) ->
    try
      switch config.type
        when 'interval'
          renderInterval config, go
        when 'schema'
          renderSchema config, go
        when 'text'
          renderText config, go
        else
          go new Error 'Not implemented'
    catch error
      go new Flow.Error 'Error creating plot.', error

  initialize _config

stack = (attr) ->
  self = (table) ->
    type = table.schema[attr].type
    [ startColumn, endColumn ] = table.expand type, type

    start = startColumn.name
    end = endColumn.name

    n = 0 
    p = 0
    for row in table.rows
      value = row[attr]
      if value >= 0
        row[start] = p
        row[end] = p = p + value
      else
        row[start] = n
        row[end] = n = n + value

    startColumn.domain = [ n, p ]
    endColumn.domain = [ n, p ]
    
    [ start, end ]
    
  self

Flow.Plot =
  plot: plot
  stack: stack
