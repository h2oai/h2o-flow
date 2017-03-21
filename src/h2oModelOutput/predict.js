import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

// the function called when the predict button
// on the model output cell
// is clicked
export default function predict(_) {
  return _.insertAndExecuteCell('cs', `predict model: ${flowPrelude.stringify(_.model.model_id.name)}`);
}
