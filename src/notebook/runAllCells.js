import executeAllCells from './executeAllCells';

export default function runAllCells(_, fromBeginning) {
  console.log('arguments from runAllCells', arguments);
  if (fromBeginning == null) {
    fromBeginning = true;
  }
  return executeAllCells(_, fromBeginning, status => {
    _.isRunningAll(false);
    switch (status) {
      case 'aborted':
        return _.growl('Stopped running your flow.', 'warning');
      case 'failed':
        return _.growl('Failed running your flow.', 'danger');
      default:
            // 'done'
        return _.growl('Finished running your flow!', 'success');
    }
  });
}
