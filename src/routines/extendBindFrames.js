import { render_ } from './render_';

import { h2oBindFramesOutput } from '../h2oBindFramesOutput';

export function extendBindFrames(_, key, result) {
  return render_(_, result, h2oBindFramesOutput, key, result);
}
