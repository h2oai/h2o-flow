import { doGet } from './doGet';

export function getModelBuilderRequest(_, algo, go) {
  return doGet(_, _.__.modelBuilderEndpoints[algo], go);
}
