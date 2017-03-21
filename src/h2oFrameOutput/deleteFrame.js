import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function deleteFrame(_) {
  return _.confirm('Are you sure you want to delete this frame?', {
    acceptCaption: 'Delete Frame',
    declineCaption: 'Cancel',
  }, accept => {
    if (accept) {
      const codeCellCode = `deleteFrame ${flowPrelude.stringify(_.frame.frame_id.name)}`;
      return _.insertAndExecuteCell('cs', codeCellCode);
    }
  });
}
