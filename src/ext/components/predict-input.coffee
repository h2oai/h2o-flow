H2O.PredictInput = (_, _go, opt) ->
  _destinationKey = signal opt.predictions_frame ? "prediction-#{Flow.Util.uuid()}"

  _selectedModels = if opt.models
    opt.models
  else
    if opt.model
      [ opt.model ]
    else
      []

  _selectedFrames = if opt.frames
    opt.frames
  else
    if opt.frame
      [ opt.frame ]
    else
      []

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
        _frames (frame.frame_id.name for frame in frames when not frame.is_text)

  unless _hasModels
    _.requestModels (error, models) ->
      if error
        _exception new Flow.Error 'Error fetching model list.', error
      else
        _models (model.model_id.name for model in models)

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

    destinationKey = _destinationKey()
    if destinationKey
      _.insertAndExecuteCell 'cs', "predict model: #{stringify modelArg}, frame: #{stringify frameArg}, predictions_frame: #{stringify destinationKey}"
    else
      _.insertAndExecuteCell 'cs', "predict model: #{stringify modelArg}, frame: #{stringify frameArg}"

  defer _go

  destinationKey: _destinationKey
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

