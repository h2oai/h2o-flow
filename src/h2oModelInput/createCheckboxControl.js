import { createControl } from './createControl';

export function createCheckboxControl(parameter) {
  const lodash = window._;
  const Flow = window.Flow;
  const _value = Flow.Dataflow.signal(parameter.actual_value);
  const control = createControl('checkbox', parameter);
  control.clientId = lodash.uniqueId();
  control.value = _value;
  return control;
}
