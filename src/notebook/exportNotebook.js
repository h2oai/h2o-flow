export default function exportNotebook(_) {
  const remoteName = _.remoteName();
  if (remoteName) {
    return window.open(`/3/NodePersistentStorage.bin/notebook/${remoteName}`, '_blank');
  }
  return _.alert('Please save this notebook before exporting.');
}
