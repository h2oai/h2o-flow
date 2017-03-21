import { optsToString } from './optsToString';
import { trackPath } from './trackPath';
import httpRequestFailFunction from './httpRequestFailFunction';

export function http(_, method, path, opts, go) {
  const Flow = window.Flow;
  const $ = window.jQuery;
  if (path.substring(0, 1) === '/') {
    path = window.Flow.ContextPath + path.substring(1);
  }
  _.status('server', 'request', path);
  trackPath(_, path);
  const req = (() => {
    switch (method) {
      case 'GET':
        return $.getJSON(path);
      case 'POST':
        return $.post(path, opts);
      case 'POSTJSON':
        return $.ajax({
          url: path,
          type: 'POST',
          contentType: 'application/json',
          cache: false,
          data: JSON.stringify(opts),
        });
      case 'PUT':
        return $.ajax({
          url: path,
          type: method,
          data: opts,
        });
      case 'DELETE':
        return $.ajax({
          url: path,
          type: method,
        });
      case 'UPLOAD':
        return $.ajax({
          url: path,
          type: 'POST',
          data: opts,
          cache: false,
          contentType: false,
          processData: false,
        });
      default:
        // do nothing
    }
  })();
  req.done((data, status, xhr) => {
    let error;
    _.status('server', 'response', path);
    try {
      return go(null, data);
    } catch (_error) {
      error = _error;
      console.log('error from h2oProxy http', error);
      return go(new Flow.Error(`Error processing ${method} ${path}`, error));
    }
  });
  const boundHttpRequestFailFunction = httpRequestFailFunction.bind(
    this,
    _,
    path,
    go,
    method,
    opts
  );
  return req.fail(boundHttpRequestFailFunction);
}
