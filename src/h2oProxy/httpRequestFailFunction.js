import { optsToString } from './optsToString';

export default function httpRequestFailFunction(
  _,
  path,
  go,
  method,
  opts,
  xhr,
  status,
  error
) {
  console.log('arguments from httpRequestFailFunction', arguments);
  const Flow = window.Flow;
  let serverError;
  _.status('server', 'error', path);
  const response = xhr.responseJSON;
  console.log('h2oProxy http response from h2o-3', response);
    // special-case net::ERR_CONNECTION_REFUSED
    // if status is 'error' and xhr.status is 0
  let cause;

    // if there is a response
  if (typeof response !== 'undefined') {
    console.log('h2oProxy http fail | there is a response');
      // if the response has a __meta metadata property
    if (typeof response.__meta !== 'undefined') {
      console.log('h2oProxy http fail | the response has a __meta metadata property');
        // if that metadata property has one of two specific schema types
      if (response.__meta.schema_type === 'H2OError' || response.__meta.schema_type === 'H2OModelBuilderError') {
        console.log('h2oProxy http fail | the response has one of two specific schema types');
        serverError = new Flow.Error(response.exception_msg);
        serverError.stack = `${response.dev_msg} (${response.exception_type})\n  ${response.stacktrace.join('\n  ')}`;
        console.log('serverError', serverError);
        cause = serverError;
      } else if (typeof error !== 'undefined' && error !== null ? error.message : void 0) {
        cause = new Flow.Error(error.message);
      } else {
          // special-case net::ERR_CONNECTION_REFUSED
        if (status === 'error' && xhr.status === 0) {
          cause = new Flow.Error('Could not connect to H2O. Your H2O cloud is currently unresponsive.');
        } else {
          cause = new Flow.Error(`HTTP connection failure: status=${status}, code=${xhr.status}, error=${error || '?'}`);
        }
      }
    }
  }
  return go(new Flow.Error(`Error calling ${method} ${path}${optsToString(opts)}`, cause));
}
