export function createGridableValues(values, defaultValue) {
  const lodash = window._;
  const Flow = window.Flow;
  return lodash.map(values, value => ({
    label: value,
    value: Flow.Dataflow.signal(true),
  }));
}
