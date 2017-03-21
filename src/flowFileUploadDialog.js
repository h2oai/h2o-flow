import { postUploadFileRequest } from './h2oProxy/postUploadFileRequest';

export function flowFileUploadDialog(_, _go) {
  const Flow = window.Flow;
  const _form = Flow.Dataflow.signal(null);
  const _file = Flow.Dataflow.signal(null);
  const uploadFile = key => postUploadFileRequest(_, key, new FormData(_form()), (error, result) => _go({
    error,
    result,
  }));
  const accept = () => {
    const file = _file();
    if (file) {
      return uploadFile(file.name);
    }
  };
  const decline = () => _go(null);
  return {
    form: _form,
    file: _file,
    accept,
    decline,
    template: 'file-upload-dialog',
  };
}

