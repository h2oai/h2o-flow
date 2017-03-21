import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function inspect(_) {
  _.insertAndExecuteCell('cs', `inspect getModel ${flowPrelude.stringify(_.model.model_id.name)}`);
}
