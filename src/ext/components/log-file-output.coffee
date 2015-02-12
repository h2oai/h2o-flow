H2O.LogFileOutput = (_, _nodeIndex, _fileType, _logFile) ->
  _exception = signal null #TODO Display in .jade

  _contents = signal ''
  _activeNode = signal null
  _activeFileType = signal _fileType ? "debug"
  _nodes = signal []
  _fileTypes = signal ["trace", "debug", "info", "warn", "error", "fatal", "stdout", "stderr"]

  createNode = (node, index) ->
    name: node.ip_port
    index: index

  initialize = (nodeIndex, fileType, logFile) ->
    _contents logFile.log
    _.requestCloud (error, cloud) ->
      unless error
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

  initialize _nodeIndex, _fileType, _logFile

  nodes: _nodes
  activeNode: _activeNode
  fileTypes: _fileTypes
  activeFileType: _activeFileType
  contents: _contents  
  template: 'flow-log-file-output'
