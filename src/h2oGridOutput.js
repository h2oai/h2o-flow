import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oGridOutput(_, _go, _grid) {
  const lodash = window._;
  const Flow = window.Flow;
  let _isCheckingAll;
  const _modelViews = Flow.Dataflow.signal([]);
  const _hasModels = _grid.model_ids.length > 0;
  const _errorViews = Flow.Dataflow.signal([]);
  const _hasErrors = _grid.failure_details.length > 0;
  const _checkAllModels = Flow.Dataflow.signal(false);
  const _checkedModelCount = Flow.Dataflow.signal(0);
  const _canCompareModels = Flow.Dataflow.lift(_checkedModelCount, count => count > 1);
  const _hasSelectedModels = Flow.Dataflow.lift(_checkedModelCount, count => count > 0);
  _isCheckingAll = false;
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

  // allow a non-camelCase function parameter name for now
  // to avoid an error that breaks getModel
  const createModelView = model_id => { // eslint-disable-line
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
    const predict = () => _.insertAndExecuteCell('cs', `predict model: ${flowPrelude.stringify(model_id.name)}`);
    const cloneModel = () => // return _.insertAndExecuteCell('cs', `cloneModel ${flowPrelude.stringify(model_id.name)}`);
    alert('Not implemented');
    const view = () => _.insertAndExecuteCell('cs', `getModel ${flowPrelude.stringify(model_id.name)}`);
    const inspect = () => _.insertAndExecuteCell('cs', `inspect getModel ${flowPrelude.stringify(model_id.name)}`);
    return {
      key: model_id.name,
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
  const compareModels = () => _.insertAndExecuteCell('cs', `'inspect getModels ${flowPrelude.stringify(collectSelectedKeys())}`);
  const predictUsingModels = () => _.insertAndExecuteCell('cs', `predict models: ${flowPrelude.stringify(collectSelectedKeys())}`);
  const deleteModels = () => _.confirm('Are you sure you want to delete these models?', {
    acceptCaption: 'Delete Models',
    declineCaption: 'Cancel',
  }, accept => {
    if (accept) {
      return _.insertAndExecuteCell('cs', `deleteModels ${flowPrelude.stringify(collectSelectedKeys())}`);
    }
  });
  const inspect = () => {
    const summary = _.inspect('summary', _grid);
    return _.insertAndExecuteCell('cs', `grid inspect \'summary\', ${summary.metadata.origin}`);
  };
  const inspectHistory = () => {
    const history = _.inspect('scoring_history', _grid);
    return _.insertAndExecuteCell('cs', `grid inspect \'scoring_history\', ${history.metadata.origin}`);
  };
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
  const initialize = grid => {
    let i;
    _modelViews(lodash.map(grid.model_ids, createModelView));
    const errorViews = (() => {
      let _i;
      let _ref;
      const _results = [];
      for (i = _i = 0, _ref = grid.failure_details.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
        _results.push({
          title: `Error ${(i + 1)}`,
          detail: grid.failure_details[i],
          params: `Parameters: [ ${grid.failed_raw_params[i].join(', ')} ]`,
          stacktrace: grid.failure_stack_traces[i],
        });
      }
      return _results;
    })();
    _errorViews(errorViews);
    return lodash.defer(_go);
  };
  initialize(_grid);
  return {
    modelViews: _modelViews,
    hasModels: _hasModels,
    errorViews: _errorViews,
    hasErrors: _hasErrors,
    buildModel,
    compareModels,
    predictUsingModels,
    deleteModels,
    checkedModelCount: _checkedModelCount,
    canCompareModels: _canCompareModels,
    hasSelectedModels: _hasSelectedModels,
    checkAllModels: _checkAllModels,
    inspect,
    inspectHistory,
    inspectAll,
    template: 'flow-grid-output',
  };
}

