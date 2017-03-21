import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function view(
  _,
  _canView,
  _destinationType,
  _job,
  _destinationKey
) {
  if (!_canView()) {
    return;
  }
  switch (_destinationType) {
    case 'Frame':
      return _.insertAndExecuteCell('cs', `getFrameSummary ${flowPrelude.stringify(_destinationKey)}`);
    case 'Model':
      return _.insertAndExecuteCell('cs', `getModel ${flowPrelude.stringify(_destinationKey)}`);
    case 'Grid':
      return _.insertAndExecuteCell('cs', `getGrid ${flowPrelude.stringify(_destinationKey)}`);
    case 'PartialDependence':
      return _.insertAndExecuteCell('cs', `getPartialDependence ${flowPrelude.stringify(_destinationKey)}`);
    case 'Auto Model':
          // FIXME getGrid() for AutoML is hosed; resort to getGrids() for now.
      return _.insertAndExecuteCell('cs', 'getGrids');
    case 'Void':
      return alert(`This frame was exported to\n${_job.dest.name}`);
    default:
          // do nothing
  }
}
