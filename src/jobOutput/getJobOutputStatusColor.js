import { jobOutputStatusColors } from './jobOutputStatusColors';

export function getJobOutputStatusColor(status) {
    // CREATED   Job was created
    // RUNNING   Job is running
    // CANCELLED Job was cancelled by user
    // FAILED    Job crashed, error message/exception is available
    // DONE      Job was successfully finished
  switch (status) {
    case 'DONE':
      return jobOutputStatusColors.done;
    case 'CREATED':
    case 'RUNNING':
      return jobOutputStatusColors.running;
    default:
        // 'CANCELLED', 'FAILED'
      return jobOutputStatusColors.failed;
  }
}
