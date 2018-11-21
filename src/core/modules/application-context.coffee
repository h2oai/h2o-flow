{slots, slot} = require("./dataflow")

module.exports =
  ready: do slots,
  initialized: do slots
  open: do slot
  load: do slot
  saved: do slots
  loaded: do slots
  setDirty: do slots
  setPristine: do slots
  status: do slot
  trackEvent: do slot
  trackException: do slot
  selectCell: do slot
  insertCell: do slot
  insertAndExecuteCell: do slot
  executeAllCells: do slot
  showHelp: do slot
  showOutline: do slot
  showBrowser: do slot
  showClipboard: do slot
  saveClip: do slot
  growl: do slot
  confirm: do slot
  alert: do slot
  dialog: do slot
