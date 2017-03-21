import { render_ } from './render_';

import { h2oFramesOutput } from '../h2oFramesOutput';

export function extendFrames(_, frames) {
  render_(_, frames, h2oFramesOutput, frames);
  return frames;
}
