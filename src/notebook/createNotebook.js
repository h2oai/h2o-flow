import { deserialize } from './deserialize';

export default function createNotebook(_) {
  return _.confirm('This action will replace your active notebook.\nAre you sure you want to continue?', {
    acceptCaption: 'Create New Notebook',
    declineCaption: 'Cancel',
  }, accept => {
    let currentTime;
    if (accept) {
      currentTime = new Date().getTime();

      const acceptLocalName = 'Untitled Flow';
      const acceptRemoteName = null;
      const acceptDoc = {
        cells: [{
          type: 'cs',
          input: '',
        }],
      };

      return deserialize(
          _,
          acceptLocalName,
          acceptRemoteName,
          acceptDoc
        );
    }
  });
}
