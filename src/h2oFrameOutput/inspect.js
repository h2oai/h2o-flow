import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function inspect(_) {
  const codeCellCode = `inspect getFrameSummary ${flowPrelude.stringify(_.frame.frame_id.name)}`;
  return _.insertAndExecuteCell('cs', codeCellCode);
}
