import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oModelsOutput(_, _go, _models) {
  const lodash = window._;
  const Flow = window.Flow;
  const _modelViews = Flow.Dataflow.signal([]);
  const _checkAllModels = Flow.Dataflow.signal(false);
  const _checkedModelCount = Flow.Dataflow.signal(0);
  const _canCompareModels = Flow.Dataflow.lift(_checkedModelCount, count => count > 1);
  const _hasSelectedModels = Flow.Dataflow.lift(_checkedModelCount, count => count > 0);
  let _isCheckingAll = false;
  Flow.Dataflow.react(_checkAllModels, checkAll => {
    let view;
    let _i;
    let _len;
    _isCheckingAll = true;
    const views = _modelViews();
    for (_i = 0, _len = views.length; _i < _len; _i++) {
      view = views[_i];
      view.isChecked(checkAll);
    }
    _checkedModelCount(checkAll ? views.length : 0);
    _isCheckingAll = false;
  });
  const createModelView = model => {
    const _isChecked = Flow.Dataflow.signal(false);
    Flow.Dataflow.react(_isChecked, () => {
      let view;
      if (_isCheckingAll) {
        return;
      }
      const checkedViews = (() => {
        let _i;
        let _len;
        const _ref = _modelViews();
        const _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (view.isChecked()) {
            _results.push(view);
          }
        }
        return _results;
      })();
      return _checkedModelCount(checkedViews.length);
    });
    const predict = () => _.insertAndExecuteCell('cs', `predict model: ${flowPrelude.stringify(model.model_id.name)}`);
    const cloneModel = () => // return _.insertAndExecuteCell('cs', `cloneModel ${flowPrelude.stringify(model.model_id.name)}`);
    alert('Not implemented');
    const view = () => _.insertAndExecuteCell('cs', `getModel ${flowPrelude.stringify(model.model_id.name)}`);
    const inspect = () => _.insertAndExecuteCell('cs', `inspect getModel ${flowPrelude.stringify(model.model_id.name)}`);
    return {
      key: model.model_id.name,
      algo: model.algo_full_name,
      isChecked: _isChecked,
      predict,
      clone: cloneModel,
      inspect,
      view,
    };
  };
  const buildModel = () => _.insertAndExecuteCell('cs', 'buildModel');
  const collectSelectedKeys = () => {
    let view;
    let _i;
    let _len;
    const _ref = _modelViews();
    const _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      view = _ref[_i];
      if (view.isChecked()) {
        _results.push(view.key);
      }
    }
    return _results;
  };
  const compareModels = () => _.insertAndExecuteCell('cs', `inspect getModels ${flowPrelude.stringify(collectSelectedKeys())}`);
  const predictUsingModels = () => _.insertAndExecuteCell('cs', `predict models: ${flowPrelude.stringify(collectSelectedKeys())}`);
  const deleteModels = () => _.confirm('Are you sure you want to delete these models?', {
    acceptCaption: 'Delete Models',
    declineCaption: 'Cancel',
  }, accept => {
    if (accept) {
      return _.insertAndExecuteCell('cs', `deleteModels ${flowPrelude.stringify(collectSelectedKeys())}`);
    }
  });
  const inspectAll = () => {
    let view;
    const allKeys = (() => {
      let _i;
      let _len;
      const _ref = _modelViews();
      const _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        _results.push(view.key);
      }
      return _results;
    })();
    // TODO use table origin
    return _.insertAndExecuteCell('cs', `inspect getModels ${flowPrelude.stringify(allKeys)}`);
  };
  const initialize = models => {
    _modelViews(lodash.map(models, createModelView));
    return lodash.defer(_go);
  };
  initialize(_models);
  return {
    modelViews: _modelViews,
    hasModels: _models.length > 0,
    buildModel,
    compareModels,
    predictUsingModels,
    deleteModels,
    checkedModelCount: _checkedModelCount,
    canCompareModels: _canCompareModels,
    hasSelectedModels: _hasSelectedModels,
    checkAllModels: _checkAllModels,
    inspect: inspectAll,
    template: 'flow-models-output',
  };
}

