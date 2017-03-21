export function cacheModelBuilders(_, modelBuilders) {
  let modelBuilder;
  let _i;
  let _len;
  const modelBuilderEndpoints = {};
  const gridModelBuilderEndpoints = {};
  for (_i = 0, _len = modelBuilders.length; _i < _len; _i++) {
    modelBuilder = modelBuilders[_i];
    modelBuilderEndpoints[modelBuilder.algo] = `/${modelBuilder.__meta.schema_version}/ModelBuilders/${modelBuilder.algo}`;
    gridModelBuilderEndpoints[modelBuilder.algo] = `/99/Grid/${modelBuilder.algo}`;
  }
  _.__.modelBuilderEndpoints = modelBuilderEndpoints;
  _.__.gridModelBuilderEndpoints = gridModelBuilderEndpoints;
  _.__.modelBuilders = modelBuilders;
  return _.__.modelBuilders;
}
