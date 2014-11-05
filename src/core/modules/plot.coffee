
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

renderD3BarChart = (table, attrX, attrY) ->
  { schema, columns, rows } = table

  columnX = schema[attrX]
  columnY = schema[attrY]

  interpretationX = Flow.Data.computeColumnInterpretation columnX.type
  interpretationY = Flow.Data.computeColumnInterpretation columnY.type
  interpretationXY = interpretationX + interpretationY

  domainX = if interpretationX is 'c' then Flow.Data.includeZeroInRange columnX.domain else columnX.domain
  domainY = if interpretationY is 'c' then Flow.Data.includeZeroInRange columnY.domain else columnY.domain

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
    positionX = (d) -> scaleX domainX[d[attrX]]
    positionY = (d) -> scaleY d[attrY]
    widthX = scaleX.rangeBand()
    heightY = (d) -> height - scaleY d[attrY]
  else #XXX 'cc', 'dd' not handled
    positionX = (d) -> scaleX 0
    positionY = (d) -> scaleY domainY[d[attrY]]
    widthX = (d) -> scaleX d[attrX]
    heightY = scaleY.rangeBand()

  el = document.createElementNS 'http://www.w3.org/2000/svg', 'svg'
  svg = d3.select el
    .attr 'class', 'plot'
    .attr 'width', width + margin.left + margin.right
    .attr 'height', height + margin.top + margin.bottom
    .append 'g'
    .attr 'transform', 'translate(' + margin.left + ',' + margin.top + ')'

  svgAxisX = svg
    .append 'g'
    .attr 'class', 'axis'
    .attr 'transform', 'translate(0,' + height + ')'
    .call axisX

  svgAxisY = svg
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

  svg
    .selectAll '.bar'
    .data rows
    .enter()
    .append 'rect'
    .attr 'class', 'bar'
    .attr 'x', positionX
    .attr 'width', widthX
    .attr 'y', positionY
    .attr 'height', heightY

  el 

Flow.Plot = (_config, go) ->

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
    svg = renderD3BarChart config.data, config.x, config.y
    go null, Flow.HTML.render 'div', svg

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
    switch config.type
      when 'interval'
        renderInterval config, go
      when 'schema'
        renderSchema config, go
      when 'text'
        renderText config, go
      else
        go new Error 'Not implemented'

  initialize _config
