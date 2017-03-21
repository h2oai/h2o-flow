import { serialize } from './serialize';
import { deserialize } from './deserialize';

export default function duplicateNotebook(_) {
  const duplicateNotebookLocalName = `Copy of ${_.localName()}`;
  const duplicateNotebookRemoteName = null;
  const duplicateNotebookDoc = serialize(_);
  return deserialize(
        _,
        duplicateNotebookLocalName,
        duplicateNotebookRemoteName,
        duplicateNotebookDoc
      );
}
