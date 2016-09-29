H2O.PartialDependenceOutput = (_, _go, _partialDependenceResult) ->

  _destinationKey = _partialDependenceResult.dest.name

  _viewFrame = ->
    _.insertAndExecuteCell 'cs', "requestPartialDependenceData #{stringify _destinationKey}"

  defer _go

  _destinationKey: _destinationKey
  viewFrame: _viewFrame
  template: 'flow-partial-dependence-output'

