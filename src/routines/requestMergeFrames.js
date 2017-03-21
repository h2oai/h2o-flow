import { extendMergeFramesResult } from './extendMergeFramesResult';
import { requestExec } from '../h2oProxy/requestExec';

export function requestMergeFrames(
  _,
  destinationKey,
  leftFrameKey,
  leftColumnIndex,
  includeAllLeftRows,
  rightFrameKey,
  rightColumnIndex,
  includeAllRightRows,
  go
) {
  const lr = includeAllLeftRows ? 'TRUE' : 'FALSE';
  const rr = includeAllRightRows ? 'TRUE' : 'FALSE';
  const statement = `(assign ${destinationKey} (merge ${leftFrameKey} ${rightFrameKey} ${lr} ${rr} ${leftColumnIndex} ${rightColumnIndex} "radix"))`;
  return requestExec(_, statement, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendMergeFramesResult(_, { key: destinationKey }));
  });
}
