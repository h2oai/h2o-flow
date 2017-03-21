import { createControl } from './createControl';
import { createGridableValues } from './createGridableValues';

export function createDropdownControl(parameter) {
  const Flow = window.Flow;
  const _value = Flow.Dataflow.signal(parameter.actual_value);
  const control = createControl('dropdown', parameter);
  control.values = Flow.Dataflow.signals(parameter.values);
  control.value = _value;
  control.gridedValues = Flow.Dataflow.lift(control.values, values => createGridableValues(values));
  return control;
}
