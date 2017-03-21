import { render_ } from './render_';
import { h2oJobOutput } from '../jobOutput/h2oJobOutput';

export function extendParseResult(_, parseResult) {
  return render_(_, parseResult, h2oJobOutput, parseResult.job);
}
