H2O.PredictInput = (_, modelKey, frameKey) ->
  _exception = signal null
  _frameKey = signal frameKey
  _hasFrame = if frameKey then yes else no
  _modelKey = signal modelKey
  _hasModel = if modelKey then yes else no
  _canPredict = lift _frameKey, _modelKey, (frameKey, modelKey) -> frameKey and modelKey

  _frames = signals []
  _models = signals []

  unless _hasFrame
    _.requestFrames (error, frames) ->
      if error
        _exception new Flow.Error 'Error fetching frame list.', error
      else
        _frames (frame.key.name for frame in frames)

  unless _hasModel
    _.requestModels (error, models) ->
      if error
        _exception new Flow.Error 'Error fetching model list.', error
      else
        _models (model.key for model in models)

  predict = ->
    _.insertAndExecuteCell 'cs', "predict #{stringify _modelKey()}, #{stringify _frameKey()}"

  exception: _exception
  hasModel: _hasModel
  hasFrame: _hasFrame
  canPredict: _canPredict
  frame: _frameKey
  model: _modelKey
  frames: _frames
  models: _models
  predict: predict
  template: 'flow-predict-input'

