H2O.PartialDependenceOutput = (_, _go, _result) ->

  _destinationKey = _result.destination_key
  _modelId = _result.model_id.name
  _frameId = _result.frame_id.name

  _partialDependencePlots = map _result.partial_dependence_data, (item) ->
  	description: item.columns[0].description
  	plot: item.data
  	table: item.data

  # _partialDependenceData = _result.partial_dependence_data

  _viewFrame = ->
    _.insertAndExecuteCell 'cs', "requestPartialDependenceData #{stringify _destinationKey}"

  defer _go

  destinationKey: _destinationKey
  modelId: _modelId
  frameId: _frameId
  partialDependencePlots: _partialDependencePlots
  viewFrame: _viewFrame
  template: 'flow-partial-dependence-output'

