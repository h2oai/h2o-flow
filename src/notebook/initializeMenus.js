import createMenuItem from './createMenuItem';
import executeCommand from './executeCommand';
import createMenu from './createMenu';
import createNotebook from './createNotebook';
import { promptForNotebook } from './promptForNotebook';
import { saveNotebook } from './saveNotebook';
import duplicateNotebook from './duplicateNotebook';
import runAllCells from './runAllCells';
import continueRunningAllCells from './continueRunningAllCells';
import { toggleAllInputs } from './toggleAllInputs';
import { toggleAllOutputs } from './toggleAllOutputs';
import clearAllCells from './clearAllCells';
import exportNotebook from './exportNotebook';
import { uploadFile } from './uploadFile';
import goToH2OUrl from './goToH2OUrl';
import createMenuHeader from './createMenuHeader';
import shutdown from './shutdown';
import showHelp from './showHelp';
import displayKeyboardShortcuts from './displayKeyboardShortcuts';
import displayDocumentation from './displayDocumentation';
import displayFAQ from './displayFAQ';
import goToUrl from './goToUrl';
import displayAbout from './displayAbout';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

// constants
import { menuDivider } from './menuDivider';

export default function initializeMenus(_, menuCell, builder) {
  const lodash = window._;
  const modelMenuItems = lodash.map(builder, builder => createMenuItem(`${builder.algo_full_name}...`, executeCommand(_, `buildModel ${flowPrelude.stringify(builder.algo)}`))).concat([
    menuDivider,
    createMenuItem('List All Models', executeCommand(_, 'getModels')),
    createMenuItem('List Grid Search Results', executeCommand(_, 'getGrids')),
    createMenuItem('Import Model...', executeCommand(_, 'importModel')),
    createMenuItem('Export Model...', executeCommand(_, 'exportModel')),
  ]);
  return [
    createMenu('Flow', [
      createMenuItem('New Flow', createNotebook.bind(this, _)),
      createMenuItem('Open Flow...', promptForNotebook.bind(this, _)),
      createMenuItem('Save Flow', saveNotebook.bind(this, _), ['s']),
      createMenuItem('Make a Copy...', duplicateNotebook.bind(this, _)),
      menuDivider,
      createMenuItem('Run All Cells', runAllCells.bind(this, _)),
      createMenuItem('Run All Cells Below', continueRunningAllCells.bind(this, _)),
      menuDivider,
      createMenuItem('Toggle All Cell Inputs', toggleAllInputs.bind(this, _)),
      createMenuItem('Toggle All Cell Outputs', toggleAllOutputs.bind(this, _)),
      createMenuItem('Clear All Cell Outputs', clearAllCells.bind(this, _)),
      menuDivider,
      createMenuItem('Download this Flow...', exportNotebook.bind(this, _)),
    ]),
    createMenu('Cell', menuCell),
    createMenu('Data', [
      createMenuItem('Import Files...', executeCommand(_, 'importFiles')),
      createMenuItem('Upload File...', uploadFile.bind(this, _)),
      createMenuItem('Split Frame...', executeCommand(_, 'splitFrame')),
      createMenuItem('Merge Frames...', executeCommand(_, 'mergeFrames')),
      menuDivider,
      createMenuItem('List All Frames', executeCommand(_, 'getFrames')),
      menuDivider,
      createMenuItem('Impute...', executeCommand(_, 'imputeColumn')),
          // TODO Quantiles
          // TODO Interaction
    ]),
    createMenu('Model', modelMenuItems),
    createMenu('Score', [
      createMenuItem('Predict...', executeCommand(_, 'predict')),
      createMenuItem('Partial Dependence Plots...', executeCommand(_, 'buildPartialDependence')),
      menuDivider,
      createMenuItem('List All Predictions', executeCommand(_, 'getPredictions')),
          // TODO Confusion Matrix
          // TODO AUC
          // TODO Hit Ratio
          // TODO PCA Score
          // TODO Gains/Lift Table
          // TODO Multi-model Scoring
    ]),
    createMenu('Plot', [
      createMenuItem('Partial Dependence Plots...', executeCommand(_, 'buildPartialDependence')),
      createMenuItem('Roomscale Scatterplot...', executeCommand(_, 'buildRoomscaleScatterplot')),
    ]),
    createMenu('Admin', [
      createMenuItem('Jobs', executeCommand(_, 'getJobs')),
      createMenuItem('Cluster Status', executeCommand(_, 'getCloud')),
      createMenuItem('Water Meter (CPU meter)', goToH2OUrl('perfbar.html')),
      menuDivider,
      createMenuHeader('Inspect Log'),
      createMenuItem('View Log', executeCommand(_, 'getLogFile')),
      createMenuItem('Download Logs', goToH2OUrl('3/Logs/download')),
      menuDivider,
      createMenuHeader('Advanced'),
      createMenuItem('Create Synthetic Frame...', executeCommand(_, 'createFrame')),
      createMenuItem('Stack Trace', executeCommand(_, 'getStackTrace')),
      createMenuItem('Network Test', executeCommand(_, 'testNetwork')),
          // TODO Cluster I/O
      createMenuItem('Profiler', executeCommand(_, 'getProfile depth: 10')),
      createMenuItem('Timeline', executeCommand(_, 'getTimeline')),
          // TODO UDP Drop Test
          // TODO Task Status
      createMenuItem('Shut Down', shutdown.bind(this, _)),
    ]),
    createMenu('Help', [
          // TODO createMenuItem('Tour', startTour, true),
      createMenuItem('Assist Me', executeCommand(_, 'assist')),
      menuDivider,
      createMenuItem('Contents', showHelp.bind(this, _)),
      createMenuItem('Keyboard Shortcuts', displayKeyboardShortcuts, ['h']),
      menuDivider,
      createMenuItem('Documentation', displayDocumentation),
      createMenuItem('FAQ', displayFAQ),
      createMenuItem('H2O.ai', goToUrl('http://h2o.ai/')),
      createMenuItem('H2O on Github', goToUrl('https://github.com/h2oai/h2o-3')),
      createMenuItem('Report an issue', goToUrl('http://jira.h2o.ai')),
      createMenuItem('Forum / Ask a question', goToUrl('https://groups.google.com/d/forum/h2ostream')),
      menuDivider,
          // TODO Tutorial Flows
      createMenuItem('About', displayAbout),
    ]),
  ];
}
