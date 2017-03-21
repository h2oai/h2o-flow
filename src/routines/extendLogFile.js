import { render_ } from './render_';

import { h2oLogFileOutput } from '../h2oLogFileOutput';

export function extendLogFile(_, cloud, nodeIndex, fileType, logFile) {
  return render_(_, logFile, h2oLogFileOutput, cloud, nodeIndex, fileType, logFile);
}
