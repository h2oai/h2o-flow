import goToH2OUrl from './notebook/goToUrl';

export default function showRoomscaleScatterplot(options) {
  console.log('showRoomscaleScatterplot was called');
  console.log('arguments passed to showRoomscaleScatterplot', arguments);
  const selectedFrame = options.frameID;
  console.log('selectedFrame from showModelDeviancesPlot', selectedFrame);

  // hard code values for `small-synth-data` for now
  // add proper form input soon
  const xVariable = options.xVariable;
  const yVariable = options.yVariable;
  const zVariable = options.zVariable;
  const colorVariable = options.colorVariable;
  const plotUrl = `/roomscale-scatterplot.html?frame_id=${selectedFrame}&x_variable=${xVariable}&y_variable=${yVariable}&z_variable=${zVariable}&color_variable=${colorVariable}`;
  goToH2OUrl(plotUrl)();
  return {
    plotUrl,
    template: 'flow-roomscale-scatterplot-output',
  };
  return {}; // eslint-disable-line
}
