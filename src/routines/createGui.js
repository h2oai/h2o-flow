import { extendGuiForm } from './extendGuiForm';

export function createGui(_, controls, go) {
  const Flow = window.Flow;
  return go(null, extendGuiForm(_, Flow.Dataflow.signals(controls || [])));
}
