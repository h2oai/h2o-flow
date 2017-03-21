export function h2oStackTraceOutput(_, _go, _stackTrace) {
  const lodash = window._;
  const Flow = window.Flow;
  let node;
  const _activeNode = Flow.Dataflow.signal(null);
  const createThread = thread => {
    const lines = thread.split('\n');
    return {
      title: lodash.head(lines),
      stackTrace: lodash.tail(lines).join('\n'),
    };
  };
  const createNode = node => {
    let thread;
    const display = () => _activeNode(self);
    const self = {
      name: node.node,
      timestamp: new Date(node.time),
      threads: ((() => {
        let _i;
        let _len;
        const _ref = node.thread_traces;
        const _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          thread = _ref[_i];
          _results.push(createThread(thread));
        }
        return _results;
      })()),
      display,
    };
    return self;
  };
  const _nodes = ((() => {
    let _i;
    let _len;
    const _ref = _stackTrace.traces;
    const _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _results.push(createNode(node));
    }
    return _results;
  })());
  _activeNode(lodash.head(_nodes));
  lodash.defer(_go);
  return {
    nodes: _nodes,
    activeNode: _activeNode,
    template: 'flow-stacktrace-output',
  };
}

