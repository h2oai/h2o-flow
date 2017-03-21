import { describeCount } from './utils/describeCount';

import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oImportFilesInput(_, _go) {
  //
  // Search files/directories
  //
  const lodash = window._;
  const Flow = window.Flow;
  const _specifiedPath = Flow.Dataflow.signal('');
  const _exception = Flow.Dataflow.signal('');
  const _hasErrorMessage = Flow.Dataflow.lift(_exception, exception => {
    if (exception) {
      return true;
    }
    return false;
  });
  const tryImportFiles = () => {
    const specifiedPath = _specifiedPath();
    return _.requestFileGlob(_, specifiedPath, -1, (error, result) => {
      if (error) {
        return _exception(error.stack);
      }
      _exception('');
      // _go 'confirm', result
      return processImportResult(result);
    });
  };

  //
  // File selection
  //
  const _importedFiles = Flow.Dataflow.signals([]);
  const _importedFileCount = Flow.Dataflow.lift(_importedFiles, files => {
    if (files.length) {
      return `Found ${describeCount(files.length, 'file')}:`;
    }
    return '';
  });
  const _hasImportedFiles = Flow.Dataflow.lift(_importedFiles, files => files.length > 0);
  const _hasUnselectedFiles = Flow.Dataflow.lift(_importedFiles, files => lodash.some(files, file => !file.isSelected()));
  const _selectedFiles = Flow.Dataflow.signals([]);
  const _selectedFilesDictionary = Flow.Dataflow.lift(_selectedFiles, files => {
    let file;
    let _i;
    let _len;
    const dictionary = {};
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      dictionary[file.path] = true;
    }
    return dictionary;
  });
  const _selectedFileCount = Flow.Dataflow.lift(_selectedFiles, files => {
    if (files.length) {
      return `${describeCount(files.length, 'file')} selected:`;
    }
    return '(No files selected)';
  });
  const _hasSelectedFiles = Flow.Dataflow.lift(_selectedFiles, files => files.length > 0);
  const importFiles = files => {
    const paths = lodash.map(files, file => flowPrelude.stringify(file.path));
    return _.insertAndExecuteCell('cs', `importFiles [ ${paths.join(',')} ]`);
  };
  const importSelectedFiles = () => importFiles(_selectedFiles());
  const createSelectedFileItem = path => {
    const self = {
      path,
      deselect() {
        let file;
        let _i;
        let _len;
        _selectedFiles.remove(self);
        const _ref = _importedFiles();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          if (file.path === path) {
            file.isSelected(false);
          }
        }
      },
    };
    return self;
  };
  const createFileItem = (path, isSelected) => {
    const self = {
      path,
      isSelected: Flow.Dataflow.signal(isSelected),
      select() {
        _selectedFiles.push(createSelectedFileItem(self.path));
        return self.isSelected(true);
      },
    };
    Flow.Dataflow.act(self.isSelected, isSelected => _hasUnselectedFiles(lodash.some(_importedFiles(), file => !file.isSelected())));
    return self;
  };
  const createFileItems = result => lodash.map(result.matches, path => createFileItem(path, _selectedFilesDictionary()[path]));
  const listPathHints = (query, process) => _.requestFileGlob(_, query, 10, (error, result) => {
    if (!error) {
      return process(lodash.map(result.matches, value => ({
        value,
      })));
    }
  });
  const selectAllFiles = () => {
    let file;
    let _i;
    let _j;
    let _len;
    let _len1;
    const dict = {};
    const _ref = _selectedFiles();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      file = _ref[_i];
      dict[file.path] = true;
    }
    const _ref1 = _importedFiles();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      file = _ref1[_j];
      if (!dict[file.path]) {
        file.select();
      }
    }
  };
  const deselectAllFiles = () => {
    let file;
    let _i;
    let _len;
    _selectedFiles([]);
    const _ref = _importedFiles();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      file = _ref[_i];
      file.isSelected(false);
    }
  };
  function processImportResult(result) {
    const files = createFileItems(result);
    return _importedFiles(files);
  }
  lodash.defer(_go);
  return {
    specifiedPath: _specifiedPath,
    hasErrorMessage: _hasErrorMessage, // XXX obsolete
    exception: _exception,
    tryImportFiles,
    listPathHints: lodash.throttle(listPathHints, 100),
    hasImportedFiles: _hasImportedFiles,
    importedFiles: _importedFiles,
    importedFileCount: _importedFileCount,
    selectedFiles: _selectedFiles,
    selectAllFiles,
    deselectAllFiles,
    hasUnselectedFiles: _hasUnselectedFiles,
    hasSelectedFiles: _hasSelectedFiles,
    selectedFileCount: _selectedFileCount,
    importSelectedFiles,
    template: 'flow-import-files',
  };
}

