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

  _frames = signals []
  _models = signals []
  _hasReconError = lift _selectedModel, (model) ->
    if model
      if model.algo is 'deeplearning'
        for parameter in model.parameters when parameter.name is 'autoencoder' and parameter.actual_value is yes
          return yes
    return no

  _hasLeafNodeAssignment = lift _selectedModel, (model) ->
    if model
      switch model.algo
        when 'gbm', 'drf'
          yes
        else
          no

  _hasExemplarIndex = lift _selectedModel, (model) ->
    if model
      switch model.algo
        when 'aggregator'
          yes
        else
          no

  _computeReconstructionError = signal no
  _computeDeepFeaturesHiddenLayer = signal no
  _computeLeafNodeAssignment = signal no
  _deepFeaturesHiddenLayer = signal 0
  _deepFeaturesHiddenLayerValue = lift _deepFeaturesHiddenLayer, (text) -> parseInt text, 10
  _exemplarIndex = signal 0
  _exemplarIndexValue = lift _exemplarIndex, (text) -> parseInt text, 10
  _canPredict = lift _selectedFrame, _selectedModel, _hasReconError, _hasLeafNodeAssignment, _computeReconstructionError, _computeDeepFeaturesHiddenLayer, _computeLeafNodeAssignment, _deepFeaturesHiddenLayerValue, _exemplarIndexValue (frame, model, hasReconError, computeReconstructionError, computeDeepFeaturesHiddenLayer, deepFeaturesHiddenLayerValue, _exemplarIndexValue) ->
    hasFrameAndModel = frame and model or _hasFrames and model or _hasModels and frame
    hasValidOptions = if hasReconError
      if computeReconstructionError
        yes
      else if computeDeepFeaturesHiddenLayer
        not isNaN deepFeaturesHiddenLayerValue
      else
        yes
    else
      yes

    hasFrameAndModel and hasValidOptions

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
        #TODO use models directly
        _models (model.model_id.name for model in models)

  unless _selectedModel()
    if opt.model and isString opt.model
      _.requestModel opt.model, (error, model) ->
        _selectedModel model

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
    cs = "predict model: #{stringify modelArg}, frame: #{stringify frameArg}"
    if destinationKey
      cs += ", predictions_frame: #{stringify destinationKey}"

    if _hasReconError()
      if _computeReconstructionError()
        cs += ', reconstruction_error: true'
      else if _computeDeepFeaturesHiddenLayer()
        cs += ", deep_features_hidden_layer: #{_deepFeaturesHiddenLayerValue()}"

    if _hasLeafNodeAssignment()
      if _computeLeafNodeAssignment()
        cs += ', leaf_node_assignment: true'

    if _hasExemplarIndex()
      if _computeExemplarIndex()
        cs += ', exemplar_index: #{_exemplarIndexValue()}

    _.insertAndExecuteCell 'cs', cs

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
  hasReconError: _hasReconError
  hasLeafNodeAssignment: _hasLeafNodeAssignment
  hasExemplarIndex: _hasExemplarIndex
  computeReconstructionError: _computeReconstructionError
  computeDeepFeaturesHiddenLayer: _computeDeepFeaturesHiddenLayer
  computeLeafNodeAssignment: _computeLeafNodeAssignment
  deepFeaturesHiddenLayer: _deepFeaturesHiddenLayer
  exemplarIndex: _exemplarIndex
  template: 'flow-predict-input'

