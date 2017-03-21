import { serialize } from './serialize';
import { deserialize } from './deserialize';
import { createCell } from './createCell';
import { checkConsistency } from './checkConsistency';
import { insertAbove } from './insertAbove';
import { insertCell } from './insertCell';
import { insertBelow } from './insertBelow';
import { appendCell } from './appendCell';
import { mergeCellBelow } from './mergeCellBelow';
import { splitCell } from './splitCell';
import { pasteCellAbove } from './pasteCellAbove';
import { editName } from './editName';
import { saveName } from './saveName';
import { toggleSidebar } from './toggleSidebar';
// figured out how to use `export default function` syntax here
// hence no {} curly braces
import stopRunningAll from './stopRunningAll';
import notImplemented from './notImplemented';
import createMenu from './createMenu';
import toKeyboardHelp from './toKeyboardHelp';
import createNormalModeKeyboardShortcuts from './createNormalModeKeyboardShortcuts';
import createEditModeKeyboardShortcuts from './createEditModeKeyboardShortcuts';
import initialize from './initialize';
import createToolbar from './createToolbar';

import { getObjectExistsRequest } from '../h2oProxy/getObjectExistsRequest';

import { flowStatus } from '../flowStatus';
import { flowSidebar } from '../flowSidebar';
import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function flowNotebook(_) {
  const lodash = window._;
  const Flow = window.Flow;
  const Mousetrap = window.Mousetrap;
  const $ = window.jQuery;
  const __slice = [].slice;
  _.localName = Flow.Dataflow.signal('Untitled Flow');
  Flow.Dataflow.react(_.localName, name => {
    document.title = `H2O${(name && name.trim() ? `- ${name}` : '')}`;
    return document.title;
  });
  _.remoteName = Flow.Dataflow.signal(null);
  _.isEditingName = Flow.Dataflow.signal(false);
  _.cells = Flow.Dataflow.signals([]);
  _.selectedCell = null;
  _.selectedCellIndex = -1;
  _.clipboardCell = null;
  _.lastDeletedCell = null;
  _.areInputsHidden = Flow.Dataflow.signal(false);
  _.areOutputsHidden = Flow.Dataflow.signal(false);
  _.isSidebarHidden = Flow.Dataflow.signal(false);
  _.isRunningAll = Flow.Dataflow.signal(false);
  _.runningCaption = Flow.Dataflow.signal('Running');
  _.runningPercent = Flow.Dataflow.signal('0%');
  _.runningCellInput = Flow.Dataflow.signal('');
  const _status = flowStatus(_);
  const _sidebar = flowSidebar(_);
  const _about = Flow.about(_);
  const _dialogs = Flow.dialogs(_);
  const pasteCellandReplace = notImplemented;
  const mergeCellAbove = notImplemented;
  const startTour = notImplemented;
  //
  // Top menu bar
  //
  _.menus = Flow.Dataflow.signal(null);
  const _toolbar = createToolbar(_);
  const normalModeKeyboardShortcuts = createNormalModeKeyboardShortcuts(_);
  const editModeKeyboardShortcuts = createEditModeKeyboardShortcuts();
  const normalModeKeyboardShortcutsHelp = lodash.map(normalModeKeyboardShortcuts, toKeyboardHelp);
  const editModeKeyboardShortcutsHelp = lodash.map(editModeKeyboardShortcuts, toKeyboardHelp);
  Flow.Dataflow.link(_.ready, initialize.bind(this, _));
  return {
    name: _.localName,
    isEditingName: _.isEditingName,
    editName: editName.bind(this, _),
    saveName: saveName.bind(this, _),
    menus: _.menus,
    sidebar: _sidebar,
    status: _status,
    toolbar: _toolbar,
    cells: _.cells,
    areInputsHidden: _.areInputsHidden,
    areOutputsHidden: _.areOutputsHidden,
    isSidebarHidden: _.isSidebarHidden,
    isRunningAll: _.isRunningAll,
    runningCaption: _.runningCaption,
    runningPercent: _.runningPercent,
    runningCellInput: _.runningCellInput,
    stopRunningAll: stopRunningAll.bind(this, _),
    toggleSidebar: toggleSidebar.bind(this, _),
    shortcutsHelp: {
      normalMode: normalModeKeyboardShortcutsHelp,
      editMode: editModeKeyboardShortcutsHelp,
    },
    about: _about,
    dialogs: _dialogs,
    templateOf(view) {
      return view.template;
    },
  };
}
