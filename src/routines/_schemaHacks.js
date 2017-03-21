import { transformBinomialMetrics } from './transformBinomialMetrics';

export const _schemaHacks = {
  KMeansOutput: { fields: 'names domains help' },
  GBMOutput: { fields: 'names domains help' },
  GLMOutput: { fields: 'names domains help' },
  DRFOutput: { fields: 'names domains help' },
  DeepLearningModelOutput: { fields: 'names domains help' },
  NaiveBayesOutput: { fields: 'names domains help pcond' },
  PCAOutput: { fields: 'names domains help' },
  GLRMOutput: { fields: 'names domains help' },
  SVMOutput: { fields: 'names domains help' },
  // Word2VecOutput: { fields: 'names domains help' },
  ModelMetricsBinomialGLM: {
    fields: null,
    transform: transformBinomialMetrics,
  },
  ModelMetricsBinomial: {
    fields: null,
    transform: transformBinomialMetrics,
  },
  ModelMetricsMultinomialGLM: { fields: null },
  ModelMetricsMultinomial: { fields: null },
  ModelMetricsRegressionGLM: { fields: null },
  ModelMetricsRegression: { fields: null },
  ModelMetricsClustering: { fields: null },
  ModelMetricsAutoEncoder: { fields: null },
  ModelMetricsPCA: { fields: null },
  ModelMetricsGLRM: { fields: null },
  ConfusionMatrix: { fields: null },
};
