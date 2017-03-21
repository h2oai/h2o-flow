import { postPutObjectRequest } from '../h2oProxy/postPutObjectRequest';
import { deleteObjectRequest } from '../h2oProxy/deleteObjectRequest';
import { serialize } from './serialize';

export function storeNotebook(_, localName, remoteName) {
  return postPutObjectRequest(_, 'notebook', localName, serialize(_), error => {
    if (error) {
      return _.alert(`Error saving notebook: ${error.message}`);
    }
    _.remoteName(localName);
    _.localName(localName);

      // renamed document
    if (remoteName !== localName) {
      return deleteObjectRequest(_, 'notebook', remoteName, error => {
        if (error) {
          _.alert(`Error deleting remote notebook [${remoteName}]: ${error.message}`);
        }
        return _.saved();
      });
    }
    return _.saved();
  });
}
