H2O.PredictsOutput = (_, modelKey, frameKey, predictions) ->
  
  _predictionTable = _.inspect 'predictions', predictions

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect #{_predictionTable.meta.origin}"
  
  predictionTable: _predictionTable
  inspect: inspect
  template: 'flow-predicts-output'

