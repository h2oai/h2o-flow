import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function exportModel(_) {
  return _.insertAndExecuteCell('cs', `exportModel ${flowPrelude.stringify(_.model.model_id.name)}`);
}
