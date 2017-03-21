import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function splitFrame(_) {
  const codeCellCode = `assist splitFrame, ${flowPrelude.stringify(_.frame.frame_id.name)}`;
  return _.insertAndExecuteCell('cs', codeCellCode);
}
