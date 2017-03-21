export function h2oAssist(_, _go, _items) {
  const lodash = window._;
  let item;
  let name;
  const createAssistItem = (name, item) => ({
    name,
    description: item.description,
    icon: `fa fa-${item.icon} flow-icon`,

    execute() {
      return _.insertAndExecuteCell('cs', name);
    },
  });
  lodash.defer(_go);
  return {
    routines: (() => {
      const _results = [];
      for (name in _items) {
        if ({}.hasOwnProperty.call(_items, name)) {
          item = _items[name];
          _results.push(createAssistItem(name, item));
        }
      }
      return _results;
    })(),
    template: 'flow-assist',
  };
}

