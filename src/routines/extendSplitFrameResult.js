import { render_ } from './render_';

import { h2oSplitFrameOutput } from '../h2oSplitFrameOutput';

export function extendSplitFrameResult(_, result) {
  render_(_, result, h2oSplitFrameOutput, result);
  return result;
}
