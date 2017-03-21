import { doPost } from './doPost';

// Create data for partial dependence plot(s)
// for the specified model and frame.
//
// make a post request to h2o-3 to request
// the data about the specified model and frame
// subject to the other options `opts`
//
// returns a job
export function postPartialDependenceRequest(_, opts, go) {
  return doPost(_, '/3/PartialDependence/', opts, go);
}
