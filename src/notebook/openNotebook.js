import { deserialize } from './deserialize';

export default function openNotebook(_, name, doc) {
  const openNotebookLocalName = name;
  const openNotebookRemoteName = null;
  const openNotebookDoc = doc;
  return deserialize(
        _,
        openNotebookLocalName,
        openNotebookRemoteName,
        openNotebookDoc
      );
}
