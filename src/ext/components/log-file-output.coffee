{ defer } = require('lodash')

{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _cloud, _nodeIpPort, _fileType, _logFile) ->
  _exception = signal null #TODO Display in .pug.

  _contents = signal ''
  _nodes = signal []
  _activeNode = signal null
  _fileTypes = signal ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'httpd', 'stdout', 'stderr']
  _activeFileType = signal null

  createNode = (node, index) ->
    name: node.ip_port
    index: index

  refreshActiveView = (node, fileType) ->
    if node
      _.requestLogFile node.name, fileType, (error, logFile) ->
        if error
          _contents "Error fetching log file: #{error.message}"
        else
          _contents logFile.log
    else
      _contents ''

  refresh = ->
    refreshActiveView _activeNode(), _activeFileType()

  initialize = (cloud, nodeIpPort, fileType, logFile) ->
    _activeFileType fileType
    _contents logFile.log
    nodes = []
    if cloud.is_client
      clientNode = ip_port: "self"
      NODE_INDEX_SELF = -1
      nodes.push createNode(clientNode, NODE_INDEX_SELF)
    for n, i in cloud.nodes
      nodes.push createNode(n, i)
    _nodes nodes
    _activeNode (n for n in nodes when n.name is nodeIpPort)[0]
    react _activeNode, _activeFileType, refreshActiveView
    defer _go

  initialize _cloud, _nodeIpPort, _fileType, _logFile

  nodes: _nodes
  activeNode: _activeNode
  fileTypes: _fileTypes
  activeFileType: _activeFileType
  contents: _contents  
  refresh: refresh
  template: 'flow-log-file-output'
