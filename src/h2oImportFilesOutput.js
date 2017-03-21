import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oImportFilesOutput(_, _go, _importResults) {
  const lodash = window._;
  const Flow = window.Flow;
  const _allFrames = lodash.flatten(lodash.compact(lodash.map(_importResults, result => result.destination_frames)));
  const _canParse = _allFrames.length > 0;
  const _title = `${_allFrames.length} / ${_importResults.length} files imported.`;
  const createImportView = result => ({
    // TODO dels?
    // TODO fails?
    files: result.files,
    template: 'flow-import-file-output',
  });
  const _importViews = lodash.map(_importResults, createImportView);
  const parse = () => {
    const paths = lodash.map(_allFrames, flowPrelude.stringify);
    return _.insertAndExecuteCell('cs', `setupParse source_frames: [ ${paths.join(',')} ]`);
  };
  lodash.defer(_go);
  return {
    title: _title,
    importViews: _importViews,
    canParse: _canParse,
    parse,
    template: 'flow-import-files-output',
    templateOf(view) {
      return view.template;
    },
  };
}

