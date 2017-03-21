import { render_ } from './render_';

import { h2oStackTraceOutput } from '../h2oStackTraceOutput';

export function extendStackTrace(_, stackTrace) {
  return render_(_, stackTrace, h2oStackTraceOutput, stackTrace);
}
