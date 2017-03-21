import { doGet } from './doGet';

export function getIsStorageConfiguredRequest(_, go) {
  let _storageConfiguration = null;
  if (_storageConfiguration) {
    return go(null, _storageConfiguration.isConfigured);
  }
  return doGet(_, '/3/NodePersistentStorage/configured', (error, result) => {
    _storageConfiguration = { isConfigured: error ? false : result.configured };
    return go(null, _storageConfiguration.isConfigured);
  });
}
