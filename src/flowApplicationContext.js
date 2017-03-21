export function flowApplicationContext(_) {
  const Flow = window.Flow;
  _.ready = Flow.Dataflow.slots();
  _.initialized = Flow.Dataflow.slots();
  _.open = Flow.Dataflow.slot();
  _.load = Flow.Dataflow.slot();
  _.saved = Flow.Dataflow.slots();
  _.loaded = Flow.Dataflow.slots();
  _.setDirty = Flow.Dataflow.slots();
  _.setPristine = Flow.Dataflow.slots();
  _.status = Flow.Dataflow.slot();
  _.trackEvent = Flow.Dataflow.slot();
  _.trackException = Flow.Dataflow.slot();
  _.selectCell = Flow.Dataflow.slot();
  _.insertCell = Flow.Dataflow.slot();
  _.insertAndExecuteCell = Flow.Dataflow.slot();
  _.executeAllCells = Flow.Dataflow.slot();
  _.showHelp = Flow.Dataflow.slot();
  _.showOutline = Flow.Dataflow.slot();
  _.showBrowser = Flow.Dataflow.slot();
  _.showClipboard = Flow.Dataflow.slot();
  _.saveClip = Flow.Dataflow.slot();
  _.growl = Flow.Dataflow.slot();
  _.confirm = Flow.Dataflow.slot();
  _.alert = Flow.Dataflow.slot();
  _.dialog = Flow.Dataflow.slot();
  return _.dialog;
}

