export function flowPreludeFunction() {
  const Flow = window.Flow;
  const lodash = window._;
  const _isDefined = value => !lodash.isUndefined(value);
  const _isTruthy = value => {
    if (value) {
      return true;
    }
    return false;
  };
  const _isFalsy = value => {
    if (value) {
      return false;
    }
    return true;
  };
  const _negative = value => !value;
  const _always = () => true;
  const _never = () => false;
  const _copy = array => array.slice(0);
  const _remove = (array, element) => {
    const index = lodash.indexOf(array, element);
    if (index > -1) {
      return lodash.head(array.splice(index, 1));
    }
    return void 0;
  };
  const _words = text => text.split(/\s+/);
  const _repeat = (count, value) => {
    let i;
    let _i;
    const array = [];
    for (i = _i = 0; count >= 0 ? _i < count : _i > count; i = count >= 0 ? ++_i : --_i) {
      array.push(value);
    }
    return array;
  };
  const _typeOf = a => {
    const type = Object.prototype.toString.call(a);
    if (a === null) {
      return 'null';
    } else if (a === void 0) {
      return 'undefined';
    } else if (a === true || a === false || type === '[object Boolean]') {
      return 'Boolean';
    }
    switch (type) {
      case '[object String]':
        return 'String';
      case '[object Number]':
        return 'Number';
      case '[object Function]':
        return 'Function';
      case '[object Object]':
        return 'Object';
      case '[object Array]':
        return 'Array';
      case '[object Arguments]':
        return 'Arguments';
      case '[object Date]':
        return 'Date';
      case '[object RegExp]':
        return 'RegExp';
      case '[object Error]':
        return 'Error';
      default:
        return type;
    }
  };
  const _deepClone = obj => JSON.parse(JSON.stringify(obj));
  return {
    isDefined: _isDefined,
    isTruthy: _isTruthy,
    isFalsy: _isFalsy,
    negative: _negative,
    always: _always,
    never: _never,
    copy: _copy,
    remove: _remove,
    words: _words,
    repeat: _repeat,
    typeOf: _typeOf,
    deepClone: _deepClone,
    stringify: JSON.stringify,
  };
}

