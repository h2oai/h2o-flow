H2O.ProfileOutput = (_, _profile) ->
  _activeNode = signal null

  createNode = (index, count, stackTrace) ->
    display = -> _activeNode self

    self =
      name: "Node #{index}"
      caption: "Node #{index} (Count: #{count})"
      stackTrace: stackTrace
      display: display

  _nodes = for stackTrace, i in _profile.stacktraces
    createNode i, _profile.counts[i], stackTrace 

  _activeNode head _nodes

  nodes: _nodes
  activeNode: _activeNode
  template: 'flow-profile-output'
