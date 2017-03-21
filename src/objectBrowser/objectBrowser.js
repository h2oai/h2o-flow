import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function objectBrowser() {
  const lodash = window._;
  const Flow = window.Flow;
  const isExpandable = type => {
    switch (type) {
      case 'null':
      case 'undefined':
      case 'Boolean':
      case 'String':
      case 'Number':
      case 'Date':
      case 'RegExp':
      case 'Arguments':
      case 'Function':
        return false;
      default:
        return true;
    }
  };
  const previewArray = array => {
    let element;
    const ellipsis = array.length > 5 ? ', ...' : '';
    const previews = (() => {
      let _i;
      let _len;
      const _ref = lodash.head(array, 5);
      const _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        element = _ref[_i];
        _results.push(preview(element));
      }
      return _results;
    })();
    return `[${previews.join(', ')}${ellipsis}]`;
  };
  const previewObject = object => {
    let count;
    let key;
    let value;
    count = 0;
    const previews = [];
    let ellipsis = '';
    for (key in object) {
      if ({}.hasOwnProperty.call(object, key)) {
        value = object[key];
        if (!(key !== '_flow_')) {
          continue;
        }
        previews.push(`${key}: ${preview(value)}`);
        if (++count === 5) {
          ellipsis = ', ...';
          break;
        }
      }
    }
    return `{${previews.join(', ')}${ellipsis}}`;
  };
  const preview = (element, recurse) => {
    if (recurse == null) {
      recurse = false;
    }
    const type = flowPrelude.typeOf(element);
    switch (type) {
      case 'Boolean':
      case 'String':
      case 'Number':
      case 'Date':
      case 'RegExp':
        return element;
      case 'undefined':
      case 'null':
      case 'Function':
      case 'Arguments':
        return type;
      case 'Array':
        if (recurse) {
          return previewArray(element);
        }
        return type;
        // break; // no-unreachable
      default:
        if (recurse) {
          return previewObject(element);
        }
        return type;
    }
  };
  // TODO slice large arrays
  Flow.objectBrowserElement = (key, object) => {
    const _expansions = Flow.Dataflow.signal(null);
    const _isExpanded = Flow.Dataflow.signal(false);
    const _type = flowPrelude.typeOf(object);
    const _canExpand = isExpandable(_type);
    const toggle = () => {
      let expansions;
      let value;
      if (!_canExpand) {
        return;
      }
      if (_expansions() === null) {
        expansions = [];
        for (key in object) {
          if ({}.hasOwnProperty.call(object, key)) {
            value = object[key];
            if (key !== '_flow_') {
              expansions.push(Flow.objectBrowserElement(key, value));
            }
          }
        }
        _expansions(expansions);
      }
      return _isExpanded(!_isExpanded());
    };
    return {
      key,
      preview: preview(object, true),
      toggle,
      expansions: _expansions,
      isExpanded: _isExpanded,
      canExpand: _canExpand,
    };
  };
  Flow.objectBrowser = (_, _go, key, object) => {
    lodash.defer(_go);
    return {
      object: Flow.objectBrowserElement(key, object),
      template: 'flow-object',
    };
  };
}
