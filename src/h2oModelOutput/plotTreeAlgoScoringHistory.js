import renderPlot from './renderPlot';
import generateOnePathPointGFunction from './generateOnePathPointGFunction';
import generateTwoPathPointGFunction from './generateTwoPathPointGFunction';

export default function plotTreeAlgoScoringHistory(_, table) {
  if (table.schema.validation_logloss && table.schema.training_logloss) {
    const plotTitle = 'Scoring History - logloss';
    const gFunction = generateTwoPathPointGFunction(
      ['number_of_trees', 'training_logloss', '#1f77b4'],
      ['number_of_trees', 'validation_logloss', '#ff7f0e'],
      table
    );
    const plotFunction = _.plot(gFunction);
    renderPlot(
      _,
      plotTitle,
      false,
      plotFunction
    );
  } else if (table.schema.training_logloss) {
    const plotTitle = 'Scoring History - logloss';
    const gFunction = generateOnePathPointGFunction(
      ['number_of_trees', 'training_logloss', '#1f77b4'],
      table
    );
    const plotFunction = _.plot(gFunction);
    renderPlot(
      _,
      plotTitle,
      false,
      plotFunction
    );
  }
  if (table.schema.training_deviance) {
    if (table.schema.validation_deviance) {
      const plotTitle = 'Scoring History - Deviance';
      const gFunction = generateTwoPathPointGFunction(
        ['number_of_trees', 'training_logloss', '#1f77b4'],
        ['number_of_trees', 'validation_logloss', '#ff7f0e'],
        table
      );
      const plotFunction = _.plot(gFunction);
      renderPlot(
        _,
        plotTitle,
        false,
        plotFunction
      );
    } else {
      const plotTitle = 'Scoring History - Deviance';
      const gFunction = generateOnePathPointGFunction(
        ['number_of_trees', 'training_deviance', '#1f77b4'],
        table
      );
      const plotFunction = _.plot(gFunction);
      renderPlot(
        _,
        plotTitle,
        false,
        plotFunction
      );
    }
  }
}
