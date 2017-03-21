import { postShutdownRequest } from '../h2oProxy/postShutdownRequest';

export default function shutdown(_) {
  return postShutdownRequest(_, (error, result) => {
    if (error) {
      return _.growl(`Shutdown failed: ${error.message}`, 'danger');
    }
    return _.growl('Shutdown complete!', 'warning');
  });
}
