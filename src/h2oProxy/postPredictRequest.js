import { doPost } from './doPost';

export function postPredictRequest(_, destinationKey, modelKey, frameKey, options, go) {
  console.log('arguments from postPredictRequest', arguments);
  let opt;
  const opts = {};
  if (destinationKey) {
    opts.predictions_frame = destinationKey;
  }
  opt = options.reconstruction_error;
  if (void 0 !== opt) {
    opts.reconstruction_error = opt;
  }
  opt = options.deep_features_hidden_layer;
  if (void 0 !== opt) {
    opts.deep_features_hidden_layer = opt;
  }
  opt = options.leaf_node_assignment;
  if (void 0 !== opt) {
    opts.leaf_node_assignment = opt;
  }
  opt = options.exemplar_index;
  if (void 0 !== opt) {
    opts.exemplar_index = opt;
  }
  return doPost(_, `/3/Predictions/models/${encodeURIComponent(modelKey)}/frames/${encodeURIComponent(frameKey)}`, opts, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, result);
  });
}
