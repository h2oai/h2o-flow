import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function exportFrame(_) {
  const codeCellCode = `exportFrame ${flowPrelude.stringify(_.frame.frame_id.name)}`;
  return _.insertAndExecuteCell('cs', codeCellCode);
}
