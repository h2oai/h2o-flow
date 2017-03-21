//
// Insane hack to compress large 2D data tables.
// The basis for doing this is described here:
// http://www.html5rocks.com/en/tutorials/speed/v8/
// See Tip #1 "Hidden Classes"
//
// Applies to IE as well:
// http://msdn.microsoft.com/en-us/library/windows/apps/hh781219.aspx#optimize_property_access
//
// http://jsperf.com/big-data-matrix/3
// As of 31 Oct 2014, for a 10000 row, 100 column table in Chrome,
//   retained memory sizes:
// raw json: 31,165 KB
// array of objects: 41,840 KB
// array of arrays: 14,960 KB
// array of prototyped instances: 14,840 KB
//
// Usage:
// Foo = Flow.Data.createCompiledPrototype [ 'bar', 'baz', 'qux', ... ]
// foo = new Foo()
//
export function data() {
  const lodash = window._;
  const Flow = window.Flow;
  let _prototypeId;
  const __slice = [].slice;
  _prototypeId = 0;
  const nextPrototypeName = () => `Map${++_prototypeId}`;
  const _prototypeCache = {};
  const createCompiledPrototype = attrs => {
    // Since the prototype depends only on attribute names,
    // return a cached prototype, if any.
    let attr;
    let i;
    const proto = _prototypeCache[cacheKey];
    const cacheKey = attrs.join('\0');
    if (proto) {
      return proto;
    }
    const params = (() => {
      let _i;
      let _ref;
      const _results = [];
      for (i = _i = 0, _ref = attrs.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
        _results.push(`a${i}`);
      }
      return _results;
    })();
    const inits = (() => {
      let _i;
      let _len;
      const _results = [];
      for (i = _i = 0, _len = attrs.length; _i < _len; i = ++_i) {
        attr = attrs[i];
        _results.push(`this[${JSON.stringify(attr)}]=a${i};`);
      }
      return _results;
    })();
    const prototypeName = nextPrototypeName();
    _prototypeCache[cacheKey] = new Function(`function ${prototypeName}(${params.join(',')}){${inits.join('')}} return ${prototypeName};`)(); // eslint-disable-line
    return _prototypeCache[cacheKey];
  };
  const createRecordConstructor = variables => {
    let variable;
    return createCompiledPrototype((() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = variables.length; _i < _len; _i++) {
        variable = variables[_i];
        _results.push(variable.label);
      }
      return _results;
    })());
  };
  const createTable = opts => {
    let description;
    let label;
    let variable;
    let _i;
    let _len;
    label = opts.label;
    description = opts.description;
    const variables = opts.variables;
    const rows = opts.rows;
    const meta = opts.meta;
    if (!description) {
      description = 'No description available.';
    }
    const schema = {};
    for (_i = 0, _len = variables.length; _i < _len; _i++) {
      variable = variables[_i];
      schema[variable.label] = variable;
    }
    const fill = (i, go) => {
      _fill(i, (error, result) => { // eslint-disable-line
        let index;
        let value;
        let _j;
        let _len1;
        if (error) {
          return go(error);
        }
        const startIndex = result.index;
        lodash.values = result.values;
        for (index = _j = 0, _len1 = lodash.values.length; _j < _len1; index = ++_j) {
          value = lodash.values[index];
          rows[startIndex + index] = lodash.values[index];
        }
        return go(null);
      });
    };
    const expand = (...args) => {
      let type;
      let _j;
      let _len1;
      const types = args.length >= 1 ? __slice.call(args, 0) : [];
      const _results = [];
      for (_j = 0, _len1 = types.length; _j < _len1; _j++) {
        type = types[_j];
        // TODO attach to prototype
        label = lodash.uniqueId('__flow_variable_');
        _results.push(schema[label] = createNumericVariable(label));
      }
      return _results;
    };
    return {
      label,
      description,
      schema,
      variables,
      rows,
      meta,
      fill,
      expand,
      _is_table_: true,
    };
  };
  const includeZeroInRange = range => {
    const lo = range[0];
    const hi = range[1];
    if (lo > 0 && hi > 0) {
      return [
        0,
        hi,
      ];
    } else if (lo < 0 && hi < 0) {
      return [
        lo,
        0,
      ];
    }
    return range;
  };
  const combineRanges = (...args) => {
    let hi;
    let lo;
    let range;
    let value;
    let _i;
    let _len;
    const ranges = args.length >= 1 ? __slice.call(args, 0) : [];
    lo = Number.POSITIVE_INFINITY;
    hi = Number.NEGATIVE_INFINITY;
    for (_i = 0, _len = ranges.length; _i < _len; _i++) {
      range = ranges[_i];
      value = range[0];
      if (lo > value) {
        lo = value;
      }
      value = range[1];
      if (hi < value) {
        hi = value;
      }
    }
    return [
      lo,
      hi,
    ];
  };
  const computeRange = (rows, attr) => {
    let hi;
    let lo;
    let row;
    let value;
    let _i;
    let _len;
    if (rows.length) {
      lo = Number.POSITIVE_INFINITY;
      hi = Number.NEGATIVE_INFINITY;
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        value = row[attr];
        if (value < lo) {
          lo = value;
        }
        if (value > hi) {
          hi = value;
        }
      }
      return [
        lo,
        hi,
      ];
    }
    return [
      -1,
      1,
    ];
  };
  const permute = (array, indices) => {
    let i;
    let index;
    let _i;
    let _len;
    const permuted = new Array(array.length);
    for (i = _i = 0, _len = indices.length; _i < _len; i = ++_i) {
      index = indices[i];
      permuted[i] = array[index];
    }
    return permuted;
  };
  const createAbstractVariable = (_label, _type, _domain, _format, _read) => ({
    label: _label,
    type: _type,
    domain: _domain || [],
    format: _format || lodash.identity,
    read: _read,
  });
  function createNumericVariable(_label, _domain, _format, _read) {
    const self = createAbstractVariable(_label, 'Number', _domain || [
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ], _format, _read);
    if (!self.read) {
      self.read = datum => {
        if (datum < self.domain[0]) {
          self.domain[0] = datum;
        }
        if (datum > self.domain[1]) {
          self.domain[1] = datum;
        }
        return datum;
      };
    }
    return self;
  }
  const createVariable = (_label, _type, _domain, _format, _read) => {
    if (_type === 'Number') {
      return createNumericVariable(_label, _domain, _format, _read);
    }
    return createAbstractVariable(_label, _type, _domain, _format, _read);
  };
  const createFactor = (_label, _domain, _format, _read) => {
    let level;
    let _i;
    let _id;
    let _len;
    let _ref;
    const self = createAbstractVariable(_label, 'Factor', _domain || [], _format, _read);
    _id = 0;
    const _levels = {};
    if (self.domain.length) {
      _ref = self.domain;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        level = _ref[_i];
        _levels[level] = _id++;
      }
    }
    if (!self.read) {
      self.read = datum => {
        let id;
        level = datum === void 0 || datum === null ? 'null' : datum;
        id = _levels[level];
        if (void 0 === id) {
          _levels[level] = id = _id++;
          self.domain.push(level);
        }
        return id;
      };
    }
    return self;
  };
  const factor = array => {
    let i;
    let id;
    let level;
    let _i;
    let _id;
    let _len;
    _id = 0;
    const levels = {};
    const domain = [];
    const data = new Array(array.length);
    for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
      level = array[i];
      id = levels[level];
      if (void 0 === id) {
        levels[level] = id = _id++;
        domain.push(level);
      }
      data[i] = id;
    }
    return [
      domain,
      data,
    ];
  };
  Flow.Data = {
    Table: createTable,
    Variable: createVariable,
    Factor: createFactor,
    computeColumnInterpretation(type) {
      if (type === 'Number') {
        return 'c';
      } else if (type === 'Factor') {
        return 'd';
      }
      return 't';
    },
    Record: createRecordConstructor,
    computeRange,
    combineRanges,
    includeZeroInRange,
    factor,
    permute,
  };
}
