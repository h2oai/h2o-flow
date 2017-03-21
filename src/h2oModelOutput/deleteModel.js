import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function deleteModel(_) {
  return _.confirm('Are you sure you want to delete this model?', {
    acceptCaption: 'Delete Model',
    declineCaption: 'Cancel',
  }, accept => {
    if (accept) {
      return _.insertAndExecuteCell('cs', `deleteModel ${flowPrelude.stringify(_.model.model_id.name)}`);
    }
  });
}
