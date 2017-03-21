import { render_ } from './render_';

import { h2oCancelJobOutput } from '../h2oCancelJobOutput';

export function extendCancelJob(_, cancellation) {
  return render_(_, cancellation, h2oCancelJobOutput, cancellation);
}
