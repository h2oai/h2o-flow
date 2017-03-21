import { populateFramesAndColumns } from './populateFramesAndColumns';
import { h2oModelBuilderForm } from './h2oModelBuilderForm/h2oModelBuilderForm';
import { requestModelBuilders } from '../h2oProxy/requestModelBuilders';
import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oModelInput(_, _go, _algo, _opts) {
  const lodash = window._;
  const Flow = window.Flow;
  const H2O = window.H2O;
  const _exception = Flow.Dataflow.signal(null);
  const _algorithms = Flow.Dataflow.signal([]);
  const _algorithm = Flow.Dataflow.signal(null);
  const _canCreateModel = Flow.Dataflow.lift(_algorithm, algorithm => {
    if (algorithm) {
      return true;
    }
    return false;
  });
  const _modelForm = Flow.Dataflow.signal(null);
  ((() => requestModelBuilders(_, (error, modelBuilders) => {
    _algorithms(modelBuilders);
    _algorithm(_algo ? lodash.find(modelBuilders, builder => builder.algo === _algo) : void 0);
    const frameKey = _opts != null ? _opts.training_frame : void 0;
    return Flow.Dataflow.act(_algorithm, builder => {
      let algorithm;
      let parameters;
      if (builder) {
        algorithm = builder.algo;
        parameters = flowPrelude.deepClone(builder.parameters);
        return populateFramesAndColumns(_, frameKey, algorithm, parameters, () => _modelForm(h2oModelBuilderForm(_, algorithm, parameters)));
      }
      return _modelForm(null);
    });
  }))());
  const createModel = () => _modelForm().createModel();
  lodash.defer(_go);
  return {
    parentException: _exception, // XXX hacky
    algorithms: _algorithms,
    algorithm: _algorithm,
    modelForm: _modelForm,
    canCreateModel: _canCreateModel,
    createModel,
    template: 'flow-model-input',
  };
}
