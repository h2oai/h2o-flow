export function h2oProfileOutput(_, _go, _profile) {
  const lodash = window._;
  const Flow = window.Flow;
  let i;
  let node;
  const _activeNode = Flow.Dataflow.signal(null);
  const createNode = node => {
    let entry;
    const display = () => _activeNode(self);
    const entries = (() => {
      let _i;
      let _len;
      const _ref = node.entries;
      const _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entry = _ref[_i];
        _results.push({
          stacktrace: entry.stacktrace,
          caption: `Count: ${entry.count}`,
        });
      }
      return _results;
    })();
    const self = {
      name: node.node_name,
      caption: `${node.node_name} at ${new Date(node.timestamp)}`,
      entries,
      display,
    };
    return self;
  };
  const _nodes = ((() => {
    let _i;
    let _len;
    const _ref = _profile.nodes;
    const _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      node = _ref[i];
      _results.push(createNode(node));
    }
    return _results;
  })());
  _activeNode(lodash.head(_nodes));
  lodash.defer(_go);
  return {
    nodes: _nodes,
    activeNode: _activeNode,
    template: 'flow-profile-output',
  };
}

