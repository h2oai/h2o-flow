import { uuid } from '../utils/uuid';

export function populateFramesAndColumns(_, frameKey, algorithm, parameters, go) {
  const lodash = window._;
  const Flow = window.Flow;
  const destinationKeyParameter = lodash.find(parameters, parameter => parameter.name === 'model_id');
  if (destinationKeyParameter && !destinationKeyParameter.actual_value) {
    destinationKeyParameter.actual_value = `${algorithm}-${uuid()}`;
  }

      //
      // Force classification.
      //
  const classificationParameter = lodash.find(parameters, parameter => parameter.name === 'do_classification');
  if (classificationParameter) {
    classificationParameter.actual_value = true;
  }
  return _.requestFrames(_, (error, frames) => {
    let frame;
    let frameKeys;
    let frameParameters;
    let parameter;
    let _i;
    let _len;
    if (error) {
          // empty
          // TODO handle properly
    } else {
      frameKeys = (() => {
        let _i;
        let _len;
        const _results = [];
        for (_i = 0, _len = frames.length; _i < _len; _i++) {
          frame = frames[_i];
          _results.push(frame.frame_id.name);
        }
        return _results;
      })();
      frameParameters = lodash.filter(parameters, parameter => parameter.type === 'Key<Frame>');
      for (_i = 0, _len = frameParameters.length; _i < _len; _i++) {
        parameter = frameParameters[_i];
        parameter.values = frameKeys;

            // TODO HACK
        if (parameter.name === 'training_frame') {
          if (frameKey) {
            parameter.actual_value = frameKey;
          } else {
            frameKey = parameter.actual_value;
          }
        }
      }
      return go();
    }
  });
}
