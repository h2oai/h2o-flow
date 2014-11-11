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

renderD3StackedBar = (title, table, attrX1, attrX2, attrColor) ->
  { schema, variables, rows } = table

  variableX1 = table.schema[attrX1]
  variableX2 = table.schema[attrX2]
  variableColor = table.schema[attrColor]

  domainX = Flow.Data.combineRanges variableX1.domain, variableX2.domain
  availableWidth = 450
  availableHeight = 16 + 30
  
  margin =
    top: 0
    right: 10
    bottom: 30
    left: 10

  width = availableWidth - margin.left - margin.right
  height = availableHeight - margin.top - margin.bottom

  scaleX = d3.scale.linear()
    .domain domainX
    .range [ 0, width ]

  scaleColor = d3.scale.ordinal()
    .domain variableColor.domain
    .range d3.scale.category10().range()

  axisX = createAxis scaleX, 
    orient: 'bottom'

  svg = document.createElementNS 'http://www.w3.org/2000/svg', 'svg'
  viz = d3.select svg
    .attr 'class', 'plot'
    .attr 'width', availableWidth
    .attr 'height', availableHeight
    .append 'g'
    .attr 'transform', "translate(#{margin.left},#{margin.top})"

  svgAxisX = viz
    .append 'g'
    .attr 'class', 'axis'
    .attr 'transform', 'translate(0,' + height + ')'
    .call axisX

  tooltip = (d) ->
    tip = ''
    for variable in variables
      tip += "#{variable.label}: #{if variable.type is TFactor then variable.domain[d[variable.label]] else d[variable.label]}\n"
    tip.trim()

  bar = viz.selectAll '.bar'
    .data rows
    .enter()
    .append 'rect'
    .attr 'class', 'bar'
    .attr 'x', (d) -> scaleX d[attrX1]
    .attr 'width', (d) -> scaleX d[attrX2] - d[attrX1]
    .attr 'height', height
    .style 'fill', (d) -> scaleColor variableColor.domain[d[attrColor]]
    .append 'title'
      .text tooltip

  [ legends, legend, swatch, label ] = Flow.HTML.template '.flow-legend', 'span.flow-legend-item', "+span.flow-legend-swatch style='background:{0}'", '=span.flow-legend-label'

  items = for d in variableColor.domain
    legend [
      swatch '', scaleColor d
      label d
    ]
  
  legendEl = Flow.HTML.render 'div', legends items

  el = document.createElement 'div'
  if title
    [ h4 ] = Flow.HTML.template '=h4'
    el.appendChild Flow.HTML.render 'div', h4 escape title
  el.appendChild svg
  el.appendChild legendEl
  el

renderD3BarChart = (title, table, attrX, attrY) ->
  { schema, variables, rows } = table

  variableX = schema[attrX]
  variableY = schema[attrY]

  interpretationX = Flow.Data.computevariableInterpretation variableX.type
  interpretationY = Flow.Data.computevariableInterpretation variableY.type
  interpretationXY = interpretationX + interpretationY

  domainX = if interpretationX is 'c'
    Flow.Data.includeZeroInRange variableX.domain
  else
    for row in rows
      variableX.domain[row[attrX]]

  domainY = if interpretationY is 'c'
    Flow.Data.includeZeroInRange variableY.domain 
  else 
    for row in rows
      variableY.domain[row[attrY]]

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
    positionX = (d) -> scaleX variableX.domain[d[attrX]]
    positionY = (d) -> scaleY d[attrY]
    widthX = scaleX.rangeBand()
    heightY = (d) -> height - scaleY d[attrY]
  else #XXX 'cc', 'dd' not handled
    positionX = (d) -> scaleX 0
    positionY = (d) -> scaleY variableY.domain[d[attrY]]
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
      .text variableY.label

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

  el = document.createElement 'div'
  if title
    [ h4 ] = Flow.HTML.template '=h4'
    el.appendChild Flow.HTML.render 'div', h4 escape title
  el.appendChild svg
  el

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

  renderSchema2 = (config, go) ->
    config.data

  # TODO characteristics, histogram, boxplot
  renderInterval2 = (config, go) ->
    #XXX Does not handle all cases - rework
    if config.x and not config.y
      [ attrX1, attrX2 ] = config.x config.data
      el = renderD3StackedBar config.title, config.data, attrX1, attrX2, config.color
    else
      el = renderD3BarChart config.title, config.data, config.x, config.y
    go null, Flow.HTML.render 'div', el

  renderText = (config, go) ->
    [ grid, h4, p, table, thead, tbody, tr, th, thr, td, tdr ] = Flow.HTML.template '.grid', '=h4', '=p', 'table', '=thead', 'tbody', 'tr', '=th', '=th.rt', '=td', '=td.rt'
    
    ths = for variable in config.data.variables
      switch variable.type
        when TNumber
          thr escape variable.label
        else
          th escape variable.label

    trs = for row in config.data.rows
      tds = for variable in config.data.variables
        #XXX formatting
        value = row[variable.label]
        switch variable.type
          when TFactor
            td if value is null then '-' else escape variable.domain[value]
          when TNumber
            tdr if value is null then '-' else value
          when TArray
            td if value is null then '-' else value.join ', '
          else
            td if value is null then '-' else value
      tr tds

    go null, Flow.HTML.render 'div',
      grid [
        h4 config.data.label
        p config.data.description
        table [
          thead tr ths
          tbody trs
        ]
      ]

  createVegaPointSpec = (config, go) ->
    { width, height, x, y, color } = config

    width: width
    height: height
    data: [
      name: 'table'
    ]
    scales: [
      name: 'x'
      nice: yes
      domain:
        data: 'table'
        field: "data.#{x}"
      range: 'width'
    ,
      name: 'y'
      nice: yes
      domain:
        data: 'table'
        field: "data.#{y}"
      range: 'height'
    ,
      name: 'color'
      type: 'ordinal'
      domain:
        data: 'table'
        field: "data.#{color}"
      range: 'category20'
    ]
    axes: [
      type: 'x'
      scale: 'x'
      title: x
    ,
      type: 'y'
      scale: 'y'
      title: y
    ]
    marks: [
      type: 'symbol'
      from:
        data: 'table'
      properties:
        enter:
          x:
            scale: 'x'
            field: "data.#{x}"
          y:
            scale: 'y'
            field: "data.#{y}"
          fill:
            scale: 'color'
            field: "data.#{color}"
    ]

  renderPoint = (config, go) ->
    x = config.data.schema[config.x]?.label
    y = config.data.schema[config.y]?.label
    color = config.data.schema[config.color]?.label

    return go new Flow.Error "Invalid 'x' field: #{config.x}" unless x
    return go new Flow.Error "Invalid 'y' field: #{config.y}" unless y
    return go new Flow.Error "Invalid 'color' field: #{config.color}" unless color

    spec = createVegaPointSpec 
      width: 400
      height: 400
      x: config.data.schema[config.x].label
      y: config.data.schema[config.y].label
      color: config.data.schema[config.color].label

    go null, Flow.HTML.render 'div', el = document.createElement 'div'
    vg.parse.spec spec, (ctor) ->
      chart = ctor
        el: el
        data:
          table: config.data.rows
      chart.update()
    return

  renderLine = (config, go) ->

  renderInterval = (config, go) ->

  renderSchema = (config, go) ->

  initialize = (config) ->
    try
      switch config.type
        when 'point'
          renderPoint config, go
        when 'line'
          renderLine config, go
        #when 'area'
        when 'interval'
          renderInterval config, go
        #when 'path'
        when 'schema'
          renderSchema config, go
        #when 'polygon'
        #when 'contour'
        #when 'edge'
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
    [ startVariable, endVariable ] = table.expand type, type

    start = startVariable.label
    end = endVariable.label

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

    startVariable.domain = [ n, p ]
    endVariable.domain = [ n, p ]
    
    [ start, end ]
    
  self

Flow.Plot = plot
plot.stack = stack
