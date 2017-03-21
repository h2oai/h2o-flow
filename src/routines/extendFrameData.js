import { render_ } from './render_';
import { inspect_ } from './inspect_';
import { inspectFrameData } from './inspectFrameData';

import { h2oFrameDataOutput } from '../h2oFrameDataOutput';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function extendFrameData(_, frameKey, frame) {
  const inspections = { data: inspectFrameData(frameKey, frame) };
  const origin = `getFrameData ${flowPrelude.stringify(frameKey)}`;
  inspect_(frame, inspections);
  return render_(_, frame, h2oFrameDataOutput, frame);
}
