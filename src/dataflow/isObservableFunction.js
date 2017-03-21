export function isObservableFunction(obj) {
  if (obj.__observable__) {
    return true;
  }
  return false;
}
