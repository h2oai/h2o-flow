import { render_ } from './render_';
import { h2oSetupParseOutput } from '../parseInput/h2oSetupParseOutput';

export function extendParseSetupResults(_, args, parseSetupResults) {
  const H2O = window.H2O;
  return render_(_, parseSetupResults, h2oSetupParseOutput, args, parseSetupResults);
}
