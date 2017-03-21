import { render_ } from './render_';

import { h2oDeleteObjectsOutput } from '../h2oDeleteObjectsOutput';

export function extendDeletedKeys(_, keys) {
  return render_(_, keys, h2oDeleteObjectsOutput, keys);
}
