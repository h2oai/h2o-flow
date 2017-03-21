export function flowSandbox(_, routines) {
  return {
    routines,
    context: {},
    results: {},
  };
}

