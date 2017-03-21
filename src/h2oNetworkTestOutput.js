export function h2oNetworkTestOutput(_, _go, _testResult) {
  const lodash = window._;
  const Flow = window.Flow;
  const _result = Flow.Dataflow.signal(null);
  const render = _.plot(g => g(g.select(), g.from(_.inspect('result', _testResult))));
  render((error, vis) => {
    if (error) {
      return console.debug(error);
    }
    return _result(vis.element);
  });
  lodash.defer(_go);
  return {
    result: _result,
    template: 'flow-network-test-output',
  };
}

