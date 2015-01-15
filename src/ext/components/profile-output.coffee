H2O.ProfileOutput = (_, _profile) ->
  _activeNode = signal null

  createNode = (index, counts, stackTraces) ->
    display = -> _activeNode self

    entries = for stackTrace, i in stackTraces
      stackTrace: stackTrace
      count: "Count: #{counts[i]}"

    self =
      name: "Node #{index}"
      entries: entries 
      display: display

  _nodes = for stackTraces, i in _profile.stacktraces
    createNode i, _profile.counts[i], stackTraces

  _activeNode head _nodes

  nodes: _nodes
  activeNode: _activeNode
  template: 'flow-profile-output'
