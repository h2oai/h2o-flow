import { doGet } from './doGet';

export function getObjectExistsRequest(_, type, name, go) {
  const urlString = `/3/NodePersistentStorage/categories/${encodeURIComponent(type)}/names/${encodeURIComponent(name)}/exists`;
  return doGet(_, urlString, (error, result) => go(null, error ? false : result.exists));
}
