H2O.StackTraceOutput = (_, _stackTrace) ->
  _activeNode = signal null

  createThread = (thread) ->
    lines = split thread, '\n'

    title: head lines
    stackTrace: join (tail lines), '\n'

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

  nodes: _nodes
  activeNode: _activeNode
  template: 'flow-stacktrace-output'

