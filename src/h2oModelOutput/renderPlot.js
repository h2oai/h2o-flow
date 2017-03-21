import renderTable from './renderTable';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

// TODO Mega-hack alert
// Last arg thresholdsAndCriteria applicable only to
// ROC charts for binomial models.
export default function renderPlot(_, title, isCollapsed, render, thresholdsAndCriteria) {
  const lodash = window._;
  const Flow = window.Flow;
  const $ = window.jQuery;
  let rocPanel;
  const container = Flow.Dataflow.signal(null);
  const linkedFrame = Flow.Dataflow.signal(null);

      // TODO HACK
  if (thresholdsAndCriteria) {
    rocPanel = {
      thresholds: Flow.Dataflow.signals(thresholdsAndCriteria.thresholds),
      threshold: Flow.Dataflow.signal(null),
      criteria: Flow.Dataflow.signals(thresholdsAndCriteria.criteria),
      criterion: Flow.Dataflow.signal(null),
    };
  }
  render((error, vis) => {
    let _autoHighlight;
    if (error) {
      return console.debug(error);
    }
    $('a', vis.element).on('click', e => {
      const $a = $(e.target);
      switch ($a.attr('data-type')) {
        case 'frame':
          return _.insertAndExecuteCell('cs', `getFrameSummary ${flowPrelude.stringify($a.attr('data-key'))}`);
        case 'model':
          return _.insertAndExecuteCell('cs', `getModel ${flowPrelude.stringify($a.attr('data-key'))}`);
        default:
              // do nothing
      }
    });
    container(vis.element);
    _autoHighlight = true;
    if (vis.subscribe) {
      vis.subscribe('markselect', _arg => {
        let currentCriterion;
        let selectedIndex;
        const frame = _arg.frame;
        const indices = _arg.indices;
        const subframe = window.plot.createFrame(frame.label, frame.vectors, indices);
        _.plot(renderTable.bind(this, indices, subframe))((error, table) => {
          if (!error) {
            return linkedFrame(table.element);
          }
        });

            // TODO HACK
        if (rocPanel) {
          if (indices.length === 1) {
            selectedIndex = lodash.head(indices);
            _autoHighlight = false;
            rocPanel.threshold(lodash.find(rocPanel.thresholds(), threshold => threshold.index === selectedIndex));
            currentCriterion = rocPanel.criterion();

                // More than one criterion can point to the same threshold,
                // so ensure that we're preserving the existing criterion, if any.
            if (!currentCriterion || currentCriterion && currentCriterion.index !== selectedIndex) {
              rocPanel.criterion(lodash.find(rocPanel.criteria(), criterion => criterion.index === selectedIndex));
            }
            _autoHighlight = true;
          } else {
            rocPanel.criterion(null);
            rocPanel.threshold(null);
          }
        }
      });
      vis.subscribe('markdeselect', () => {
        linkedFrame(null);

            // TODO HACK
        if (rocPanel) {
          rocPanel.criterion(null);
          return rocPanel.threshold(null);
        }
      });

          // TODO HACK
      if (rocPanel) {
        Flow.Dataflow.react(rocPanel.threshold, threshold => {
          if (threshold && _autoHighlight) {
            return vis.highlight([threshold.index]);
          }
        });
        return Flow.Dataflow.react(rocPanel.criterion, criterion => {
          if (criterion && _autoHighlight) {
            return vis.highlight([criterion.index]);
          }
        });
      }
    }
  });
  return _.plots.push({
    title,
    plot: container,
    frame: linkedFrame,
    controls: Flow.Dataflow.signal(rocPanel),
    isCollapsed,
  });
}
