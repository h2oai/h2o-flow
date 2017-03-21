import createTool from './createTool';
import createNotebook from './createNotebook';
import { promptForNotebook } from './promptForNotebook';
import { saveNotebook } from './saveNotebook';
import { insertNewCellBelow } from './insertNewCellBelow';
import { moveCellUp } from './moveCellUp';
import { moveCellDown } from './moveCellDown';
import { cutCell } from './cutCell';
import { copyCell } from './copyCell';
import { pasteCellBelow } from './pasteCellBelow';
import clearCell from './clearCell';
import { deleteCell } from './deleteCell';
import { runCellAndSelectBelow } from './runCellAndSelectBelow';
import { runCell } from './runCell';
import runAllCells from './runAllCells';
import executeCommand from './executeCommand';

export default function createToolbar(_) {
  const toolbar = [
    [
      createTool('file-o', 'New', createNotebook.bind(this, _)),
      createTool('folder-open-o', 'Open', promptForNotebook.bind(this, _)),
      createTool('save', 'Save (s)', saveNotebook.bind(this, _)),
    ],
    [
      createTool('plus', 'Insert Cell Below (b)', insertNewCellBelow.bind(this, _)),
      createTool('arrow-up', 'Move Cell Up (ctrl+k)', moveCellUp.bind(this, _)),
      createTool('arrow-down', 'Move Cell Down (ctrl+j)', moveCellDown.bind(this, _)),
    ],
    [
      createTool('cut', 'Cut Cell (x)', cutCell.bind(this, _)),
      createTool('copy', 'Copy Cell (c)', copyCell.bind(this, _)),
      createTool('paste', 'Paste Cell Below (v)', pasteCellBelow.bind(this, _)),
      createTool('eraser', 'Clear Cell', clearCell.bind(this, _)),
      createTool('trash-o', 'Delete Cell (d d)', deleteCell.bind(this, _)),
    ],
    [
      createTool('step-forward', 'Run and Select Below', runCellAndSelectBelow.bind(this, _)),
      createTool('play', 'Run (ctrl+enter)', runCell.bind(this, _)),
      createTool('forward', 'Run All', runAllCells.bind(this, _)),
    ],
      [createTool('question-circle', 'Assist Me', executeCommand(_, 'assist'))],
  ];
  return toolbar;
}
