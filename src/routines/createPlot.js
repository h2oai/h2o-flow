import { _plot } from './_plot';
import { extendPlot } from './extendPlot';

export function createPlot(_, f, go) {
  const lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
  if (lightning.settings) {
    lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
    lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
  }
  return _plot(f(lightning), (error, vis) => {
    if (error) {
      return go(error);
    }
    return go(null, extendPlot(_, vis));
  });
}
