import { checkIfNameIsInUse } from './checkIfNameIsInUse';
import { storeNotebook } from './storeNotebook';

import { sanitizeName } from '../utils/sanitizeName';

export function saveNotebook(_) {
  const localName = sanitizeName(_.localName());
  if (localName === '') {
    return _.alert('Invalid notebook name.');
  }

      // saved document
  const remoteName = _.remoteName();
  if (remoteName) {
    storeNotebook(_, localName, remoteName);
  }
      // unsaved document
  checkIfNameIsInUse(_, localName, isNameInUse => {
    if (isNameInUse) {
      return _.confirm('A notebook with that name already exists.\nDo you want to replace it with the one you\'re saving?', {
        acceptCaption: 'Replace',
        declineCaption: 'Cancel',
      }, accept => {
        if (accept) {
          return storeNotebook(_, localName, remoteName);
        }
      });
    }
    return storeNotebook(_, localName, remoteName);
  });
}
