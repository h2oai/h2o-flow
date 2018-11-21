{ defer, head } = require('lodash')

{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _profile) ->
  _activeNode = signal null

  createNode = (node) ->
    display = -> _activeNode self

    entries = for entry in node.entries
      stacktrace: entry.stacktrace
      caption: "Count: #{entry.count}"

    self =
      name: node.node_name
      caption: "#{node.node_name} at #{new Date node.timestamp}"
      entries: entries 
      display: display

  _nodes = for node, i in _profile.nodes
    createNode node

  _activeNode head _nodes

  defer _go

  nodes: _nodes
  activeNode: _activeNode
  template: 'flow-profile-output'
