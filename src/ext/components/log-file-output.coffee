H2O.LogFileOutput = (_, _cloud, _nodeIndex, _fileType, _logFile) ->
  _exception = signal null #TODO Display in .jade

  _contents = signal ''
  _nodes = signal []
  _activeNode = signal null
  _fileTypes = signal ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'stdout', 'stderr']
  _activeFileType = signal null

  createNode = (node, index) ->
    name: node.ip_port
    index: index

  initialize = (cloud, nodeIndex, fileType, logFile) ->
    _activeFileType fileType
    _contents logFile.log
    _nodes nodes = (createNode node, i for node, i in cloud.nodes)
    _activeNode nodes[nodeIndex] if nodeIndex < nodes.length

    react _activeNode, _activeFileType, (node, fileType) ->
      if node
        _.requestLogFile node.index, fileType, (error, logFile) ->
          if error
            _contents "Error fetching log file: #{error.message}"
          else
            _contents logFile.log
      else
        _contents ''

  initialize _cloud, _nodeIndex, _fileType, _logFile

  nodes: _nodes
  activeNode: _activeNode
  fileTypes: _fileTypes
  activeFileType: _activeFileType
  contents: _contents  
  template: 'flow-log-file-output'
