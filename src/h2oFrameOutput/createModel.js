import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function createModel(_) {
  const codeCellCode = `assist buildModel, null, training_frame: ${flowPrelude.stringify(_.frame.frame_id.name)}`;
  return _.insertAndExecuteCell('cs', codeCellCode);
}
