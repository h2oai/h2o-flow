export function isRoutine(f, sandbox) {
  let name;
  let routine;
  const _ref = sandbox.routines;
  for (name in _ref) {
    if ({}.hasOwnProperty.call(_ref, name)) {
      routine = _ref[name];
      if (f === routine) {
        return true;
      }
    }
  }
  return false;
}
