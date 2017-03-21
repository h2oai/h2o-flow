export function gui() {
  const lodash = window._;
  const Flow = window.Flow;
  const wrapValue = (value, init) => {
    if (value === void 0) {
      return Flow.Dataflow.signal(init);
    }
    if (Flow.Dataflow.isSignal(value)) {
      return value;
    }
    return Flow.Dataflow.signal(value);
  };
  const wrapArray = elements => {
    let element;
    if (elements) {
      if (Flow.Dataflow.isSignal(elements)) {
        element = elements();
        if (lodash.isArray(element)) {
          return elements;
        }
        return Flow.Dataflow.signal([element]);
      }
      return Flow.Dataflow.signals(lodash.isArray(elements) ? elements : [elements]);
    }
    return Flow.Dataflow.signals([]);
  };
  const control = (type, opts) => {
    if (!opts) {
      opts = {};
    }
    const guid = `gui_${lodash.uniqueId()}`;
    return {
      type,
      id: opts.id || guid,
      label: Flow.Dataflow.signal(opts.label || ' '),
      description: Flow.Dataflow.signal(opts.description || ' '),
      visible: Flow.Dataflow.signal(opts.visible !== false),
      disable: Flow.Dataflow.signal(opts.disable === true),
      template: `flow-form-${type}`,
      templateOf(control) {
        return control.template;
      },
    };
  };
  const content = (type, opts) => {
    const self = control(type, opts);
    self.value = wrapValue(opts.value, '');
    return self;
  };
  const text = opts => content('text', opts);
  const html = opts => content('html', opts);
  const markdown = opts => content('markdown', opts);
  const checkbox = opts => {
    const self = control('checkbox', opts);
    self.value = wrapValue(opts.value, opts.value);
    return self;
  };

  // TODO ko supports array valued args for 'checked' - can provide a checkboxes function
  const dropdown = opts => {
    const self = control('dropdown', opts);
    self.options = opts.options || [];
    self.value = wrapValue(opts.value);
    self.caption = opts.caption || 'Choose...';
    return self;
  };
  const listbox = opts => {
    const self = control('listbox', opts);
    self.options = opts.options || [];
    self.values = wrapArray(opts.values);
    return self;
  };
  const textbox = opts => {
    const self = control('textbox', opts);
    self.value = wrapValue(opts.value, '');
    self.event = lodash.isString(opts.event) ? opts.event : null;
    return self;
  };
  const textarea = opts => {
    const self = control('textarea', opts);
    self.value = wrapValue(opts.value, '');
    self.event = lodash.isString(opts.event) ? opts.event : null;
    self.rows = lodash.isNumber(opts.rows) ? opts.rows : 5;
    return self;
  };
  const button = opts => {
    const self = control('button', opts);
    self.click = lodash.isFunction(opts.click) ? opts.click : lodash.noop;
    return self;
  };
  Flow.Gui = {
    text,
    html,
    markdown,
    checkbox,
    dropdown,
    listbox,
    textbox,
    textarea,
    button,
  };
}
