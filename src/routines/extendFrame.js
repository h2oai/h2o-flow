import { render_ } from './render_';
import { inspect_ } from './inspect_';
import { inspectTwoDimTable_ } from './inspectTwoDimTable_';
import { inspectFrameColumns } from './inspectFrameColumns';
import { inspectFrameData } from './inspectFrameData';

import { h2oFrameOutput } from '../h2oFrameOutput/h2oFrameOutput';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function extendFrame(_, frameKey, frame) {
  let column;
  const inspections = {
    columns: inspectFrameColumns('columns', frameKey, frame, frame.columns),
    data: inspectFrameData(frameKey, frame),
  };
  const enumColumns = (() => {
    let _i;
    let _len;
    const _ref1 = frame.columns;
    const _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      column = _ref1[_i];
      if (column.type === 'enum') {
        _results.push(column);
      }
    }
    return _results;
  })();
  if (enumColumns.length > 0) {
    inspections.factors = inspectFrameColumns('factors', frameKey, frame, enumColumns);
  }
  const origin = `getFrameSummary ${flowPrelude.stringify(frameKey)}`;
  inspections[frame.chunk_summary.name] = inspectTwoDimTable_(origin, frame.chunk_summary.name, frame.chunk_summary);
  inspections[frame.distribution_summary.name] = inspectTwoDimTable_(origin, frame.distribution_summary.name, frame.distribution_summary);
  inspect_(frame, inspections);
  return render_(_, frame, h2oFrameOutput, frame);
}
