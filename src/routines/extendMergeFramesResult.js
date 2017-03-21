import { render_ } from './render_';

import { h2oMergeFramesOutput } from '../h2oMergeFramesOutput';

export function extendMergeFramesResult(_, result) {
  render_(_, result, h2oMergeFramesOutput, result);
  return result;
}
