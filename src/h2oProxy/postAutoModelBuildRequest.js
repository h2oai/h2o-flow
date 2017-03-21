import { doPostJSON } from './doPostJSON';

export function postAutoModelBuildRequest(_, parameters, go) {
  return doPostJSON(_, '/99/AutoMLBuilder', parameters, go);
}
