import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oImportModelInput(_, _go, path, opt) {
  const lodash = window._;
  const Flow = window.Flow;
  if (opt == null) {
    opt = {};
  }
  const _path = Flow.Dataflow.signal(path);
  const _overwrite = Flow.Dataflow.signal(opt.overwrite);
  const _canImportModel = Flow.Dataflow.lift(_path, path => path && path.length);
  const importModel = () => _.insertAndExecuteCell('cs', `importModel ${flowPrelude.stringify(_path())}, overwrite: ${(_overwrite() ? 'true' : 'false')}`);
  lodash.defer(_go);
  return {
    path: _path,
    overwrite: _overwrite,
    canImportModel: _canImportModel,
    importModel,
    template: 'flow-import-model-input',
  };
}
