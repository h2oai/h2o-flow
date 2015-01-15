H2O.LogFileOutput = (_, _nodeIndex, _logFile) ->
  _exception = signal null #TODO Display in .jade

  _contents = signal ''
  _activeNode = signal null
  _nodes = signal []

  createNode = (node, index) ->
    name: node.h2o.node
    index: index

  initialize = (nodeIndex, logFile) ->
    _contents logFile.log
    _.requestCloud (error, cloud) ->
      unless error
        _nodes nodes = (createNode node, i for node, i in cloud.nodes)
        _activeNode nodes[nodeIndex] if nodeIndex < nodes.length

        react _activeNode, (node) ->
          if node
            _.requestLogFile node.index, (error, logFile) ->
              if error
                _contents "Error fetching log file: #{error.message}"
              else
                _contents logFile.log
          else
            _contents ''

  initialize _nodeIndex, _logFile

  nodes: _nodes
  activeNode: _activeNode
  contents: _contents  
  template: 'flow-log-file-output'
