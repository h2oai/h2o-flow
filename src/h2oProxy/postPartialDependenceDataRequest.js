import { doGet } from './doGet';

// make a post request to h2o-3 to do request
// the data about the specified model and frame
// subject to the other options `opts`
//
// returns a json response that contains the data
export function postPartialDependenceDataRequest(_, key, go) {
  return doGet(_, `/3/PartialDependence/${encodeURIComponent(key)}`, (error, result) => {
    if (error) {
      return go(error, result);
    }
    return go(error, result);
  });
}
