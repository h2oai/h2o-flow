import renderPlot from './renderPlot';
import getAucAsLabel from './getAucAsLabel';
import getThresholdsAndCriteria from './getThresholdsAndCriteria';

export default function plotTreeAlgoVariableImportances(_, table) {
  const plotTitle = 'Variable Importances';
  const gFunction = g => g(
    g.rect(
      g.position('scaled_importance', 'variable')
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
