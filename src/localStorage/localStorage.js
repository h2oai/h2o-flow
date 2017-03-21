export function localStorage() {
  const lodash = window._;
  const Flow = window.Flow;
  if (!(typeof window !== 'undefined' && window !== null ? window.localStorage : void 0)) {
    return;
  }
  const _ls = window.localStorage;
  const keyOf = (type, id) => `${type}:${id}`;
  const list = type => {
    let i;
    let id;
    let key;
    let t;
    let _i;
    let _ref;
    let _ref1;
    const objs = [];
    for (i = _i = 0, _ref = _ls.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
      key = _ls.key(i);
      _ref1 = key.split(':');
      t = _ref1[0];
      id = _ref1[1];
      if (type === t) {
        objs.push([
          type,
          id,
          JSON.parse(_ls.getItem(key)),
        ]);
      }
    }
    return objs;
  };
  const read = (type, id) => {
    const raw = _ls.getobj(keyOf(type, id));
    if (raw) {
      return JSON.parse(raw);
    }
    return null;
  };
  const write = (type, id, obj) => _ls.setItem(keyOf(type, id), JSON.stringify(obj));
  const purge = (type, id) => {
    if (id) {
      return _ls.removeItem(keyOf(type, id));
    }
    return purgeAll(type);
  };
  const purgeAll = type => {
    let i;
    let key;
    let _i;
    let _len;
    const allKeys = (() => {
      let _i;
      let _ref;
      const _results = [];
      for (i = _i = 0, _ref = _ls.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
        _results.push(_ls.key(i));
      }
      return _results;
    })();
    for (_i = 0, _len = allKeys.length; _i < _len; _i++) {
      key = allKeys[_i];
      if (type === lodash.head(key.split(':'))) {
        _ls.removeItem(key);
      }
    }
  };
  Flow.LocalStorage = {
    list,
    read,
    write,
    purge,
  };
}
