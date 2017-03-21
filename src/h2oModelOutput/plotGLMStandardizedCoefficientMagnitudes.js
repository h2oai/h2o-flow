import renderPlot from './renderPlot';

export default function plotGLMStandardizedCoefficientMagnitudes(_, table) {
  const plotTitle = 'Standardized Coefficient Magnitudes';
  const gFunction = g => g(
    g.rect(
      g.position('coefficients', 'names'),
      g.fillColor('sign')
    ),
    g.from(table),
    g.limit(25)
  );
  const plotFunction = _.plot(gFunction);
  renderPlot(
    _,
    plotTitle,
    false,
    plotFunction
  );
}
