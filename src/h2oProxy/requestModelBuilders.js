import { doGet } from './doGet';
import { unwrap } from './unwrap';
import { cacheModelBuilders } from './cacheModelBuilders';

export function requestModelBuilders(_, go) {
  const modelBuilders = _.__.modelBuilders;
  if (modelBuilders) {
    return go(null, modelBuilders);
  }
  const visibility = 'Stable';
  return doGet(_, '/3/ModelBuilders', unwrap(go, result => {
    let algo;
    let builder;
    const builders = (() => {
      const _ref = result.model_builders;
      const _results = [];
      for (algo in _ref) {
        if ({}.hasOwnProperty.call(_ref, algo)) {
          builder = _ref[algo];
          _results.push(builder);
        }
      }
      return _results;
    })();
    const availableBuilders = (() => {
      let _i;
      let _j;
      let _len;
      let _len1;
      let _results;
      let _results1;
      switch (visibility) {
        case 'Stable':
          _results = [];
          for (_i = 0, _len = builders.length; _i < _len; _i++) {
            builder = builders[_i];
            if (builder.visibility === visibility) {
              _results.push(builder);
            }
          }
          return _results;
            // break; // no-unreachable
        case 'Beta':
          _results1 = [];
          for (_j = 0, _len1 = builders.length; _j < _len1; _j++) {
            builder = builders[_j];
            if (builder.visibility === visibility || builder.visibility === 'Stable') {
              _results1.push(builder);
            }
          }
          return _results1;
            // break; // no-unreachable
        default:
          return builders;
      }
    })();
    return cacheModelBuilders(_, availableBuilders);
  }));
}
