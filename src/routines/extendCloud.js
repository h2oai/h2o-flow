import { render_ } from './render_';

import { h2oCloudOutput } from '../h2oCloudOutput';

export function extendCloud(_, cloud) {
  return render_(_, cloud, h2oCloudOutput, cloud);
}
