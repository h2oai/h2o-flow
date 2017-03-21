import setupKeyboardHandling from './setupKeyboardHandling';
import setupMenus from './setupMenus';
import createMenuCell from './createMenuCell';
import { loadNotebook } from './loadNotebook';
import openNotebook from './openNotebook';
import { selectCell } from './selectCell';
import executeAllCells from './executeAllCells';
import { appendCellAndRun } from './appendCellAndRun';
import { insertCellBelow } from './insertCellBelow';
import executeCommand from './executeCommand';
import { _initializeInterpreter } from './_initializeInterpreter';

export default function initialize(_) {
  const lodash = window._;
  const Flow = window.Flow;
  const menuCell = createMenuCell(_);
  setupKeyboardHandling(_, 'normal');
  setupMenus(_, menuCell);
  Flow.Dataflow.link(_.load, loadNotebook.bind(this, _));
  Flow.Dataflow.link(_.open, openNotebook.bind(this, _));
  Flow.Dataflow.link(_.selectCell, selectCell.bind(this, _));
  Flow.Dataflow.link(_.executeAllCells, executeAllCells.bind(this, _));
  Flow.Dataflow.link(_.insertAndExecuteCell, (type, input) => lodash.defer(appendCellAndRun, _, type, input));
  Flow.Dataflow.link(_.insertCell, (type, input) => lodash.defer(insertCellBelow, _, type, input));
  Flow.Dataflow.link(_.saved, () => _.growl('Notebook saved.'));
  Flow.Dataflow.link(_.loaded, () => _.growl('Notebook loaded.'));
  executeCommand(_, 'assist')();
      // TODO setPristine() when autosave is implemented.
  _.setDirty();
  if (_.onSparklingWater) {
    return _initializeInterpreter(_);
  }
}
