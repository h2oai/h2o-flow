import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function async() {
  const lodash = window._;
  const Flow = window.Flow;
  const __slice = [].slice;
  const createBuffer = array => {
    let _go;
    const _array = array || [];
    _go = null;
    const buffer = element => {
      if (element === void 0) {
        return _array;
      }
      _array.push(element);
      if (_go) {
        _go(element);
      }
      return element;
    };
    buffer.subscribe = go => {
      _go = go;
      return _go;
    };
    buffer.buffer = _array;
    buffer.isBuffer = true;
    return buffer;
  };
  const _noop = go => go(null);
  const _applicate = go => (error, args) => {
    if (lodash.isFunction(go)) {
      return go(...[error].concat(args));
    }
  };
  const _fork = (f, args) => {
    if (!lodash.isFunction(f)) {
      throw new Error('Not a function.');
    }
    const self = go => {
      const canGo = lodash.isFunction(go);
      if (self.settled) {
        // proceed with cached error/result
        if (self.rejected) {
          if (canGo) {
            return go(self.error);
          }
        } else {
          if (canGo) {
            return go(null, self.result);
          }
        }
      } else {
        return _join(args, (error, args) => {
          if (error) {
            self.error = error;
            self.fulfilled = false;
            self.rejected = true;
            if (canGo) {
              return go(error);
            }
          } else {
            return f(...args.concat((error, result) => {
              if (error) {
                self.error = error;
                self.fulfilled = false;
                self.rejected = true;
                if (canGo) {
                  go(error);
                }
              } else {
                self.result = result;
                self.fulfilled = true;
                self.rejected = false;
                if (canGo) {
                  go(null, result);
                }
              }
              self.settled = true;
              self.pending = false;
              return self.pending;
            }));
          }
        });
      }
    };
    self.method = f;
    self.args = args;
    self.fulfilled = false;
    self.rejected = false;
    self.settled = false;
    self.pending = true;
    self.isFuture = true;
    return self;
  };
  const _isFuture = a => {
    if (a != null ? a.isFuture : void 0) {
      return true;
    }
    return false;
  };
  function _join(args, go) {
    let arg;
    let i;
    let _actual;
    let _i;
    let _len;
    let _settled;
    if (args.length === 0) {
      return go(null, []);
    }
    const _tasks = [];
    const _results = [];
    for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
      arg = args[i];
      if (arg != null ? arg.isFuture : void 0) {
        _tasks.push({
          future: arg,
          resultIndex: i,
        });
      } else {
        _results[i] = arg;
      }
    }
    if (_tasks.length === 0) {
      return go(null, _results);
    }
    _actual = 0;
    _settled = false;
    lodash.forEach(_tasks, task => task.future.call(null, (error, result) => {
      if (_settled) {
        return;
      }
      if (error) {
        _settled = true;
        go(new Flow.Error(`Error evaluating future[${task.resultIndex}]`, error));
      } else {
        _results[task.resultIndex] = result;
        _actual++;
        if (_actual === _tasks.length) {
          _settled = true;
          go(null, _results);
        }
      }
    }));
  }
  // Like _.compose, but async.
  // Equivalent to caolan/async.waterfall()
  const pipe = tasks => {
    const _tasks = tasks.slice(0);
    const next = (args, go) => {
      const task = _tasks.shift();
      if (task) {
        return task(...args.concat(function () {
          const error = arguments[0];
          const results = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
          if (error) {
            return go(error);
          }
          return next(results, go);
        }));
      }
      return go(...[null].concat(args));
    };
    return function () {
      let _i;
      const args = arguments.length >= 2 ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []);
      const go = arguments[_i++];
      return next(args, go);
    };
  };
  const iterate = tasks => {
    const _tasks = tasks.slice(0);
    const _results = [];
    const next = go => {
      const task = _tasks.shift();
      if (task) {
        return task((error, result) => {
          if (error) {
            return go(error);
          }
          _results.push(result);
          return next(go);
        });
      }
      // XXX should errors be included in arg #1?
      return go(null, _results);
    };
    return go => next(go);
  };

  //
  // Gives a synchronous operation an asynchronous signature.
  // Used to pass synchronous functions to callers that expect
  // asynchronous signatures.
  //
  const _async = function () {
    const f = arguments[0];
    const args = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
    const later = function () {
      let error;
      let result;
      let _i;
      const args = arguments.length >= 2 ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []);
      const go = arguments[_i++];
      try {
        result = f(...args);
        return go(null, result);
      } catch (_error) {
        error = _error;
        return go(error);
      }
    };
    return _fork(later, args);
  };

  //
  // Asynchronous find operation.
  //
  // find attr, prop, array
  // find array, attr, prop
  // find attr, obj
  // find obj, attr
  //
  const _find$3 = (attr, prop, obj) => {
    let v;
    let _i;
    let _len;
    if (_isFuture(obj)) {
      return _async(_find$3, attr, prop, obj);
    } else if (lodash.isArray(obj)) {
      for (_i = 0, _len = obj.length; _i < _len; _i++) {
        v = obj[_i];
        if (v[attr] === prop) {
          return v;
        }
      }
      return;
    }
  };
  const _find$2 = (attr, obj) => {
    if (_isFuture(obj)) {
      return _async(_find$2, attr, obj);
    } else if (lodash.isString(attr)) {
      if (lodash.isArray(obj)) {
        return _find$3('name', attr, obj);
      }
      return obj[attr];
    }
  };
  const _find = function () {
    let a;
    let b;
    let c;
    let ta;
    let tb;
    let tc;
    const args = arguments.length >= 1 ? __slice.call(arguments, 0) : [];
    switch (args.length) {
      case 3:
        a = args[0];
        b = args[1];
        c = args[2];
        ta = flowPrelude.typeOf(a);
        tb = flowPrelude.typeOf(b);
        tc = flowPrelude.typeOf(c);
        if (ta === 'Array' && tb === 'String') {
          return _find$3(b, c, a);
        } else if (ta === 'String' && (tc === 'Array')) {
          return _find$3(a, b, c);
        }
        break;
      case 2:
        a = args[0];
        b = args[1];
        if (!a) {
          return;
        }
        if (!b) {
          return;
        }
        if (lodash.isString(b)) {
          return _find$2(b, a);
        } else if (lodash.isString(a)) {
          return _find$2(a, b);
        }
        break;
      default:
        // do nothing
    }
  };

  // Duplicate of _find$2
  const _get = (attr, obj) => {
    if (_isFuture(obj)) {
      return _async(_get, attr, obj);
    } else if (lodash.isString(attr)) {
      if (lodash.isArray(obj)) {
        return _find$3('name', attr, obj);
      }
      return obj[attr];
    }
  };
  Flow.Async = {
    createBuffer, // XXX rename
    noop: _noop,
    applicate: _applicate,
    isFuture: _isFuture,
    fork: _fork,
    join: _join,
    pipe,
    iterate,
    async: _async,
    find: _find,
    get: _get,
  };
}
