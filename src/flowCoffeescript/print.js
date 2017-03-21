export function print(arg, guid, sandbox) {
  if (arg !== print) {
    sandbox.results[guid].outputs(arg);
  }
  return print;
}
