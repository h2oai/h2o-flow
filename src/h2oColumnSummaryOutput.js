import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oColumnSummaryOutput(_, _go, frameKey, frame, columnName) {
  const lodash = window._;
  const Flow = window.Flow;
  let table;
  const column = lodash.head(frame.columns);
  const _characteristicsPlot = Flow.Dataflow.signal(null);
  const _summaryPlot = Flow.Dataflow.signal(null);
  const _distributionPlot = Flow.Dataflow.signal(null);
  const _domainPlot = Flow.Dataflow.signal(null);
  const renderPlot = (target, render) => render((error, vis) => {
    if (error) {
      return console.debug(error);
    }
    return target(vis.element);
  });
  table = _.inspect('characteristics', frame);
  if (table) {
    renderPlot(_characteristicsPlot, _.plot(g => g(g.rect(g.position(g.stack(g.avg('percent'), 0), 'All'), g.fillColor('characteristic')), g.groupBy(g.factor(g.value('All')), 'characteristic'), g.from(table))));
  }
  table = _.inspect('distribution', frame);
  if (table) {
    renderPlot(_distributionPlot, _.plot(g => g(g.rect(g.position('interval', 'count'), g.width(g.value(1))), g.from(table))));
  }
  table = _.inspect('summary', frame);
  if (table) {
    renderPlot(_summaryPlot, _.plot(g => g(g.schema(g.position('min', 'q1', 'q2', 'q3', 'max', 'column')), g.from(table))));
  }
  table = _.inspect('domain', frame);
  if (table) {
    renderPlot(_domainPlot, _.plot(g => g(g.rect(g.position('count', 'label')), g.from(table), g.limit(1000))));
  }
  const impute = () => _.insertAndExecuteCell('cs', `imputeColumn frame: ${flowPrelude.stringify(frameKey)}, column: ${flowPrelude.stringify(columnName)}`);
  const inspect = () => _.insertAndExecuteCell('cs', `inspect getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`);
  lodash.defer(_go);
  return {
    label: column.label,
    characteristicsPlot: _characteristicsPlot,
    summaryPlot: _summaryPlot,
    distributionPlot: _distributionPlot,
    domainPlot: _domainPlot,
    impute,
    inspect,
    template: 'flow-column-summary-output',
  };
}

