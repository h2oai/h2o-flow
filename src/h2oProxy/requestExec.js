import { doPost } from './doPost';

export function requestExec(_, ast, go) {
  const Flow = window.Flow;
  return doPost(_, '/99/Rapids', { ast }, (error, result) => {
    if (error) {
      return go(error);
    }
    // TODO HACK - this api returns a 200 OK on failures
    if (result.error) {
      return go(new Flow.Error(result.error));
    }
    return go(null, result);
  });
}
