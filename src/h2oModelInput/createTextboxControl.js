import { createControl } from './createControl';

export function createTextboxControl(parameter, type) {
  const lodash = window._;
  const Flow = window.Flow;
  let isArrayValued;
  let isInt;
  let isReal;
  isArrayValued = isInt = isReal = false;
  switch (type) {
    case 'byte[]':
    case 'short[]':
    case 'int[]':
    case 'long[]':
      isArrayValued = true;
      isInt = true;
      break;
    case 'float[]':
    case 'double[]':
      isArrayValued = true;
      isReal = true;
      break;
    case 'byte':
    case 'short':
    case 'int':
    case 'long':
      isInt = true;
      break;
    case 'float':
    case 'double':
      isReal = true;
      break;
    default:
        // do nothing
  }
  const _ref = parameter.actual_value;
  const _ref1 = parameter.actual_value;
  const _text = Flow.Dataflow.signal(isArrayValued ? (_ref != null ? _ref : []).join(', ') : _ref1 != null ? _ref1 : '');
  const _textGrided = Flow.Dataflow.signal(`${_text()};`);
  const textToValues = text => {
    let parsed;
    let vals;
    let value;
    let _i;
    let _len;
    let _ref2;
    if (isArrayValued) {
      vals = [];
      _ref2 = text.split(/\s*,\s*/g);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        value = _ref2[_i];
        if (isInt) {
          parsed = parseInt(value, 10);
          if (!lodash.isNaN(parsed)) {
            vals.push(parsed);
          }
        } else if (isReal) {
          parsed = parseFloat(value);
          if (!lodash.isNaN(parsed)) {
            vals.push(parsed);
          }
        } else {
          vals.push(value);
        }
      }
      return vals;
    }
    return text;
  };
  const _value = Flow.Dataflow.lift(_text, textToValues);
  const _valueGrided = Flow.Dataflow.lift(_textGrided, text => {
    let part;
    let token;
    let _i;
    let _len;
    lodash.values = [];
    const _ref2 = (`${text}`).split(/\s*;\s*/g);
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      part = _ref2[_i];
      token = part.trim();
      if (token) {
        lodash.values.push(textToValues(token));
      }
    }
    return lodash.values;
  });
  const control = createControl('textbox', parameter);
  control.text = _text;
  control.textGrided = _textGrided;
  control.value = _value;
  control.valueGrided = _valueGrided;
  control.isArrayValued = isArrayValued;
  return control;
}
