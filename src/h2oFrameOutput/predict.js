import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function predict(_) {
  const codeCellCode = `predict frame: ${flowPrelude.stringify(_.frame.frame_id.name)}`;
  return _.insertAndExecuteCell('cs', codeCellCode);
}
