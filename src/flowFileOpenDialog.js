import { getObjectExistsRequest } from './h2oProxy/getObjectExistsRequest';
import { postUploadObjectRequest } from './h2oProxy/postUploadObjectRequest';
import { validateFileExtension } from './utils/validateFileExtension';
import { getFileBaseName } from './utils/getFileBaseName';

export function flowFileOpenDialog(_, _go) {
  const Flow = window.Flow;
  const H2O = window.H2O;
  const _overwrite = Flow.Dataflow.signal(false);
  const _form = Flow.Dataflow.signal(null);
  const _file = Flow.Dataflow.signal(null);
  const _canAccept = Flow.Dataflow.lift(_file, file => {
    if (file != null ? file.name : void 0) {
      return validateFileExtension(file.name, '.flow');
    }
    return false;
  });
  const checkIfNameIsInUse = (name, go) => getObjectExistsRequest(_, 'notebook', name, (error, exists) => go(exists));
  const uploadFile = basename => postUploadObjectRequest(_, 'notebook', basename, new FormData(_form()), (error, filename) => _go({
    error,
    filename,
  }));
  const accept = () => {
    let basename;
    const file = _file();
    if (file) {
      basename = getFileBaseName(file.name, '.flow');
      if (_overwrite()) {
        return uploadFile(basename);
      }
      return checkIfNameIsInUse(basename, isNameInUse => {
        if (isNameInUse) {
          return _overwrite(true);
        }
        return uploadFile(basename);
      });
    }
  };
  const decline = () => _go(null);
  return {
    form: _form,
    file: _file,
    overwrite: _overwrite,
    canAccept: _canAccept,
    accept,
    decline,
    template: 'file-open-dialog',
  };
}

