import { extendParseSetupResults } from './extendParseSetupResults';
import { postParseSetupRequest } from '../h2oProxy/postParseSetupRequest';

export function requestParseSetup(_, sourceKeys, go) {
  return postParseSetupRequest(_, sourceKeys, (error, parseSetupResults) => {
    if (error) {
      return go(error);
    }
    return go(null, extendParseSetupResults(_, { source_frames: sourceKeys }, parseSetupResults));
  });
}
