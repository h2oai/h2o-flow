import renderPlot from './renderPlot';
import generateOnePathPointGFunction from './generateOnePathPointGFunction';
import generateTwoPathPointGFunction from './generateTwoPathPointGFunction';

export default function plotGLMScoringHistory(_, table) {
  const lodash = window._;
  const plotTitle = 'Scoring History';
  const lambdaSearchParameter = lodash.find(_.model.parameters, parameter => parameter.name === 'lambda_search');
  let plotFunction;
  if (lambdaSearchParameter != null ? lambdaSearchParameter.actual_value : void 0) {
    const gFunction = generateTwoPathPointGFunction(
      ['lambda', 'explained_deviance_train', '#1f77b4'],
      ['lambda', 'explained_deviance_test', '#ff7f0e'],
      table
    );
    plotFunction = _.plot(gFunction);
  } else {
    const gFunction = generateOnePathPointGFunction(
      ['iteration', 'objective', '#1f77b4'],
      table
    );
    plotFunction = _.plot(gFunction);
  }
  renderPlot(
    _,
    plotTitle,
    false,
    plotFunction
  );
}
