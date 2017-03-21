import _refresh from './_refresh';
import createOutput from './createOutput';
import _toggleRefresh from './_toggleRefresh';


export function h2oModelOutput(_, _go, _model, refresh) {
  console.log('arguments from h2oModelOutput', arguments);
  const lodash = window._;
  const Flow = window.Flow;
  const $ = window.jQuery;
  _.output = Flow.Dataflow.signal(null);
  _.isLive = Flow.Dataflow.signal(false);
  Flow.Dataflow.act(_.isLive, isLive => {
    if (isLive) {
      return _refresh(_, refresh);
    }
  });
  _.output(createOutput(_, _model));
  console.log('_.output() from h2oModelOutput', _.output());
  lodash.defer(_go);
  return {
    output: _.output,
    toggleRefresh: _toggleRefresh.bind(this, _),
    isLive: _.isLive,
    template: 'flow-model-output',
  };
}

