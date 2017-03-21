import { render_ } from './render_';
import { h2oPlotOutput } from '../h2oPlotOutput';

export function extendPlot(_, vis) {
  render_(_, vis, h2oPlotOutput, vis.element);
}
