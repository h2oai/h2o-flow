H2O.TreeVizOutput = (_, _go, _trees) ->

  defer _go

  renderTree = (root) ->
    # ************** Generate the tree diagram	 *****************
    margin = 
      top: 0
      right: 0
      bottom: 0
      left: 0
    width = 150 - (margin.right) - (margin.left)
    height = 90 - (margin.top) - (margin.bottom)
    svg = d3.select('div.flow-form').append('svg').attr('width', width + margin.right + margin.left).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').attr('style', 'border-width: 1px')
    i = 0
    console.log "Received ", _trees.length, " trees"

    values = [0,0]
    prepareTree = (node) ->
      if !node.parent
        node.width = width / 25
      node.height = height / 27
      node.leaf = !node.children
      node.children and node.children.map((child, index) ->
        child.parent = node.name
        if index == 0
          x = 0
          while x < 2
            if node.children and typeof node.children[0].value == 'string' and typeof node.children[1].value == 'string'
              values[x] = parseFloat(node.children[x].value.match(/\d+\.\d+/))
            else
              values[0] = 50
              values[1] = 100
            if values[1] < values[0]
              node.right =
                percent: values[1] / values[0] * 100
                type: 'YellowGreen'
              node.left =
                percent: 100 - (values[1] / values[0] * 100)
                type: 'Cyan'
            else
              node.left =
                percent: values[0] / values[1] * 100
                type: 'YellowGreen'
              node.right =
                percent: 100 - (values[0] / values[1] * 100)
                type: 'Cyan'
            x++
        prepareTree child
        return
      )
      return

    lineData = (d) ->
      points = [
        {
          lx: d.source.x
          ly: d.source.y + d.source.height
        }
        {
          lx: d.target.x
          ly: d.target.y + d.target.height
        }
      ]
      diagonal points
  
    update = (source) ->
      # Compute the new tree layout.
      nodes = tree.nodes(root)
      # Normalize for fixed-depth.
      nodes.forEach (d) ->
        d.y = d.depth * width / 15
        d.width = d.width or d.parent.width * (if d.parent.x < d.x then d.parent.left.percent else d.parent.right.percent) / 100
        if d.parent and d.x > d.parent.x and d.x < d.parent.x + d.parent.width
          d.x = d.parent.x + d.parent.width
        return
      nodes = nodes.reverse()
      links = tree.links(nodes)
      # Declare the nodes…
      node = svg.selectAll('g.node').data(nodes, (d) ->
        d.id or (d.id = ++i)
      )
      # Enter the nodes.
      nodeEnter = node.enter().append('g').attr('class', 'node').attr('transform', (d) ->
        'translate(' + d.x + ',' + d.y + ')'
      )
      # enter left rects
      nodeEnter.append('rect').attr('width', (d) ->
        if d.leaf or d.fill then d.width else d.children[0].width
      ).attr('height', (d) ->
        d.height
      ).style('stroke', 'black').style 'fill', (d) ->
        d.leaf or d.fill or d.left.type
      # enter right rectsxfx
      nodeEnter.append('rect').attr('x', (d) ->
       if d.leaf or d.fill then 0 else d.children[0].width
      ).attr('width', (d) ->
        if d.leaf or d.fill then d.width else d.children[1].width
      ).attr('height', (d) ->
        d.height
      ).style('stroke', 'black').style 'fill', (d) ->
        d.leaf or d.fill or d.right.type

  
      nodeEnter.append('text').attr('x', (d) ->
        if d.leaf or d.fill then 0 else d.children[0].width
      ).attr('dy', '-0.5em').attr('text-anchor', 'middle').text((d) ->
        if d.leaf then Math.floor(d.value * 1000) / 1000 else d.name
      ).style('fill-opacity', 1).style("font-size", "1px").style("display", "none")

      ###// node top text
        // node right or bottom text if any
        nodeEnter.append("text")
        .attr("x", function(d) { return d.leaf ? 0 : d.width + 2; })
        .attr("dy", function(d) { return d.leaf ? 45 : 20; })
        .attr("text-anchor", function(d) { return d.leaf ? "middle" : "left"; })
        .text(function(d) { return d["bottom-name"]; })
        .style("fill-opacity", 1)
        .style("font-size", 15);
      ###

      # Declare the links…
      link = svg.selectAll('path.link').data(links, (d) ->
        d.target.id
      )

      ###
      // Enter the links.
      link.enter().insert("path", "g")
      .attr("class", "link")
      		.style("stroke", function(d) { return d.target.level; })
      .attr("d", lineData);
      ###

      # Enter the polygon links.
      link.enter().insert('polygon', 'g').attr('points', (d) ->
        if d.target.x > d.source.x
          # right child
          [
            [
              d.source.x + d.source.width - (d.target.width)
              d.source.y + d.source.height
            ].join(',')
            [
              d.source.x + d.source.width
              d.source.y + d.source.height
            ].join(',')
            [
              d.target.x + d.target.width
              d.target.y
            ].join(',')
            [
              d.target.x
              d.target.y
            ].join(',')
          ].join ' '
        else
          [
            [
              d.source.x
              d.source.y + d.source.height
            ].join(',')
            [
              d.source.x + d.target.width
              d.source.y + d.source.height
            ].join(',')
            [
              d.target.x + d.target.width
              d.target.y
            ].join(',')
            [
              d.target.x
              d.target.y
            ].join(',')
          ].join ' '
      ).attr('fill', 'black').attr('stroke-width', 1)
          .style("fill", "DarkMagenta")
      return
  
    prepareTree root
    console.log 'Prepared ', root
    tree = d3.layout.tree().size([
      height
      width
    ])
    diagonal = d3.svg.line().x((point) ->
      point.lx
    ).y((point) ->
      point.ly
    )
    update root
    return

  renderTrees = ->
    _trees.map (tree) ->
      renderTree tree
      return
    # tree is rendered in a fixed size viewBox, which is incorrect
    # the zoomed tree should transformed into the right co-ordinates using viewBox
    $('div.flow-form svg', ).on 'click', (e) ->
      $svg = $(this).clone()
      $svg.attr 'width', '900'
      $svg.attr 'height', '600'
      $svg[0].setAttribute "viewBox", '0,-5,90,60'
      $('rect,polygon', $svg).attr 'stroke-width', '.1'
      $('text', $svg).css 'display', 'block'
      $('text', $svg).css 'font-size', '1.4px'
      $.featherlight $svg
      return
    return

  setTimeout renderTrees, 0

  trees: _trees
  template: 'flow-tree-viz-output'