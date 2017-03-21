import { render_ } from './render_';

import { h2oTimelineOutput } from '../h2oTimelineOutput';

export function extendTimeline(_, timeline) {
  return render_(_, timeline, h2oTimelineOutput, timeline);
}
