import { getModelRequest } from './h2oProxy/getModelRequest';
import { getModelsRequest } from './h2oProxy/getModelsRequest';
import { uuid } from './utils/uuid';

import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oPredictInput(_, _go, opt) {
  const lodash = window._;
  const Flow = window.Flow;
  const _ref = opt.predictions_frame;
  const _destinationKey = Flow.Dataflow.signal(_ref != null ? _ref : `prediction-${uuid()}`);
  const _selectedModels = opt.models ? opt.models : opt.model ? [opt.model] : [];
  const _selectedFrames = opt.frames ? opt.frames : opt.frame ? [opt.frame] : [];
  const _selectedModelsCaption = _selectedModels.join(', ');
  const _selectedFramesCaption = _selectedFrames.join(', ');
  const _exception = Flow.Dataflow.signal(null);
  const _selectedFrame = Flow.Dataflow.signal(null);
  const _selectedModel = Flow.Dataflow.signal(null);
  const _hasFrames = _selectedFrames.length;
  const _hasModels = _selectedModels.length;
  const _frames = Flow.Dataflow.signals([]);
  const _models = Flow.Dataflow.signals([]);
  const _isDeepLearning = Flow.Dataflow.lift(_selectedModel, model => model && model.algo === 'deeplearning');
  const _hasReconError = Flow.Dataflow.lift(_selectedModel, model => {
    let parameter;
    let _i;
    let _len;
    let _ref1;
    if (model) {
      if (model.algo === 'deeplearning') {
        _ref1 = model.parameters;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          parameter = _ref1[_i];
          if (parameter.name === 'autoencoder' && parameter.actual_value === true) {
            return true;
          }
        }
      }
    }
    return false;
  });
  const _hasLeafNodeAssignment = Flow.Dataflow.lift(_selectedModel, model => {
    if (model) {
      switch (model.algo) {
        case 'gbm':
        case 'drf':
          return true;
        default:
          return false;
      }
    }
  });
  const _hasExemplarIndex = Flow.Dataflow.lift(_selectedModel, model => {
    if (model) {
      switch (model.algo) {
        case 'aggregator':
          return true;
        default:
          return false;
      }
    }
  });
  const _computeReconstructionError = Flow.Dataflow.signal(false);
  const _computeDeepFeaturesHiddenLayer = Flow.Dataflow.signal(false);
  const _computeLeafNodeAssignment = Flow.Dataflow.signal(false);
  const _deepFeaturesHiddenLayer = Flow.Dataflow.signal(0);
  const _deepFeaturesHiddenLayerValue = Flow.Dataflow.lift(_deepFeaturesHiddenLayer, text => parseInt(text, 10));
  const _exemplarIndex = Flow.Dataflow.signal(0);
  const _exemplarIndexValue = Flow.Dataflow.lift(_exemplarIndex, text => parseInt(text, 10));
  const _canPredict = Flow.Dataflow.lift(_selectedFrame, _selectedModel, _hasReconError, _computeReconstructionError, _computeDeepFeaturesHiddenLayer, _deepFeaturesHiddenLayerValue, _exemplarIndexValue, _hasExemplarIndex, (
    frame,
    model,
    hasReconError,
    computeReconstructionError,
    computeDeepFeaturesHiddenLayer,
    deepFeaturesHiddenLayerValue,
    exemplarIndexValue,
    hasExemplarIndex
  ) => {
    const hasFrameAndModel = frame && model || _hasFrames && model || _hasModels && frame || _hasModels && hasExemplarIndex;
    const hasValidOptions = hasReconError ? computeReconstructionError ? true : computeDeepFeaturesHiddenLayer ? !lodash.isNaN(deepFeaturesHiddenLayerValue) : true : true;
    return hasFrameAndModel && hasValidOptions;
  });
  if (!_hasFrames) {
    _.requestFrames(_, (error, frames) => {
      let frame;
      if (error) {
        return _exception(new Flow.Error('Error fetching frame list.', error));
      }
      return _frames((() => {
        let _i;
        let _len;
        const _results = [];
        for (_i = 0, _len = frames.length; _i < _len; _i++) {
          frame = frames[_i];
          if (!frame.is_text) {
            _results.push(frame.frame_id.name);
          }
        }
        return _results;
      })());
    });
  }
  if (!_hasModels) {
    getModelsRequest(_, (error, models) => {
      let model;
      if (error) {
        return _exception(new Flow.Error('Error fetching model list.', error));
      }
      return _models((() => {
        let _i;
        let _len;
        const _results = [];
        // TODO use models directly
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          model = models[_i];
          _results.push(model.model_id.name);
        }
        return _results;
      })());
    });
  }
  if (!_selectedModel()) {
    if (opt.model && lodash.isString(opt.model)) {
      getModelRequest(_, opt.model, (error, model) => _selectedModel(model));
    }
  }
  const predict = () => {
    let cs;
    let frameArg;
    let modelArg;
    if (_hasFrames) {
      frameArg = _selectedFrames.length > 1 ? _selectedFrames : lodash.head(_selectedFrames);
      modelArg = _selectedModel();
    } else if (_hasModels) {
      modelArg = _selectedModels.length > 1 ? _selectedModels : lodash.head(_selectedModels);
      frameArg = _selectedFrame();
    } else {
      modelArg = _selectedModel();
      frameArg = _selectedFrame();
    }
    const destinationKey = _destinationKey();
    cs = `predict model: ${flowPrelude.stringify(modelArg)}, frame: ${flowPrelude.stringify(frameArg)}`;
    if (destinationKey) {
      cs += `, predictions_frame: ${flowPrelude.stringify(destinationKey)}`;
    }
    if (_hasReconError()) {
      if (_computeReconstructionError()) {
        cs += ', reconstruction_error: true';
      }
    }
    if (_computeDeepFeaturesHiddenLayer()) {
      cs += `, deep_features_hidden_layer: ${_deepFeaturesHiddenLayerValue()}`;
    }
    if (_hasLeafNodeAssignment()) {
      if (_computeLeafNodeAssignment()) {
        cs += ', leaf_node_assignment: true';
      }
    }
    if (_hasExemplarIndex()) {
      cs += `, exemplar_index: ${_exemplarIndexValue()}`;
    }
    return _.insertAndExecuteCell('cs', cs);
  };
  lodash.defer(_go);
  return {
    destinationKey: _destinationKey,
    exception: _exception,
    hasModels: _hasModels,
    hasFrames: _hasFrames,
    canPredict: _canPredict,
    selectedFramesCaption: _selectedFramesCaption,
    selectedModelsCaption: _selectedModelsCaption,
    selectedFrame: _selectedFrame,
    selectedModel: _selectedModel,
    frames: _frames,
    models: _models,
    predict,
    isDeepLearning: _isDeepLearning,
    hasReconError: _hasReconError,
    hasLeafNodeAssignment: _hasLeafNodeAssignment,
    hasExemplarIndex: _hasExemplarIndex,
    computeReconstructionError: _computeReconstructionError,
    computeDeepFeaturesHiddenLayer: _computeDeepFeaturesHiddenLayer,
    computeLeafNodeAssignment: _computeLeafNodeAssignment,
    deepFeaturesHiddenLayer: _deepFeaturesHiddenLayer,
    exemplarIndex: _exemplarIndex,
    template: 'flow-predict-input',
  };
}

