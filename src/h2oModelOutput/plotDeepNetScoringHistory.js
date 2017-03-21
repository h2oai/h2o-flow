import renderPlot from './renderPlot';
import generateOnePathPointGFunction from './generateOnePathPointGFunction';
import generateTwoPathPointGFunction from './generateTwoPathPointGFunction';

export default function plotDeepNetScoringHistory(_, table) {
  //
  // if we have both training and validation logloss
  //
  if (table.schema.validation_logloss && table.schema.training_logloss) {
    const gFunction = generateTwoPathPointGFunction(
      ['epochs', 'training_logloss', '#1f77b4'],
      ['epochs', 'validation_logloss', '#ff7f0e'],
      table
    );
    const plotFunction = _.plot(gFunction);
    renderPlot(
      _,
      'Scoring History - logloss',
      false,
      plotFunction
    );
  //
  // if we have only training logloss
  //
  } else if (table.schema.training_logloss) {
    const gFunction = generateOnePathPointGFunction(
      ['epochs', 'training_logloss', '#1f77b4'],
      table
    );
    const plotFunction = _.plot(gFunction);
    renderPlot(
      _,
      'Scoring History - logloss',
      false,
      plotFunction
    );
  }
  if (table.schema.training_deviance) {
    //
    // if we have training deviance and validation deviance
    //
    if (table.schema.validation_deviance) {
      const gFunction = generateTwoPathPointGFunction(
        ['epochs', 'training_deviance', '#1f77b4'],
        ['epochs', 'validation_deviance', '#ff7f0e'],
        table
      );
      const plotFunction = _.plot(gFunction);
      renderPlot(
        _,
        'Scoring History - Deviance',
        false,
        plotFunction
      );
    //
    // if we have only training deviance
    //
    } else {
      const gFunction = generateOnePathPointGFunction(
        ['epochs', 'training_deviance', '#1f77b4'],
        table
      );
      const plotFunction = _.plot(gFunction);
      renderPlot(
        _,
        'Scoring History - Deviance',
        false,
        plotFunction
      );
    }
  } else if (table.schema.training_mse) {
    //
    // if we have training mse and validation mse
    //
    if (table.schema.validation_mse) {
      const gFunction = generateTwoPathPointGFunction(
        ['epochs', 'training_mse', '#1f77b4'],
        ['epochs', 'validation_mse', '#ff7f0e'],
        table
      );
      const plotFunction = _.plot(gFunction);
      renderPlot(
        _,
        'Scoring History - MSE',
        false,
        plotFunction
    );
    //
    // if we have only training mse
    //
    } else {
      const gFunction = generateOnePathPointGFunction(
        ['epochs', 'training_mse', '#1f77b4'],
        table
      );
      const plotFunction = _.plot(gFunction);
      renderPlot(
        _,
        'Scoring History - MSE',
        false,
        plotFunction
      );
    }
  }
}
