{ defer, tail, head} = require('lodash')

{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _stackTrace) ->
  _activeNode = signal null

  createThread = (thread) ->
    lines = thread.split '\n'

    title: head lines
    stackTrace: (tail lines).join '\n'

  createNode = (node) ->
    display = -> _activeNode self

    self =
      name: node.node
      timestamp: new Date node.time
      threads: (createThread thread for thread in node.thread_traces)
      display: display

  _nodes = for node in _stackTrace.traces
    createNode node 

  _activeNode head _nodes

  defer _go

  nodes: _nodes
  activeNode: _activeNode
  template: 'flow-stacktrace-output'

