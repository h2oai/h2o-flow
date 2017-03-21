import { getObjectRequest } from '../h2oProxy/getObjectRequest';
import { deserialize } from './deserialize';

export function loadNotebook(_, name) {
  return getObjectRequest(_, 'notebook', name, (error, doc) => {
    let _ref;
    if (error) {
      _ref = error.message;
      return _.alert((_ref) != null ? _ref : error);
    }
    const loadNotebookLocalName = name;
    const loadNotebookRemoteName = name;
    const loadNotebookDoc = doc;
    return deserialize(
          _,
          loadNotebookLocalName,
          loadNotebookRemoteName,
          loadNotebookDoc
        );
  });
}
