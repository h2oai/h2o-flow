H2O.PredictInput = (_, _go, _modelArg, _frameArg) ->
  _selectedModels = if _modelArg then (if isArray _modelArg then _modelArg else [ _modelArg ]) else []
  _selectedFrames = if _frameArg then (if isArray _frameArg then _frameArg else [ _frameArg ]) else []

  _selectedModelsCaption = join _selectedModels, ', '
  _selectedFramesCaption = join _selectedFrames, ', '
  _exception = signal null
  _selectedFrame = signal null
  _selectedModel = signal null
  _hasFrames = if _selectedFrames.length then yes else no
  _hasModels = if _selectedModels.length then yes else no
  _canPredict = lift _selectedFrame, _selectedModel, (frame, model) ->
    frame and model or _hasFrames and model or _hasModels and frame

  _frames = signals []
  _models = signals []

  unless _hasFrames
    _.requestFrames (error, frames) ->
      if error
        _exception new Flow.Error 'Error fetching frame list.', error
      else
        _frames (frame.key.name for frame in frames)

  unless _hasModels
    _.requestModels (error, models) ->
      if error
        _exception new Flow.Error 'Error fetching model list.', error
      else
        _models (model.key.name for model in models)

  predict = ->
    if _hasFrames
      frameArg = if _selectedFrames.length > 1 then _selectedFrames else head _selectedFrames
      modelArg = _selectedModel()
    else if _hasModels
      modelArg = if _selectedModels.length > 1 then _selectedModels else head _selectedModels
      frameArg = _selectedFrame()
    else
      modelArg = _selectedModel()
      frameArg = _selectedFrame()

    _.insertAndExecuteCell 'cs', "predict #{stringify modelArg}, #{stringify frameArg}"

  defer _go

  exception: _exception
  hasModels: _hasModels
  hasFrames: _hasFrames
  canPredict: _canPredict
  selectedFramesCaption: _selectedFramesCaption
  selectedModelsCaption: _selectedModelsCaption
  selectedFrame: _selectedFrame
  selectedModel: _selectedModel
  frames: _frames
  models: _models
  predict: predict
  template: 'flow-predict-input'

