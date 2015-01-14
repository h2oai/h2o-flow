H2O.CloudOutput = (_, _cloud) ->
  _isLive = signal no
  _isBusy = signal no

  _name = do signal
  _size = do signal
  _uptime = do signal
  _version = do signal
  _nodeCount = do signal
  _badNodeCount = do signal
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
    
  createNode = (node) ->
    isHealthy: node.healthy
    name: node.h2o.node
    ping: (moment new Date node.last_ping).fromNow()
    cores: node.num_cpus
    keys: node.num_keys
    tcps: node.tcps_active
    fds: if node.open_fds < 0 then '-' else node.open_fds
    loadProgress: "#{Math.ceil node.sys_load}%"
    load: format3f node.sys_load
    dataProgress: "#{Math.ceil node.mem_value_size / node.total_value_size * 100}%"
    data: "#{prettyPrintBytes node.mem_value_size} / #{prettyPrintBytes node.total_value_size}"
    cachedData: if node.total_value_size is 0 then '-' else "#{Math.floor node.mem_value_size * 100 / node.total_value_size}%"
    memoryProgress1: "#{Math.ceil (node.tot_mem - node.free_mem) / node.max_mem * 100}%"
    memoryProgress2: "#{Math.ceil node.free_mem / node.max_mem * 100}%"
    memory: "#{prettyPrintBytes node.free_mem} / #{prettyPrintBytes node.tot_mem} / #{prettyPrintBytes node.max_mem}"
    diskProgress: "#{Math.ceil (node.max_disk - node.free_disk) / node.max_disk * 100}%"
    disk: "#{prettyPrintBytes node.free_disk} / #{prettyPrintBytes node.max_disk}"
    freeDisk: if node.max_disk is 0 then '' else "#{Math.floor node.free_disk * 100 / node.max_disk}%"
    rpcs: node.rpcs_active
    threads: formatThreads node.fjthrds
    tasks: formatThreads node.fjqueue
    pid: node.pid

  updateCloud = (cloud) ->
    _name cloud.cloud_name

    _version cloud.version
    _hasConsensus cloud.consensus

    _uptime formatMilliseconds cloud.cloud_uptime_millis

    _size cloud.cloud_size
    _badNodeCount cloud.bad_nodes
    _isLocked cloud.locked
    _isHealthy cloud.cloud_healthy

    _nodes map cloud.nodes, createNode

  toggleRefresh = ->
    _isLive not _isLive()

  refresh = ->
    _isBusy yes
    _.requestCloud (error, cloud) ->
      _isBusy no
      if error
        _exception Flow.Failure new Flow.Error 'Error fetching cloud status', error
        _isLive no
      else
        updateCloud cloud
        delay refresh, 2000 if _isLive()

  act _isLive, (isLive) ->
    refresh() if isLive

  updateCloud _cloud 

  name: _name
  size: _size
  uptime: _uptime
  version: _version
  nodeCount: _nodeCount
  badNodeCount: _badNodeCount
  hasConsensus: _hasConsensus
  isLocked: _isLocked
  isHealthy: _isHealthy
  nodes: _nodes
  isLive: _isLive
  isBusy: _isBusy
  toggleRefresh: toggleRefresh
  refresh: refresh
  template: 'flow-cloud-output'

