H2O.CloudOutput = (_, _go, _cloud) ->
  _exception = signal null #TODO Display in .jade
  _isLive = signal no
  _isBusy = signal no

  _isExpanded = signal no

  _name = do signal
  _size = do signal
  _uptime = do signal
  _version = do signal
  _nodeCounts = do signal
  _hasConsensus = do signal
  _isLocked = do signal
  _isHealthy = do signal
  _nodes = do signals
  
  formatMilliseconds = (ms) ->
    Flow.Util.fromNow new Date (new Date()).getTime() - ms

  format3f = d3.format '.3f' # precision = 3

  _sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  prettyPrintBytes = (bytes) ->
    return '-' if bytes is 0
    i = Math.floor Math.log(bytes) / Math.log(1024)
    (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + _sizes[i]

  formatThreads = (fjs) ->
    for max_lo in [ 120 ... 0 ]
      if fjs[max_lo - 1] isnt -1
        break
    s = '['
    for i in [ 0 ... max_lo ]
      s += Math.max fjs[i], 0
      s += '/'
    s += '.../'
    for i in [ 120 ... fjs.length - 1 ]
      s += fjs[i]
      s += '/'
    s += fjs[fjs.length - 1]
    s += ']'

    s
    

  sum = (nodes, attrOf) ->
    total = 0
    for node in nodes
      total += attrOf node
    total

  avg = (nodes, attrOf) ->
    (sum nodes, attrOf) / nodes.length

  _headers = [
    # [ Caption, show_always? ]
    [ "&nbsp;", yes ]
    [ "Name", yes ]
    [ "Ping", yes ]
    [ "Cores", yes ]
    [ "Load", yes ]
    [ "Data (Used/Total)", yes ]
    [ "Data (% Cached)", yes ]
    [ "GC (Free / Total / Max)", yes ]
    [ "Disk (Free / Max)", yes ]
    [ "Disk (% Free)", yes ]
    [ "PID", no ]
    [ "Keys", no ]
    [ "TCP", no ]
    [ "FD", no ]
    [ "RPCs", no ]
    [ "Threads", no ]
    [ "Tasks", no ]
  ]

  createNodeRow = (node) ->
    [
      node.healthy
      node.ip_port
      (moment new Date node.last_ping).fromNow()
      node.num_cpus
      format3f node.sys_load
      "#{prettyPrintBytes node.mem_value_size} / #{prettyPrintBytes node.total_value_size}"
      "#{Math.floor node.mem_value_size * 100 / node.total_value_size}%"
      "#{prettyPrintBytes node.free_mem} / #{prettyPrintBytes node.tot_mem} / #{prettyPrintBytes node.max_mem}"
      "#{prettyPrintBytes node.free_disk} / #{prettyPrintBytes node.max_disk}"
      "#{Math.floor node.free_disk * 100 / node.max_disk}%"
      node.pid
      node.num_keys
      node.tcps_active
      node.open_fds
      node.rpcs_active
      formatThreads node.fjthrds
      formatThreads node.fjqueue
    ]

  createTotalRow = (cloud) ->
    nodes = cloud.nodes
    [
      cloud.cloud_healthy 
      'TOTAL'
      '-'
      sum nodes, (node) -> node.num_cpus
      format3f sum nodes, (node) -> node.sys_load
      "#{prettyPrintBytes (sum nodes, (node) -> node.mem_value_size)} / #{prettyPrintBytes (sum nodes, (node) -> node.total_value_size)}"
      "#{Math.floor (avg nodes, (node) -> node.mem_value_size * 100 / node.total_value_size)}%"
      "#{prettyPrintBytes (sum nodes, (node) -> node.free_mem)} / #{prettyPrintBytes (sum nodes, (node) -> node.tot_mem)} / #{prettyPrintBytes (sum nodes, (node) -> node.max_mem)}"
      "#{prettyPrintBytes (sum nodes, (node) -> node.free_disk)} / #{prettyPrintBytes (sum nodes, (node) -> node.max_disk)}"
      "#{Math.floor (avg nodes, (node) -> node.free_disk * 100 / node.max_disk)}%"
      '-'
      sum nodes, (node) -> node.num_keys
      sum nodes, (node) -> node.tcps_active
      sum nodes, (node) -> node.open_fds
      sum nodes, (node) -> node.rpcs_active
      '-'
      '-'
    ]

  createGrid = (cloud, isExpanded) ->
    [ grid, table, thead, tbody, tr, th, td, success, danger] = Flow.HTML.template '.grid', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'i.fa.fa-check-circle.text-success', 'i.fa.fa-exclamation-circle.text-danger'
    nodeRows = map cloud.nodes, createNodeRow
    nodeRows.push createTotalRow cloud

    ths = for [ caption, showAlways ] in _headers when showAlways or isExpanded
      th caption

    trs = for row in nodeRows 
      tds = for cell, i in row when _headers[i][1] or isExpanded
        if i is 0
          td if cell then success() else danger()
        else
          td cell
      tr tds

    Flow.HTML.render 'div',
      grid [
        table [
          thead tr ths
          tbody trs
        ]
      ]

  updateCloud = (cloud, isExpanded) ->
    _name cloud.cloud_name
    _version cloud.version
    _hasConsensus cloud.consensus
    _uptime formatMilliseconds cloud.cloud_uptime_millis
    _nodeCounts "#{cloud.cloud_size - cloud.bad_nodes} / #{cloud.cloud_size}"
    _isLocked cloud.locked
    _isHealthy cloud.cloud_healthy
    _nodes createGrid cloud, isExpanded

  toggleRefresh = ->
    _isLive not _isLive()

  refresh = ->
    _isBusy yes
    _.requestCloud (error, cloud) ->
      _isBusy no
      if error
        _exception Flow.Failure _, new Flow.Error 'Error fetching cloud status', error
        _isLive no
      else
        updateCloud (_cloud = cloud), _isExpanded()
        delay refresh, 2000 if _isLive()

  act _isLive, (isLive) ->
    refresh() if isLive

  toggleExpansion = ->
    _isExpanded not _isExpanded()

  act _isExpanded, (isExpanded) ->
    updateCloud _cloud, isExpanded

  updateCloud _cloud, _isExpanded()

  defer _go

  name: _name
  size: _size
  uptime: _uptime
  version: _version
  nodeCounts: _nodeCounts
  hasConsensus: _hasConsensus
  isLocked: _isLocked
  isHealthy: _isHealthy
  nodes: _nodes
  isLive: _isLive
  isBusy: _isBusy
  toggleRefresh: toggleRefresh
  refresh: refresh
  isExpanded: _isExpanded
  toggleExpansion: toggleExpansion
  template: 'flow-cloud-output'

