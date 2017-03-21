import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function parseAndFormatObjectArray(source) {
  const lodash = window._;
  let element;
  let i;
  let _i;
  let _len;
  let _ref;
  let _ref1;
  const target = new Array(source.length);
  for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
    element = source[i];
    _ref = element.__meta;
    _ref1 = element.__meta;
    target[i] = element != null ? ((_ref) != null ? _ref.schema_type : void 0) === 'Key<Model>' ? `<a href=\'#\' data-type=\'model\' data-key=${flowPrelude.stringify(element.name)}>${lodash.escape(element.name)}</a>` : ((_ref1) != null ? _ref1.schema_type : void 0) === 'Key<Frame>' ? `<a href=\'#\' data-type=\'frame\' data-key=${flowPrelude.stringify(element.name)}>${lodash.escape(element.name)}</a>` : element : void 0;
  }
  return target;
}
