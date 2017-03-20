(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (factory());
}(this, function () { 'use strict';

    function flowPreludeFunction() {
      var Flow = window.Flow;
      var lodash = window._;
      var _isDefined = function _isDefined(value) {
        return !lodash.isUndefined(value);
      };
      var _isTruthy = function _isTruthy(value) {
        if (value) {
          return true;
        }
        return false;
      };
      var _isFalsy = function _isFalsy(value) {
        if (value) {
          return false;
        }
        return true;
      };
      var _negative = function _negative(value) {
        return !value;
      };
      var _always = function _always() {
        return true;
      };
      var _never = function _never() {
        return false;
      };
      var _copy = function _copy(array) {
        return array.slice(0);
      };
      var _remove = function _remove(array, element) {
        var index = lodash.indexOf(array, element);
        if (index > -1) {
          return lodash.head(array.splice(index, 1));
        }
        return void 0;
      };
      var _words = function _words(text) {
        return text.split(/\s+/);
      };
      var _repeat = function _repeat(count, value) {
        var i = void 0;
        var _i = void 0;
        var array = [];
        for (i = _i = 0; count >= 0 ? _i < count : _i > count; i = count >= 0 ? ++_i : --_i) {
          array.push(value);
        }
        return array;
      };
      var _typeOf = function _typeOf(a) {
        var type = Object.prototype.toString.call(a);
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
      var _deepClone = function _deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
      };
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
        stringify: JSON.stringify
      };
    }

    var flowPrelude$1 = flowPreludeFunction();

    function h2oImportModelOutput(_, _go, result) {
      var lodash = window._;
      var Flow = window.Flow;
      var viewModel = function viewModel() {
        return _.insertAndExecuteCell('cs', 'getModel ' + flowPrelude$1.stringify(result.models[0].model_id.name));
      };
      lodash.defer(_go);
      return {
        viewModel: viewModel,
        template: 'flow-import-model-output'
      };
    }

    function h2oFrameDataOutput(_, _go, _frame) {
      var lodash = window._;
      var Flow = window.Flow;
      var _lastUsedSearchTerm = void 0;
      var MaxItemsPerPage = 20;
      var _data = Flow.Dataflow.signal(null);
      var _columnNameSearchTerm = Flow.Dataflow.signal(null);
      var _currentPage = Flow.Dataflow.signal(0);
      var _maxPages = Flow.Dataflow.signal(Math.ceil(_frame.total_column_count / MaxItemsPerPage));
      var _canGoToPreviousPage = Flow.Dataflow.lift(_currentPage, function (index) {
        return index > 0;
      });
      var _canGoToNextPage = Flow.Dataflow.lift(_maxPages, _currentPage, function (maxPages, index) {
        return index < maxPages - 1;
      });
      var renderPlot = function renderPlot(container, render) {
        return render(function (error, vis) {
          if (error) {
            return console.debug(error);
          }
          return container(vis.element);
        });
      };
      var renderFrame = function renderFrame(frame) {
        return renderPlot(_data, _.plot(function (g) {
          return g(g.select(), g.from(_.inspect('data', frame)));
        }));
      };
      _lastUsedSearchTerm = null;
      var refreshColumns = function refreshColumns(pageIndex) {
        var searchTerm = _columnNameSearchTerm();
        if (searchTerm !== _lastUsedSearchTerm) {
          pageIndex = 0;
        }
        var startIndex = pageIndex * MaxItemsPerPage;
        var itemCount = startIndex + MaxItemsPerPage < _frame.total_column_count ? MaxItemsPerPage : _frame.total_column_count - startIndex;
        return _.requestFrameDataE(_, _frame.frame_id.name, searchTerm, startIndex, itemCount, function (error, frame) {
          if (error) {
            // empty
          } else {
            _lastUsedSearchTerm = searchTerm;
            _currentPage(pageIndex);
            return renderFrame(frame);
          }
        });
      };
      var goToPreviousPage = function goToPreviousPage() {
        var currentPage = _currentPage();
        if (currentPage > 0) {
          refreshColumns(currentPage - 1);
        }
      };
      var goToNextPage = function goToNextPage() {
        var currentPage = _currentPage();
        if (currentPage < _maxPages() - 1) {
          refreshColumns(currentPage + 1);
        }
      };
      Flow.Dataflow.react(_columnNameSearchTerm, lodash.throttle(refreshColumns, 500));
      renderFrame(_frame);
      lodash.defer(_go);
      return {
        key: _frame.frame_id.name,
        data: _data,
        columnNameSearchTerm: _columnNameSearchTerm,
        canGoToPreviousPage: _canGoToPreviousPage,
        canGoToNextPage: _canGoToNextPage,
        goToPreviousPage: goToPreviousPage,
        goToNextPage: goToNextPage,
        template: 'flow-frame-data-output'
      };
    }

    function h2oDataFrameOutput(_, _go, _result) {
      var lodash = window._;
      var Flow = window.Flow;
      var _dataFrameView = Flow.Dataflow.signal(null);
      var createDataFrameView = function createDataFrameView(result) {
        return {
          dataframe_id: result.dataframe_id
        };
      };
      _dataFrameView(createDataFrameView(_result));
      lodash.defer(_go);
      return {
        dataFrameView: _dataFrameView,
        template: 'flow-dataframe-output'
      };
    }

    function flowForm(_, _form, _go) {
      var lodash = window._;
      lodash.defer(_go);
      return {
        form: _form,
        template: 'flow-form',
        templateOf: function templateOf(control) {
          return control.template;
        }
      };
    }

    function _fork() {
      var Flow = window.Flow;
      var f = arguments[0];
      var __slice = [].slice;
      var args = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
      return Flow.Async.fork(f, args);
    }

    function _join() {
      var Flow = window.Flow;
      var __slice = [].slice;
      var _i = void 0;
      var args = arguments.length >= 2 ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []);
      var go = arguments[_i++];
      return Flow.Async.join(args, Flow.Async.applicate(go));
    }

    function _call() {
      var Flow = window.Flow;
      var __slice = [].slice;
      var go = arguments[0];
      var args = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
      return Flow.Async.join(args, Flow.Async.applicate(go));
    }

    function _apply(go, args) {
      var Flow = window.Flow;
      return Flow.Async.join(args, go);
    }

    function _plot(render, go) {
      var Flow = window.Flow;
      return render(function (error, vis) {
        if (error) {
          return go(new Flow.Error('Error rendering vis.', error));
        }
        return go(null, vis);
      });
    }

    function flow_(raw) {
      if (!raw._flow_) {
        raw._flow_ = { _cache_: {} };
      }
      return raw._flow_;
    }

    function inspect_(raw, inspectors) {
      var attr = void 0;
      var root = flow_(raw);
      if (root.inspect == null) {
        root.inspect = {};
      }
      for (attr in inspectors) {
        if ({}.hasOwnProperty.call(inspectors, attr)) {
          var f = inspectors[attr];
          root.inspect[attr] = f;
        }
      }
      return raw;
    }

    function ls(obj) {
      var lodash = window._;
      var Flow = window.Flow;
      var _isFuture = Flow.Async.isFuture;
      var _async = Flow.Async.async;
      var inspectors = void 0;
      var _ref1 = void 0;
      if (_isFuture(obj)) {
        return _async(ls, obj);
      }
      // if we refactor this for the rule no-cond-assign
      // then the model output breaks
      // TODO find a way to refactor that does not break model output
      if (inspectors = obj != null ? (_ref1 = obj._flow_) != null ? _ref1.inspect : void 0 : void 0) {
        // eslint-disable-line
        return lodash.keys(inspectors);
      }
      return [];
    }

    function parseNumbers(source) {
      var i = void 0;
      var value = void 0;
      var _i = void 0;
      var _len = void 0;
      var target = new Array(source.length);
      for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
        value = source[i];
        // TODO handle formatting
        target[i] = value === 'NaN' ? void 0 : value === 'Infinity' ? Number.POSITIVE_INFINITY : value === '-Infinity' ? Number.NEGATIVE_INFINITY : value;
      }
      return target;
    }

    function format4f(number) {
      if (number) {
        if (number === 'NaN') {
          return void 0;
        }
        return number.toFixed(4).replace(/\.0+$/, '.0');
      }
      return number;
    }

    function formatConfusionMatrix(cm) {
      var Flow = window.Flow;
      var _ref = cm.matrix;
      var _ref1 = _ref[0];
      var tn = _ref1[0];
      var fp = _ref1[1];
      var _ref2 = _ref[1];
      var fn = _ref2[0];
      var tp = _ref2[1];
      var fnr = fn / (tp + fn);
      var fpr = fp / (fp + tn);
      var domain = cm.domain;
      var _ref3 = Flow.HTML.template('table.flow-matrix', 'tbody', 'tr', 'td.strong.flow-center', 'td', 'td.bg-yellow');
      var table = _ref3[0];
      var tbody = _ref3[1];
      var tr = _ref3[2];
      var strong = _ref3[3];
      var normal = _ref3[4];
      var yellow = _ref3[5];
      return table([tbody([tr([strong('Actual/Predicted'), strong(domain[0]), strong(domain[1]), strong('Error'), strong('Rate')]), tr([strong(domain[0]), yellow(tn), normal(fp), normal(format4f(fpr)), normal(fp + ' / ' + (fp + tn))]), tr([strong(domain[1]), normal(fn), yellow(tp), normal(format4f(fnr)), normal(fn + ' / ' + (tp + fn))]), tr([strong('Total'), strong(tn + fn), strong(tp + fp), strong(format4f((fn + fp) / (fp + tn + tp + fn))), strong('' + fn + fp + ' / ' + (fp + tn + tp + fn))])])]);
    }

    function convertColumnToVector(column, data) {
      var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
      if (lightning.settings) {
        lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
        lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
      }

      var createVector = lightning.createVector;
      var createFactor = lightning.createFactor;
      var createList = lightning.createList;

      switch (column.type) {
        case 'byte':
        case 'short':
        case 'int':
        case 'integer':
        case 'long':
          return createVector(column.name, 'Number', parseNumbers(data));
        case 'float':
        case 'double':
          return createVector(column.name, 'Number', parseNumbers(data), format4f);
        case 'string':
          return createFactor(column.name, 'String', data);
        case 'matrix':
          return createList(column.name, data, formatConfusionMatrix);
        default:
          return createList(column.name, data);
      }
    }

    function convertTableToFrame(table, tableName, metadata) {
      var lodash = window._;

      var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
      if (lightning.settings) {
        lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
        lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
      }

      var createDataframe = lightning.createFrame;

      // TODO handle format strings and description
      var column = void 0;
      var i = void 0;
      var vectors = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = table.columns;
        var _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          column = _ref[i];
          _results.push(convertColumnToVector(column, table.data[i]));
        }
        return _results;
      }();
      return createDataframe(tableName, vectors, lodash.range(table.rowcount), null, metadata);
    }

    function inspectTwoDimTable_(origin, tableName, table) {
      return function () {
        return convertTableToFrame(table, tableName, {
          description: table.description || '',
          origin: origin
        });
      };
    }

    var asyncGenerator = function () {
      function AwaitValue(value) {
        this.value = value;
      }

      function AsyncGenerator(gen) {
        var front, back;

        function send(key, arg) {
          return new Promise(function (resolve, reject) {
            var request = {
              key: key,
              arg: arg,
              resolve: resolve,
              reject: reject,
              next: null
            };

            if (back) {
              back = back.next = request;
            } else {
              front = back = request;
              resume(key, arg);
            }
          });
        }

        function resume(key, arg) {
          try {
            var result = gen[key](arg);
            var value = result.value;

            if (value instanceof AwaitValue) {
              Promise.resolve(value.value).then(function (arg) {
                resume("next", arg);
              }, function (arg) {
                resume("throw", arg);
              });
            } else {
              settle(result.done ? "return" : "normal", result.value);
            }
          } catch (err) {
            settle("throw", err);
          }
        }

        function settle(type, value) {
          switch (type) {
            case "return":
              front.resolve({
                value: value,
                done: true
              });
              break;

            case "throw":
              front.reject(value);
              break;

            default:
              front.resolve({
                value: value,
                done: false
              });
              break;
          }

          front = front.next;

          if (front) {
            resume(front.key, front.arg);
          } else {
            back = null;
          }
        }

        this._invoke = send;

        if (typeof gen.return !== "function") {
          this.return = undefined;
        }
      }

      if (typeof Symbol === "function" && Symbol.asyncIterator) {
        AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
          return this;
        };
      }

      AsyncGenerator.prototype.next = function (arg) {
        return this._invoke("next", arg);
      };

      AsyncGenerator.prototype.throw = function (arg) {
        return this._invoke("throw", arg);
      };

      AsyncGenerator.prototype.return = function (arg) {
        return this._invoke("return", arg);
      };

      return {
        wrap: function (fn) {
          return function () {
            return new AsyncGenerator(fn.apply(this, arguments));
          };
        },
        await: function (value) {
          return new AwaitValue(value);
        }
      };
    }();

    var toConsumableArray = function (arr) {
      if (Array.isArray(arr)) {
        for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

        return arr2;
      } else {
        return Array.from(arr);
      }
    };

    function render_() {
      var Flow = window.Flow;
      var __slice = [].slice;
      var _ = arguments[0];
      var raw = arguments[1];
      var render = arguments[2];
      var args = arguments.length >= 4 ? __slice.call(arguments, 3) : [];
      // Prepend current context (_) and a continuation (go)
      flow_(raw).render = function (go) {
        return render.apply(undefined, toConsumableArray([_, go].concat(args)));
      };
      return raw;
    }

    function proceed(_, func, args, go) {
      return go(null, render_.apply(undefined, [_].concat(toConsumableArray([{}, func].concat(args || [])))));
    }

    function extendGuiForm(_, form) {
      return render_(_, form, flowForm, form);
    }

    function createGui(_, controls, go) {
      var Flow = window.Flow;
      return go(null, extendGuiForm(_, Flow.Dataflow.signals(controls || [])));
    }

    // not used anywhere beyond src/routines/routines?
    // replaced by src/gui/gui?
    function gui(_, controls) {
      var Flow = window.Flow;
      _fork(createGui, _, controls);
      var _ref = Flow.Gui;
      var nameThing = void 0;
      for (nameThing in _ref) {
        if ({}.hasOwnProperty.call(_ref, nameThing)) {
          var f = _ref[nameThing];
          gui[nameThing] = f;
        }
      }
    }

    var _assistance = {
      importFiles: {
        description: 'Import file(s) into H<sub>2</sub>O',
        icon: 'files-o'
      },
      getFrames: {
        description: 'Get a list of frames in H<sub>2</sub>O',
        icon: 'table'
      },
      splitFrame: {
        description: 'Split a frame into two or more frames',
        icon: 'scissors'
      },
      mergeFrames: {
        description: 'Merge two frames into one',
        icon: 'link'
      },
      getModels: {
        description: 'Get a list of models in H<sub>2</sub>O',
        icon: 'cubes'
      },
      getGrids: {
        description: 'Get a list of grid search results in H<sub>2</sub>O',
        icon: 'th'
      },
      getPredictions: {
        description: 'Get a list of predictions in H<sub>2</sub>O',
        icon: 'bolt'
      },
      getJobs: {
        description: 'Get a list of jobs running in H<sub>2</sub>O',
        icon: 'tasks'
      },
      buildModel: {
        description: 'Build a model',
        icon: 'cube'
      },
      importModel: {
        description: 'Import a saved model',
        icon: 'cube'
      },
      predict: {
        description: 'Make a prediction',
        icon: 'bolt'
      }
    };

    var flowPrelude$4 = flowPreludeFunction();

    function inspectFrameColumns(tableLabel, frameKey, frame, frameColumns) {
      return function () {
        var lodash = window._;
        var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
        if (lightning.settings) {
          lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
          lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
        }
        var createVector = lightning.createVector;
        var createFactor = lightning.createFactor;
        var createList = lightning.createList;
        var createDataframe = lightning.createFrame;
        var attr = void 0;
        var column = void 0;
        var i = void 0;
        var title = void 0;
        var attrs = ['label', 'type', 'missing_count|Missing', 'zero_count|Zeros', 'positive_infinity_count|+Inf', 'negative_infinity_count|-Inf', 'min', 'max', 'mean', 'sigma', 'cardinality'];
        var toColumnSummaryLink = function toColumnSummaryLink(label) {
          return '<a href=\'#\' data-type=\'summary-link\' data-key=' + flowPrelude$4.stringify(label) + '>' + lodash.escape(label) + '</a>';
        };
        var toConversionLink = function toConversionLink(value) {
          var _ref1 = value.split('\0');
          var type = _ref1[0];
          var label = _ref1[1];
          switch (type) {
            case 'enum':
              return '<a href=\'#\' data-type=\'as-numeric-link\' data-key=' + flowPrelude$4.stringify(label) + '>Convert to numeric</a>';
            case 'int':
            case 'string':
              return '<a href=\'#\' data-type=\'as-factor-link\' data-key=' + flowPrelude$4.stringify(label) + '>Convert to enum</a>';
            default:
              return void 0;
          }
        };
        var vectors = function () {
          // XXX format functions
          var _i = void 0;
          var _len = void 0;
          var _ref1 = void 0;
          var _results = [];

          var _loop = function _loop() {
            attr = attrs[_i];
            _ref1 = attr.split('|');
            var columnName = _ref1[0];
            title = _ref1[1];
            title = title != null ? title : columnName;
            switch (columnName) {
              case 'min':
                _results.push(createVector(title, 'Number', function () {
                  var _j = void 0;
                  var _len1 = void 0;
                  var _results1 = [];
                  for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                    column = frameColumns[_j];
                    _results1.push(lodash.head(column.mins));
                  }
                  return _results1;
                }(), format4f));
                break;
              case 'max':
                _results.push(createVector(title, 'Number', function () {
                  var _j = void 0;
                  var _len1 = void 0;
                  var _results1 = [];
                  for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                    column = frameColumns[_j];
                    _results1.push(lodash.head(column.maxs));
                  }
                  return _results1;
                }(), format4f));
                break;
              case 'cardinality':
                _results.push(createVector(title, 'Number', function () {
                  var _j = void 0;
                  var _len1 = void 0;
                  var _results1 = [];
                  for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                    column = frameColumns[_j];
                    _results1.push(column.type === 'enum' ? column.domain_cardinality : void 0);
                  }
                  return _results1;
                }()));
                break;
              case 'label':
                _results.push(createFactor(title, 'String', function () {
                  var _j = void 0;
                  var _len1 = void 0;
                  var _results1 = [];
                  for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                    column = frameColumns[_j];
                    _results1.push(column[columnName]);
                  }
                  return _results1;
                }(), null, toColumnSummaryLink));
                break;
              case 'type':
                _results.push(createFactor(title, 'String', function () {
                  var _j = void 0;
                  var _len1 = void 0;
                  var _results1 = [];
                  for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                    column = frameColumns[_j];
                    _results1.push(column[columnName]);
                  }
                  return _results1;
                }()));
                break;
              case 'mean':
              case 'sigma':
                _results.push(createVector(title, 'Number', function () {
                  var _j = void 0;
                  var _len1 = void 0;
                  var _results1 = [];
                  for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                    column = frameColumns[_j];
                    _results1.push(column[columnName]);
                  }
                  return _results1;
                }(), format4f));
                break;
              default:
                _results.push(createVector(title, 'Number', function () {
                  var _j = void 0;
                  var _len1 = void 0;
                  var _results1 = [];
                  for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                    column = frameColumns[_j];
                    _results1.push(column[columnName]);
                  }
                  return _results1;
                }()));
            }
          };

          for (_i = 0, _len = attrs.length; _i < _len; _i++) {
            _loop();
          }
          return _results;
        }();
        var labelVector = vectors[0];
        var typeVector = vectors[1];
        var actionsData = function () {
          var _i = void 0;
          var _ref1 = void 0;
          var _results = [];
          for (i = _i = 0, _ref1 = frameColumns.length; _ref1 >= 0 ? _i < _ref1 : _i > _ref1; i = _ref1 >= 0 ? ++_i : --_i) {
            _results.push(typeVector.valueAt(i) + '\0' + labelVector.valueAt(i));
          }
          return _results;
        }();
        vectors.push(createFactor('Actions', 'String', actionsData, null, toConversionLink));
        return createDataframe(tableLabel, vectors, lodash.range(frameColumns.length), null, {
          description: 'A list of ' + tableLabel + ' in the H2O Frame.',
          origin: 'getFrameSummary ' + flowPrelude$4.stringify(frameKey),
          plot: 'plot inspect \'' + tableLabel + '\', getFrameSummary ' + flowPrelude$4.stringify(frameKey)
        });
      };
    }

    function parseNulls(source) {
      var element = void 0;
      var i = void 0;
      var _i = void 0;
      var _len = void 0;
      var target = new Array(source.length);
      for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
        element = source[i];
        target[i] = element != null ? element : void 0;
      }
      return target;
    }

    function parseNaNs(source) {
      var element = void 0;
      var i = void 0;
      var _i = void 0;
      var _len = void 0;
      var target = new Array(source.length);
      for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
        element = source[i];
        target[i] = element === 'NaN' ? void 0 : element;
      }
      return target;
    }

    var flowPrelude$5 = flowPreludeFunction();

    function inspectFrameData(frameKey, frame) {
      return function () {
        var lodash = window._;
        var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
        if (lightning.settings) {
          lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
          lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
        }
        var createVector = lightning.createVector;
        var createFactor = lightning.createFactor;
        var createList = lightning.createList;
        var createDataframe = lightning.createFrame;
        var column = void 0;
        var domain = void 0;
        var index = void 0;
        var rowIndex = void 0;
        var frameColumns = frame.columns;
        var vectors = function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = frameColumns.length; _i < _len; _i++) {
            column = frameColumns[_i];
            switch (column.type) {
              case 'int':
              case 'real':
                _results.push(createVector(column.label, 'Number', parseNaNs(column.data), format4f));
                break;
              case 'enum':
                domain = column.domain;
                _results.push(createFactor(column.label, 'String', function () {
                  var _j = void 0;
                  var _len1 = void 0;
                  var _ref1 = column.data;
                  var _results1 = [];
                  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                    index = _ref1[_j];
                    _results1.push(index != null ? domain[index] : void 0);
                  }
                  return _results1;
                }()));
                break;
              case 'time':
                _results.push(createVector(column.label, 'Number', parseNaNs(column.data)));
                break;
              case 'string':
              case 'uuid':
                _results.push(createList(column.label, parseNulls(column.string_data)));
                break;
              default:
                _results.push(createList(column.label, parseNulls(column.data)));
            }
          }
          return _results;
        }();
        vectors.unshift(createVector('Row', 'Number', function () {
          var _i = void 0;
          var _ref1 = void 0;
          var _ref2 = void 0;
          var _results = [];
          for (rowIndex = _i = _ref1 = frame.row_offset, _ref2 = frame.row_count; _ref1 <= _ref2 ? _i < _ref2 : _i > _ref2; rowIndex = _ref1 <= _ref2 ? ++_i : --_i) {
            _results.push(rowIndex + 1);
          }
          return _results;
        }()));
        return createDataframe('data', vectors, lodash.range(frame.row_count - frame.row_offset), null, {
          description: 'A partial list of rows in the H2O Frame.',
          origin: 'getFrameData ' + flowPrelude$5.stringify(frameKey)
        });
      };
    }

    var flowPrelude$6 = flowPreludeFunction();

    function createModel(_) {
      var codeCellCode = 'assist buildModel, null, training_frame: ' + flowPrelude$6.stringify(_.frame.frame_id.name);
      return _.insertAndExecuteCell('cs', codeCellCode);
    }

    var flowPrelude$7 = flowPreludeFunction();

    function inspect(_) {
      var codeCellCode = 'inspect getFrameSummary ' + flowPrelude$7.stringify(_.frame.frame_id.name);
      return _.insertAndExecuteCell('cs', codeCellCode);
    }

    var flowPrelude$8 = flowPreludeFunction();

    function inspectData(_) {
      var codeCellCode = 'getFrameData ' + flowPrelude$8.stringify(_.frame.frame_id.name);
      return _.insertAndExecuteCell('cs', codeCellCode);
    }

    var flowPrelude$9 = flowPreludeFunction();

    function splitFrame(_) {
      var codeCellCode = 'assist splitFrame, ' + flowPrelude$9.stringify(_.frame.frame_id.name);
      return _.insertAndExecuteCell('cs', codeCellCode);
    }

    var flowPrelude$10 = flowPreludeFunction();

    function predict(_) {
      var codeCellCode = 'predict frame: ' + flowPrelude$10.stringify(_.frame.frame_id.name);
      return _.insertAndExecuteCell('cs', codeCellCode);
    }

    function download(_) {
      return window.open('' + window.Flow.ContextPath + ('3/DownloadDataset?frame_id=' + encodeURIComponent(_.frame.frame_id.name)), '_blank');
    }

    var flowPrelude$11 = flowPreludeFunction();

    function exportFrame(_) {
      var codeCellCode = 'exportFrame ' + flowPrelude$11.stringify(_.frame.frame_id.name);
      return _.insertAndExecuteCell('cs', codeCellCode);
    }

    var flowPrelude$12 = flowPreludeFunction();

    function deleteFrame(_) {
      return _.confirm('Are you sure you want to delete this frame?', {
        acceptCaption: 'Delete Frame',
        declineCaption: 'Cancel'
      }, function (accept) {
        if (accept) {
          var codeCellCode = 'deleteFrame ' + flowPrelude$12.stringify(_.frame.frame_id.name);
          return _.insertAndExecuteCell('cs', codeCellCode);
        }
      });
    }

    function renderPlot(container, render) {
      return render(function (error, vis) {
        if (error) {
          return console.debug(error);
        }
        return container(vis.element);
      });
    }

    var flowPrelude$13 = flowPreludeFunction();

    function renderGrid(_, render) {
      var $ = window.jQuery;
      return render(function (error, vis) {
        if (error) {
          return console.debug(error);
        }
        $('a', vis.element).on('click', function (e) {
          var $a = $(e.target);
          switch ($a.attr('data-type')) {
            case 'summary-link':
              return _.insertAndExecuteCell('cs', 'getColumnSummary ' + flowPrelude$13.stringify(_.frame.frame_id.name) + ', ' + flowPrelude$13.stringify($a.attr('data-key')));
            case 'as-factor-link':
              return _.insertAndExecuteCell('cs', 'changeColumnType frame: ' + flowPrelude$13.stringify(_.frame.frame_id.name) + ', column: ' + flowPrelude$13.stringify($a.attr('data-key')) + ', type: \'enum\'');
            case 'as-numeric-link':
              return _.insertAndExecuteCell('cs', 'changeColumnType frame: ' + flowPrelude$13.stringify(_.frame.frame_id.name) + ', column: ' + flowPrelude$13.stringify($a.attr('data-key')) + ', type: \'int\'');
            default:
            // do nothing
          }
        });
        return _.grid(vis.element);
      });
    }

    function renderFrame(_, _chunkSummary, _distributionSummary, frame) {
      var gridPlotFunction = _.plot(function (g) {
        return g(g.select(), g.from(_.inspect('columns', frame)));
      });
      var chunkSummaryPlotFunction = _.plot(function (g) {
        return g(g.select(), g.from(_.inspect('Chunk compression summary', frame)));
      });
      var distributionSummaryPlotFunction = _.plot(function (g) {
        return g(g.select(), g.from(_.inspect('Frame distribution summary', frame)));
      });
      renderGrid(_, gridPlotFunction);
      renderPlot(_chunkSummary, chunkSummaryPlotFunction);
      return renderPlot(_distributionSummary, distributionSummaryPlotFunction);
    }

    function formatBytes(bytes) {
      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) {
        return '0 Byte';
      }
      var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
      return Math.round(bytes / Math.pow(1024, i), 2) + sizes[i];
    }

    function h2oFrameOutput(_, _go, _frame) {
      var lodash = window._;
      var Flow = window.Flow;
      _.frame = _frame;
      var _lastUsedSearchTerm = void 0;
      var MaxItemsPerPage = 20;
      _.grid = Flow.Dataflow.signal(null);
      var _chunkSummary = Flow.Dataflow.signal(null);
      var _distributionSummary = Flow.Dataflow.signal(null);
      var _columnNameSearchTerm = Flow.Dataflow.signal(null);
      var _currentPage = Flow.Dataflow.signal(0);
      var _maxPages = Flow.Dataflow.signal(Math.ceil(_.frame.total_column_count / MaxItemsPerPage));
      var _canGoToPreviousPage = Flow.Dataflow.lift(_currentPage, function (index) {
        return index > 0;
      });
      var _canGoToNextPage = Flow.Dataflow.lift(_maxPages, _currentPage, function (maxPages, index) {
        return index < maxPages - 1;
      });
      _lastUsedSearchTerm = null;

      // some messy state here
      // attempting to abstract this out produces an error
      // defer for now
      var refreshColumns = function refreshColumns(pageIndex) {
        var searchTerm = _columnNameSearchTerm();
        if (searchTerm !== _lastUsedSearchTerm) {
          pageIndex = 0;
        }
        var startIndex = pageIndex * MaxItemsPerPage;
        var itemCount = startIndex + MaxItemsPerPage < _.frame.total_column_count ? MaxItemsPerPage : _.frame.total_column_count - startIndex;
        return _.requestFrameSummarySliceE(_, _.frame.frame_id.name, searchTerm, startIndex, itemCount, function (error, frame) {
          if (error) {
            // empty
            // TODO
          } else {
            _lastUsedSearchTerm = searchTerm;
            _currentPage(pageIndex);
            return renderFrame(_, _chunkSummary, _distributionSummary, frame);
          }
        });
      };
      var goToPreviousPage = function goToPreviousPage() {
        var currentPage = _currentPage();
        if (currentPage > 0) {
          refreshColumns(currentPage - 1);
        }
      };
      var goToNextPage = function goToNextPage() {
        var currentPage = _currentPage();
        if (currentPage < _maxPages() - 1) {
          refreshColumns(currentPage + 1);
        }
      };
      Flow.Dataflow.react(_columnNameSearchTerm, lodash.throttle(refreshColumns, 500));
      renderFrame(_, _chunkSummary, _distributionSummary, _.frame);
      lodash.defer(_go);
      return {
        key: _.frame.frame_id.name,
        rowCount: _.frame.rows,
        columnCount: _.frame.total_column_count,
        size: formatBytes(_.frame.byte_size),
        chunkSummary: _chunkSummary,
        distributionSummary: _distributionSummary,
        columnNameSearchTerm: _columnNameSearchTerm,
        grid: _.grid,
        inspect: inspect.bind(this, _),
        createModel: createModel.bind(this, _),
        inspectData: inspectData.bind(this, _),
        splitFrame: splitFrame.bind(this, _),
        predict: predict.bind(this, _),
        download: download.bind(this, _),
        exportFrame: exportFrame.bind(this, _),
        canGoToPreviousPage: _canGoToPreviousPage,
        canGoToNextPage: _canGoToNextPage,
        goToPreviousPage: goToPreviousPage,
        goToNextPage: goToNextPage,
        deleteFrame: deleteFrame.bind(this, _),
        template: 'flow-frame-output'
      };
    }

    var flowPrelude$3 = flowPreludeFunction();

    function extendFrame(_, frameKey, frame) {
      var column = void 0;
      var inspections = {
        columns: inspectFrameColumns('columns', frameKey, frame, frame.columns),
        data: inspectFrameData(frameKey, frame)
      };
      var enumColumns = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref1 = frame.columns;
        var _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          column = _ref1[_i];
          if (column.type === 'enum') {
            _results.push(column);
          }
        }
        return _results;
      }();
      if (enumColumns.length > 0) {
        inspections.factors = inspectFrameColumns('factors', frameKey, frame, enumColumns);
      }
      var origin = 'getFrameSummary ' + flowPrelude$3.stringify(frameKey);
      inspections[frame.chunk_summary.name] = inspectTwoDimTable_(origin, frame.chunk_summary.name, frame.chunk_summary);
      inspections[frame.distribution_summary.name] = inspectTwoDimTable_(origin, frame.distribution_summary.name, frame.distribution_summary);
      inspect_(frame, inspections);
      return render_(_, frame, h2oFrameOutput, frame);
    }

    function optsToString(opts) {
      var str = void 0;
      if (opts != null) {
        str = ' with opts ' + JSON.stringify(opts);
        if (str.length > 50) {
          return str.substr(0, 50) + '...';
        }
        return str;
      }
      return '';
    }

    function trackPath(_, path) {
      var base = void 0;
      var e = void 0;
      var name = void 0;
      var other = void 0;
      var root = void 0;
      var version = void 0;
      var _ref = void 0;
      var _ref1 = void 0;
      try {
        _ref = path.split('/');
        root = _ref[0];
        version = _ref[1];
        name = _ref[2];
        _ref1 = name.split('?');
        base = _ref1[0];
        other = _ref1[1];
        if (base !== 'Typeahead' && base !== 'Jobs') {
          _.trackEvent('api', base, version);
        }
      } catch (_error) {
        e = _error;
      }
    }

    function httpRequestFailFunction(_, path, go, method, opts, xhr, status, error) {
      var Flow = window.Flow;
      var serverError = void 0;
      _.status('server', 'error', path);
      var response = xhr.responseJSON;
      // special-case net::ERR_CONNECTION_REFUSED
      // if status is 'error' and xhr.status is 0
      var cause = void 0;

      // if there is a response
      if (typeof response !== 'undefined') {
        // if the response has a __meta metadata property
        if (typeof response.__meta !== 'undefined') {
          // if that metadata property has one of two specific schema types
          if (response.__meta.schema_type === 'H2OError' || response.__meta.schema_type === 'H2OModelBuilderError') {
            serverError = new Flow.Error(response.exception_msg);
            serverError.stack = response.dev_msg + ' (' + response.exception_type + ')\n  ' + response.stacktrace.join('\n  ');
            cause = serverError;
          } else if (typeof error !== 'undefined' && error !== null ? error.message : void 0) {
            cause = new Flow.Error(error.message);
          } else {
            // special-case net::ERR_CONNECTION_REFUSED
            if (status === 'error' && xhr.status === 0) {
              cause = new Flow.Error('Could not connect to H2O. Your H2O cloud is currently unresponsive.');
            } else {
              cause = new Flow.Error('HTTP connection failure: status=' + status + ', code=' + xhr.status + ', error=' + (error || '?'));
            }
          }
        }
      }
      return go(new Flow.Error('Error calling ' + method + ' ' + path + optsToString(opts), cause));
    }

    function http(_, method, path, opts, go) {
      var Flow = window.Flow;
      var $ = window.jQuery;
      if (path.substring(0, 1) === '/') {
        path = window.Flow.ContextPath + path.substring(1);
      }
      _.status('server', 'request', path);
      trackPath(_, path);
      var req = function () {
        switch (method) {
          case 'GET':
            return $.getJSON(path);
          case 'POST':
            return $.post(path, opts);
          case 'POSTJSON':
            return $.ajax({
              url: path,
              type: 'POST',
              contentType: 'application/json',
              cache: false,
              data: JSON.stringify(opts)
            });
          case 'PUT':
            return $.ajax({
              url: path,
              type: method,
              data: opts
            });
          case 'DELETE':
            return $.ajax({
              url: path,
              type: method
            });
          case 'UPLOAD':
            return $.ajax({
              url: path,
              type: 'POST',
              data: opts,
              cache: false,
              contentType: false,
              processData: false
            });
          default:
          // do nothing
        }
      }();
      req.done(function (data, status, xhr) {
        var error = void 0;
        _.status('server', 'response', path);
        try {
          return go(null, data);
        } catch (_error) {
          error = _error;
          return go(new Flow.Error('Error processing ' + method + ' ' + path, error));
        }
      });
      var boundHttpRequestFailFunction = httpRequestFailFunction.bind(this, _, path, go, method, opts);
      return req.fail(boundHttpRequestFailFunction);
    }

    function doGet(_, path, go) {
      return http(_, 'GET', path, null, go);
    }

    function unwrap(go, transform) {
      return function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, transform(result));
      };
    }

    function requestFrameSlice(_, key, searchTerm, offset, count, go) {
      var lodash = window._;
      // TODO send search term
      return doGet(_, '/3/Frames/' + encodeURIComponent(key) + '?column_offset=' + offset + '&column_count=' + count, unwrap(go, function (result) {
        return lodash.head(result.frames);
      }));
    }

    function requestFrame(_, frameKey, go) {
      return requestFrameSlice(_, frameKey, void 0, 0, 20, function (error, frame) {
        if (error) {
          return go(error);
        }
        return go(null, extendFrame(_, frameKey, frame));
      });
    }

    var flowPrelude$14 = flowPreludeFunction();

    function extendFrameData(_, frameKey, frame) {
      var inspections = { data: inspectFrameData(frameKey, frame) };
      var origin = 'getFrameData ' + flowPrelude$14.stringify(frameKey);
      inspect_(frame, inspections);
      return render_(_, frame, h2oFrameDataOutput, frame);
    }

    function requestFrameData(_, frameKey, searchTerm, offset, count, go) {
      return requestFrameSlice(_, frameKey, searchTerm, offset, count, function (error, frame) {
        if (error) {
          return go(error);
        }
        return go(null, extendFrameData(_, frameKey, frame));
      });
    }

    function createArrays(count, length) {
      var i = void 0;
      var _i = void 0;
      var _results = [];
      for (i = _i = 0; count >= 0 ? _i < count : _i > count; i = count >= 0 ? ++_i : --_i) {
        _results.push(new Array(length));
      }
      return _results;
    }

    var flowPrelude$16 = flowPreludeFunction();

    function h2oColumnSummaryOutput(_, _go, frameKey, frame, columnName) {
      var lodash = window._;
      var Flow = window.Flow;
      var table = void 0;
      var column = lodash.head(frame.columns);
      var _characteristicsPlot = Flow.Dataflow.signal(null);
      var _summaryPlot = Flow.Dataflow.signal(null);
      var _distributionPlot = Flow.Dataflow.signal(null);
      var _domainPlot = Flow.Dataflow.signal(null);
      var renderPlot = function renderPlot(target, render) {
        return render(function (error, vis) {
          if (error) {
            return console.debug(error);
          }
          return target(vis.element);
        });
      };
      table = _.inspect('characteristics', frame);
      if (table) {
        renderPlot(_characteristicsPlot, _.plot(function (g) {
          return g(g.rect(g.position(g.stack(g.avg('percent'), 0), 'All'), g.fillColor('characteristic')), g.groupBy(g.factor(g.value('All')), 'characteristic'), g.from(table));
        }));
      }
      table = _.inspect('distribution', frame);
      if (table) {
        renderPlot(_distributionPlot, _.plot(function (g) {
          return g(g.rect(g.position('interval', 'count'), g.width(g.value(1))), g.from(table));
        }));
      }
      table = _.inspect('summary', frame);
      if (table) {
        renderPlot(_summaryPlot, _.plot(function (g) {
          return g(g.schema(g.position('min', 'q1', 'q2', 'q3', 'max', 'column')), g.from(table));
        }));
      }
      table = _.inspect('domain', frame);
      if (table) {
        renderPlot(_domainPlot, _.plot(function (g) {
          return g(g.rect(g.position('count', 'label')), g.from(table), g.limit(1000));
        }));
      }
      var impute = function impute() {
        return _.insertAndExecuteCell('cs', 'imputeColumn frame: ' + flowPrelude$16.stringify(frameKey) + ', column: ' + flowPrelude$16.stringify(columnName));
      };
      var inspect = function inspect() {
        return _.insertAndExecuteCell('cs', 'inspect getColumnSummary ' + flowPrelude$16.stringify(frameKey) + ', ' + flowPrelude$16.stringify(columnName));
      };
      lodash.defer(_go);
      return {
        label: column.label,
        characteristicsPlot: _characteristicsPlot,
        summaryPlot: _summaryPlot,
        distributionPlot: _distributionPlot,
        domainPlot: _domainPlot,
        impute: impute,
        inspect: inspect,
        template: 'flow-column-summary-output'
      };
    }

    var flowPrelude$15 = flowPreludeFunction();

    function extendColumnSummary(_, frameKey, frame, columnName) {
      var lodash = window._;
      var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
      if (lightning.settings) {
        lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
        lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
      }
      var createVector = lightning.createVector;
      var createFactor = lightning.createFactor;
      var createList = lightning.createList;
      var createDataframe = lightning.createFrame;
      var column = lodash.head(frame.columns);
      var rowCount = frame.rows;
      var inspectPercentiles = function inspectPercentiles() {
        var vectors = [createVector('percentile', 'Number', frame.default_percentiles), createVector('value', 'Number', column.percentiles)];
        return createDataframe('percentiles', vectors, lodash.range(frame.default_percentiles.length), null, {
          description: 'Percentiles for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
          origin: 'getColumnSummary ' + flowPrelude$15.stringify(frameKey) + ', ' + flowPrelude$15.stringify(columnName)
        });
      };
      var inspectDistribution = function inspectDistribution() {
        var binCount = void 0;
        var binIndex = void 0;
        var count = void 0;
        var countData = void 0;
        var i = void 0;
        var intervalData = void 0;
        var m = void 0;
        var n = void 0;
        var widthData = void 0;
        var _i = void 0;
        var _j = void 0;
        var _k = void 0;
        var _l = void 0;
        var _len = void 0;
        var _ref1 = void 0;
        var minBinCount = 32;
        var base = column.histogram_base;
        var stride = column.histogram_stride;
        var bins = column.histogram_bins;
        var width = Math.ceil(bins.length / minBinCount);
        var interval = stride * width;
        var rows = [];
        if (width > 0) {
          binCount = minBinCount + (bins.length % width > 0 ? 1 : 0);
          intervalData = new Array(binCount);
          widthData = new Array(binCount);
          countData = new Array(binCount);

          // Trim off empty bins from the end
          for (i = _i = 0; binCount >= 0 ? _i < binCount : _i > binCount; i = binCount >= 0 ? ++_i : --_i) {
            m = i * width;
            n = m + width;
            count = 0;
            for (binIndex = _j = m; m <= n ? _j < n : _j > n; binIndex = m <= n ? ++_j : --_j) {
              if (binIndex < bins.length) {
                count += bins[binIndex];
              }
            }
            intervalData[i] = base + i * interval;
            widthData[i] = interval;
            countData[i] = count;
          }
        } else {
          binCount = bins.length;
          intervalData = new Array(binCount);
          widthData = new Array(binCount);
          countData = new Array(binCount);
          for (i = _k = 0, _len = bins.length; _k < _len; i = ++_k) {
            count = bins[i];
            intervalData[i] = base + i * stride;
            widthData[i] = stride;
            countData[i] = count;
          }
        }
        for (i = _l = _ref1 = binCount - 1; _ref1 <= 0 ? _l <= 0 : _l >= 0; i = _ref1 <= 0 ? ++_l : --_l) {
          if (countData[i] !== 0) {
            binCount = i + 1;
            intervalData = intervalData.slice(0, binCount);
            widthData = widthData.slice(0, binCount);
            countData = countData.slice(0, binCount);
            break;
          }
        }
        var vectors = [createFactor('interval', 'String', intervalData), createVector('width', 'Number', widthData), createVector('count', 'Number', countData)];
        return createDataframe('distribution', vectors, lodash.range(binCount), null, {
          description: 'Distribution for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
          origin: 'getColumnSummary ' + flowPrelude$15.stringify(frameKey) + ', ' + flowPrelude$15.stringify(columnName),
          plot: 'plot inspect \'distribution\', getColumnSummary ' + flowPrelude$15.stringify(frameKey) + ', ' + flowPrelude$15.stringify(columnName)
        });
      };
      var inspectCharacteristics = function inspectCharacteristics() {
        var count = void 0;
        var missing_count = column.missing_count; // eslint-disable-line camelcase
        var zero_count = column.zero_count; // eslint-disable-line camelcase
        var positive_infinity_count = column.positive_infinity_count; // eslint-disable-line camelcase
        var negative_infinity_count = column.negative_infinity_count; // eslint-disable-line camelcase
        var other = rowCount - missing_count - zero_count - positive_infinity_count - negative_infinity_count; // eslint-disable-line camelcase
        var characteristicData = ['Missing', '-Inf', 'Zero', '+Inf', 'Other'];
        var countData = [missing_count, // eslint-disable-line camelcase
        negative_infinity_count, // eslint-disable-line camelcase
        zero_count, // eslint-disable-line camelcase
        positive_infinity_count, // eslint-disable-line camelcase
        other];
        var percentData = function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = countData.length; _i < _len; _i++) {
            count = countData[_i];
            _results.push(100 * count / rowCount);
          }
          return _results;
        }();
        var vectors = [createFactor('characteristic', 'String', characteristicData), createVector('count', 'Number', countData), createVector('percent', 'Number', percentData)];
        return createDataframe('characteristics', vectors, lodash.range(characteristicData.length), null, {
          description: 'Characteristics for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
          origin: 'getColumnSummary ' + flowPrelude$15.stringify(frameKey) + ', ' + flowPrelude$15.stringify(columnName),
          plot: 'plot inspect \'characteristics\', getColumnSummary ' + flowPrelude$15.stringify(frameKey) + ', ' + flowPrelude$15.stringify(columnName)
        });
      };
      var inspectSummary = function inspectSummary() {
        var defaultPercentiles = frame.default_percentiles;
        var percentiles = column.percentiles;
        var mean = column.mean;
        var q1 = percentiles[defaultPercentiles.indexOf(0.25)];
        var q2 = percentiles[defaultPercentiles.indexOf(0.5)];
        var q3 = percentiles[defaultPercentiles.indexOf(0.75)];
        var outliers = lodash.unique(column.mins.concat(column.maxs));
        var minimum = lodash.head(column.mins);
        var maximum = lodash.head(column.maxs);
        var vectors = [createFactor('column', 'String', [columnName]), createVector('mean', 'Number', [mean]), createVector('q1', 'Number', [q1]), createVector('q2', 'Number', [q2]), createVector('q3', 'Number', [q3]), createVector('min', 'Number', [minimum]), createVector('max', 'Number', [maximum])];
        return createDataframe('summary', vectors, lodash.range(1), null, {
          description: 'Summary for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
          origin: 'getColumnSummary ' + flowPrelude$15.stringify(frameKey) + ', ' + flowPrelude$15.stringify(columnName),
          plot: 'plot inspect \'summary\', getColumnSummary ' + flowPrelude$15.stringify(frameKey) + ', ' + flowPrelude$15.stringify(columnName)
        });
      };
      var inspectDomain = function inspectDomain() {
        var i = void 0;
        var level = void 0;
        var _i = void 0;
        var _len = void 0;
        var levels = lodash.map(column.histogram_bins, function (count, index) {
          return {
            count: count,
            index: index
          };
        });
        var sortedLevels = lodash.sortBy(levels, function (level) {
          return -level.count;
        });
        var _ref1 = createArrays(3, sortedLevels.length);
        var labels = _ref1[0];
        var counts = _ref1[1];
        var percents = _ref1[2];
        for (i = _i = 0, _len = sortedLevels.length; _i < _len; i = ++_i) {
          level = sortedLevels[i];
          labels[i] = column.domain[level.index];
          counts[i] = level.count;
          percents[i] = 100 * level.count / rowCount;
        }
        var vectors = [createFactor('label', 'String', labels), createVector('count', 'Number', counts), createVector('percent', 'Number', percents)];
        return createDataframe('domain', vectors, lodash.range(sortedLevels.length), null, {
          description: 'Domain for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
          origin: 'getColumnSummary ' + flowPrelude$15.stringify(frameKey) + ', ' + flowPrelude$15.stringify(columnName),
          plot: 'plot inspect \'domain\', getColumnSummary ' + flowPrelude$15.stringify(frameKey) + ', ' + flowPrelude$15.stringify(columnName)
        });
      };
      var inspections = { characteristics: inspectCharacteristics };
      switch (column.type) {
        case 'int':
        case 'real':
          // Skip for columns with all NAs
          if (column.histogram_bins.length) {
            inspections.distribution = inspectDistribution;
          }
          // Skip for columns with all NAs
          if (!lodash.some(column.percentiles, function (a) {
            return a === 'NaN';
          })) {
            inspections.summary = inspectSummary;
            inspections.percentiles = inspectPercentiles;
          }
          break;
        case 'enum':
          inspections.domain = inspectDomain;
          break;
        default:
        // do nothing
      }
      inspect_(frame, inspections);
      return render_(_, frame, h2oColumnSummaryOutput, frameKey, frame, columnName);
    }

    function getColumnSummaryRequest(_, frameKey, column, go) {
      var lodash = window._;
      var urlString = '/3/Frames/' + encodeURIComponent(frameKey) + '/columns/' + encodeURIComponent(column) + '/summary';
      return doGet(_, urlString, unwrap(go, function (result) {
        return lodash.head(result.frames);
      }));
    }

    function requestColumnSummary(_, frameKey, columnName, go) {
      return getColumnSummaryRequest(_, frameKey, columnName, function (error, frame) {
        if (error) {
          return go(error);
        }
        return go(null, extendColumnSummary(_, frameKey, frame, columnName));
      });
    }

    function isJobRunning(job) {
      return job.status === 'CREATED' || job.status === 'RUNNING';
    }

    function canView(_destinationType, job) {
      switch (_destinationType) {
        case 'Model':
        case 'Grid':
          return job.ready_for_view;
        default:
          return !isJobRunning(job);
      }
    }

    function getJobProgressPercent(progress) {
      return Math.ceil(100 * progress) + "%";
    }

    var jobOutputStatusColors = {
      failed: '#d9534f',
      done: '#ccc',
      running: '#f0ad4e'
    };

    function getJobOutputStatusColor(status) {
      // CREATED   Job was created
      // RUNNING   Job is running
      // CANCELLED Job was cancelled by user
      // FAILED    Job crashed, error message/exception is available
      // DONE      Job was successfully finished
      switch (status) {
        case 'DONE':
          return jobOutputStatusColors.done;
        case 'CREATED':
        case 'RUNNING':
          return jobOutputStatusColors.running;
        default:
          // 'CANCELLED', 'FAILED'
          return jobOutputStatusColors.failed;
      }
    }

    function splitTime(s) {
      var ms = s % 1000;
      s = (s - ms) / 1000;
      var secs = s % 60;
      s = (s - secs) / 60;
      var mins = s % 60;
      var hrs = (s - mins) / 60;
      return [hrs, mins, secs, ms];
    }

    function padTime(n) {
      return '' + (n < 10 ? '0' : '') + n;
    }

    function formatMilliseconds(s) {
      var _ref = splitTime(s);
      var hrs = _ref[0];
      var mins = _ref[1];
      var secs = _ref[2];
      var ms = _ref[3];
      return padTime(hrs) + ':' + padTime(mins) + ':' + padTime(secs) + '.' + ms;
    }

    function updateJob(_, _runTime, _progress, _remainingTime, _progressMessage, _status, _statusColor, messageIcons, _messages, _exception, _canView, canView, _destinationType, _canCancel, job) {
      var Flow = window.Flow;
      var cause = void 0;
      var message = void 0;
      var messages = void 0;
      _runTime(formatMilliseconds(job.msec));
      _progress(getJobProgressPercent(job.progress));
      _remainingTime(job.progress ? formatMilliseconds(Math.round((1 - job.progress) * job.msec / job.progress)) : 'Estimating...');
      _progressMessage(job.progress_msg);
      _status(job.status);
      _statusColor(getJobOutputStatusColor(job.status));
      if (job.error_count) {
        messages = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref = job.messages;
          var _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            message = _ref[_i];
            if (message.message_type !== 'HIDE') {
              _results.push({
                icon: messageIcons[message.message_type],
                message: message.field_name + ': ' + message.message
              });
            }
          }
          return _results;
        }();
        _messages(messages);
      } else if (job.exception) {
        cause = new Error(job.exception);
        if (job.stacktrace) {
          cause.stack = job.stacktrace;
        }
        _exception(Flow.failure(_, new Flow.Error('Job failure.', cause)));
      }
      _canView(canView(_destinationType, job));
      return _canCancel(isJobRunning(job));
    }

    function doPost(_, path, opts, go) {
      return http(_, 'POST', path, opts, go);
    }

    function postCancelJobRequest(_, key, go) {
      var Flow = window.Flow;
      return doPost(_, '/3/Jobs/' + encodeURIComponent(key) + '/cancel', {}, function (error, result) {
        if (error) {
          return go(new Flow.Error('Error canceling job \'' + key + '\'', error));
        }
        return go(null);
      });
    }

    function cancel(_, _key, _job) {
      return postCancelJobRequest(_, _key, function (error, result) {
        if (error) {
          return console.debug(error);
        }
        return updateJob(_job);
      });
    }

    var flowPrelude$17 = flowPreludeFunction();

    function view(_, _canView, _destinationType, _job, _destinationKey) {
      if (!_canView()) {
        return;
      }
      switch (_destinationType) {
        case 'Frame':
          return _.insertAndExecuteCell('cs', 'getFrameSummary ' + flowPrelude$17.stringify(_destinationKey));
        case 'Model':
          return _.insertAndExecuteCell('cs', 'getModel ' + flowPrelude$17.stringify(_destinationKey));
        case 'Grid':
          return _.insertAndExecuteCell('cs', 'getGrid ' + flowPrelude$17.stringify(_destinationKey));
        case 'PartialDependence':
          return _.insertAndExecuteCell('cs', 'getPartialDependence ' + flowPrelude$17.stringify(_destinationKey));
        case 'Auto Model':
          // FIXME getGrid() for AutoML is hosed; resort to getGrids() for now.
          return _.insertAndExecuteCell('cs', 'getGrids');
        case 'Void':
          return alert('This frame was exported to\n' + _job.dest.name);
        default:
        // do nothing
      }
    }

    function initialize(_, _runTime, _progress, _remainingTime, _progressMessage, _status, _statusColor, messageIcons, _messages, _exception, _canView, _destinationType, _canCancel, _isLive, _go, job) {
      var lodash = window._;
      updateJob(_, _runTime, _progress, _remainingTime, _progressMessage, _status, _statusColor, messageIcons, _messages, _exception, _canView, canView, _destinationType, _canCancel, job);
      if (isJobRunning(job)) {
        return _isLive(true);
      }
      if (_go) {
        return lodash.defer(_go);
      }
    }

    function getJobRequest(_, key, go) {
      var lodash = window._;
      var Flow = window.Flow;
      return doGet(_, '/3/Jobs/' + encodeURIComponent(key), function (error, result) {
        if (error) {
          return go(new Flow.Error('Error fetching job \'' + key + '\'', error));
        }
        return go(null, lodash.head(result.jobs));
      });
    }

    function h2oJobOutput(_, _go, _job) {
      var lodash = window._;
      var Flow = window.Flow;
      var H2O = window.H2O;
      var _isBusy = Flow.Dataflow.signal(false);
      var _isLive = Flow.Dataflow.signal(false);
      var _key = _job.key.name;
      var _description = _job.description;
      var _destinationKey = _job.dest.name;
      var _destinationType = function () {
        switch (_job.dest.type) {
          case 'Key<Frame>':
            return 'Frame';
          case 'Key<Model>':
            return 'Model';
          case 'Key<Grid>':
            return 'Grid';
          case 'Key<PartialDependence>':
            return 'PartialDependence';
          case 'Key<AutoML>':
            return 'Auto Model';
          case 'Key<KeyedVoid>':
            return 'Void';
          default:
            return 'Unknown';
        }
      }();
      var _runTime = Flow.Dataflow.signal(null);
      var _remainingTime = Flow.Dataflow.signal(null);
      var _progress = Flow.Dataflow.signal(null);
      var _progressMessage = Flow.Dataflow.signal(null);
      var _status = Flow.Dataflow.signal(null);
      var _statusColor = Flow.Dataflow.signal(null);
      var _exception = Flow.Dataflow.signal(null);
      var _messages = Flow.Dataflow.signal(null);
      var _canView = Flow.Dataflow.signal(false);
      var _canCancel = Flow.Dataflow.signal(false);
      var messageIcons = {
        ERROR: 'fa-times-circle red',
        WARN: 'fa-warning orange',
        INFO: 'fa-info-circle'
      };
      // abstracting this out produces an error
      // defer for now
      var refresh = function refresh() {
        _isBusy(true);
        return getJobRequest(_, _key, function (error, job) {
          _isBusy(false);
          if (error) {
            _exception(Flow.failure(_, new Flow.Error('Error fetching jobs', error)));
            return _isLive(false);
          }
          updateJob(_, _runTime, _progress, _remainingTime, _progressMessage, _status, _statusColor, messageIcons, _messages, _exception, _canView, canView, _destinationType, _canCancel, job);
          if (isJobRunning(job)) {
            if (_isLive()) {
              return lodash.delay(refresh, 1000);
            }
          } else {
            _isLive(false);
            if (_go) {
              return lodash.defer(_go);
            }
          }
        });
      };
      Flow.Dataflow.act(_isLive, function (isLive) {
        if (isLive) {
          return refresh();
        }
      });
      initialize(_, _runTime, _progress, _remainingTime, _progressMessage, _status, _statusColor, messageIcons, _messages, _exception, _canView, _destinationType, _canCancel, _isLive, _go, _job);
      return {
        key: _key,
        description: _description,
        destinationKey: _destinationKey,
        destinationType: _destinationType,
        runTime: _runTime,
        remainingTime: _remainingTime,
        progress: _progress,
        progressMessage: _progressMessage,
        status: _status,
        statusColor: _statusColor,
        messages: _messages,
        exception: _exception,
        isLive: _isLive,
        canView: _canView.bind(this, _destinationType),
        canCancel: _canCancel,
        cancel: cancel.bind(this, _, _key, _job),
        view: view.bind(this, _, _canView, _destinationType, _job, _destinationKey),
        template: 'flow-job-output'
      };
    }

    function extendJob(_, job) {
      return render_(_, job, h2oJobOutput, job);
    }

    function postCreateFrameRequest(_, opts, go) {
      return doPost(_, '/3/CreateFrame', opts, go);
    }

    function requestCreateFrame(_, opts, go) {
      return postCreateFrameRequest(_, opts, function (error, result) {
        if (error) {
          return go(error);
        }
        return getJobRequest(_, result.key.name, function (error, job) {
          if (error) {
            return go(error);
          }
          return go(null, extendJob(_, job));
        });
      });
    }

    var flowPrelude$18 = flowPreludeFunction();

    function h2oSplitFrameOutput(_, _go, _splitFrameResult) {
      var lodash = window._;
      var index = void 0;
      var key = void 0;
      var computeRatios = function computeRatios(sourceRatios) {
        var ratio = void 0;
        var total = void 0;
        total = 0;
        var ratios = function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = sourceRatios.length; _i < _len; _i++) {
            ratio = sourceRatios[_i];
            total += ratio;
            _results.push(ratio);
          }
          return _results;
        }();
        ratios.push(1 - total);
        return ratios;
      };
      var createFrameView = function createFrameView(key, ratio) {
        var view = function view() {
          return _.insertAndExecuteCell('cs', 'getFrameSummary ' + flowPrelude$18.stringify(key));
        };
        var self = {
          key: key,
          ratio: ratio,
          view: view
        };
        return self;
      };
      var _ratios = computeRatios(_splitFrameResult.ratios);
      var _frames = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = _splitFrameResult.keys;
        var _results = [];
        for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
          key = _ref[index];
          _results.push(createFrameView(key, _ratios[index]));
        }
        return _results;
      }();
      lodash.defer(_go);
      return {
        frames: _frames,
        template: 'flow-split-frame-output'
      };
    }

    function extendSplitFrameResult(_, result) {
      render_(_, result, h2oSplitFrameOutput, result);
      return result;
    }

    function uuid() {
      if (typeof window !== 'undefined' && window !== null) {
        return window.uuid();
      }
      return null;
    }

    function createTempKey() {
      var Flow = window.Flow;
      return 'flow_' + uuid().replace(/\-/g, '');
    }

    function computeSplits(ratios, keys) {
      var i = void 0;
      var key = void 0;
      var part = void 0;
      var ratio = void 0;
      var sum = void 0;
      var _i = void 0;
      var _j = void 0;
      var _len = void 0;
      var _len1 = void 0;
      var parts = [];
      sum = 0;
      var _ref1 = keys.slice(0, ratios.length);
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        key = _ref1[i];
        sum += ratio = ratios[i];
        parts.push({
          key: key,
          ratio: ratio
        });
      }
      parts.push({
        key: keys[keys.length - 1],
        ratio: 1 - sum
      });
      var splits = [];
      sum = 0;
      for (_j = 0, _len1 = parts.length; _j < _len1; _j++) {
        part = parts[_j];
        splits.push({
          min: sum,
          max: sum + part.ratio,
          key: part.key
        });
        sum += part.ratio;
      }
      return splits;
    }

    function requestExec(_, ast, go) {
      var Flow = window.Flow;
      return doPost(_, '/99/Rapids', { ast: ast }, function (error, result) {
        if (error) {
          return go(error);
        }
        // TODO HACK - this api returns a 200 OK on failures
        if (result.error) {
          return go(new Flow.Error(result.error));
        }
        return go(null, result);
      });
    }

    function requestSplitFrame(_, frameKey, splitRatios, splitKeys, seed, go) {
      var Flow = window.Flow;
      var g = void 0;
      var i = void 0;
      var l = void 0;
      var part = void 0;
      var randomVecKey = void 0;
      var sliceExpr = void 0;
      var splits = void 0;
      var statements = void 0;
      var _i = void 0;
      var _len = void 0;
      if (splitRatios.length === splitKeys.length - 1) {
        splits = computeSplits(splitRatios, splitKeys);
        randomVecKey = createTempKey();
        statements = [];
        statements.push('(tmp= ' + randomVecKey + ' (h2o.runif ' + frameKey + ' ' + seed + '))');
        for (i = _i = 0, _len = splits.length; _i < _len; i = ++_i) {
          part = splits[i];
          g = i !== 0 ? '(> ' + randomVecKey + ' ' + part.min + ')' : null;
          l = i !== splits.length - 1 ? '(<= ' + randomVecKey + ' ' + part.max + ')' : null;
          if (g && l) {
            sliceExpr = '(& ' + g + ' ' + l + ')';
          } else {
            if (l) {
              sliceExpr = l;
            } else {
              sliceExpr = g;
            }
          }
          statements.push('(assign ' + part.key + ' (rows ' + frameKey + ' ' + sliceExpr + '))');
        }
        statements.push('(rm ' + randomVecKey + ')');
        return requestExec(_, '(, ' + statements.join(' ') + ')', function (error, result) {
          if (error) {
            return go(error);
          }
          return go(null, extendSplitFrameResult(_, {
            keys: splitKeys,
            ratios: splitRatios
          }));
        });
      }
      return go(new Flow.Error('The number of split ratios should be one less than the number of split keys'));
    }

    var flowPrelude$19 = flowPreludeFunction();

    function h2oMergeFramesOutput(_, _go, _mergeFramesResult) {
      var lodash = window._;
      var Flow = window.Flow;
      var _frameKey = _mergeFramesResult.key;
      var _viewFrame = function _viewFrame() {
        return _.insertAndExecuteCell('cs', 'getFrameSummary ' + flowPrelude$19.stringify(_frameKey));
      };
      lodash.defer(_go);
      return {
        frameKey: _frameKey,
        viewFrame: _viewFrame,
        template: 'flow-merge-frames-output'
      };
    }

    function extendMergeFramesResult(_, result) {
      render_(_, result, h2oMergeFramesOutput, result);
      return result;
    }

    function requestMergeFrames(_, destinationKey, leftFrameKey, leftColumnIndex, includeAllLeftRows, rightFrameKey, rightColumnIndex, includeAllRightRows, go) {
      var lr = includeAllLeftRows ? 'TRUE' : 'FALSE';
      var rr = includeAllRightRows ? 'TRUE' : 'FALSE';
      var statement = '(assign ' + destinationKey + ' (merge ' + leftFrameKey + ' ' + rightFrameKey + ' ' + lr + ' ' + rr + ' ' + leftColumnIndex + ' ' + rightColumnIndex + ' "radix"))';
      return requestExec(_, statement, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendMergeFramesResult(_, { key: destinationKey }));
      });
    }

    function h2oDeleteObjectsOutput(_, _go, _keys) {
      var lodash = window._;
      lodash.defer(_go);
      return {
        hasKeys: _keys.length > 0,
        keys: _keys,
        template: 'flow-delete-objects-output'
      };
    }

    function extendDeletedKeys(_, keys) {
      return render_(_, keys, h2oDeleteObjectsOutput, keys);
    }

    function requestDeleteFrame(_, frameKey, go) {
      return _.requestDeleteFrame(_, frameKey, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendDeletedKeys(_, [frameKey]));
      });
    }

    function postExportFrameRequest(_, key, path, overwrite, go) {
      var params = {
        path: path,
        force: overwrite ? 'true' : 'false'
      };
      return doPost(_, '/3/Frames/' + encodeURIComponent(key) + '/export', params, go);
    }

    function requestExportFrame(_, frameKey, path, opts, go) {
      return postExportFrameRequest(_, frameKey, path, opts.overwrite, function (error, result) {
        if (error) {
          return go(error);
        }
        return getJobRequest(result.job.key.name, function (error, job) {
          if (error) {
            return go(error);
          }
          return go(null, extendJob(_, job));
        });
      });
    }

    function mapWithKey(obj, f) {
      var key = void 0;
      var value = void 0;
      var result = [];
      for (key in obj) {
        if ({}.hasOwnProperty.call(obj, key)) {
          value = obj[key];
          result.push(f(value, key));
        }
      }
      return result;
    }

    function composePath(path, opts) {
      var params = void 0;
      if (opts) {
        params = mapWithKey(opts, function (v, k) {
          return k + '=' + v;
        });
        return path + '?' + params.join('&');
      }
      return path;
    }

    function requestWithOpts(_, path, opts, go) {
      return doGet(_, composePath(path, opts), go);
    }

    function getModelsRequest(_, go, opts) {
      return requestWithOpts(_, '/3/Models', opts, function (error, result) {
        if (error) {
          return go(error, result);
        }
        return go(error, result.models);
      });
    }

    function getModelParameterValue(type, value) {
      switch (type) {
        case 'Key<Frame>':
        case 'Key<Model>':
          if (value != null) {
            return value.name;
          }
          return void 0;
        // break; // no-unreachable
        case 'VecSpecifier':
          if (value != null) {
            return value.column_name;
          }
          return void 0;
        // break; // no-unreachable
        default:
          if (value != null) {
            return value;
          }
          return void 0;
      }
    }

    var flowPrelude$20 = flowPreludeFunction();

    function inspectParametersAcrossModels(models) {
      return function () {
        var lodash = window._;

        var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
        if (lightning.settings) {
          lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
          lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
        }
        var createVector = lightning.createVector;
        var createFactor = lightning.createFactor;
        var createList = lightning.createList;
        var createDataframe = lightning.createFrame;

        var data = void 0;
        var i = void 0;
        var model = void 0;
        var parameter = void 0;
        var leader = lodash.head(models);
        var vectors = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref1 = leader.parameters || [];
          var _results = [];
          for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
            parameter = _ref1[i];
            data = function () {
              var _j = void 0;
              var _len1 = void 0;
              var _results1 = [];
              for (_j = 0, _len1 = models.length; _j < _len1; _j++) {
                model = models[_j];
                _results1.push(getModelParameterValue(parameter.type, model.parameters[i].actual_value));
              }
              return _results1;
            }();
            switch (parameter.type) {
              case 'enum':
              case 'Frame':
              case 'string':
                _results.push(createFactor(parameter.label, 'String', data));
                break;
              case 'byte':
              case 'short':
              case 'int':
              case 'long':
              case 'float':
              case 'double':
                _results.push(createVector(parameter.label, 'Number', data));
                break;
              case 'string[]':
              case 'byte[]':
              case 'short[]':
              case 'int[]':
              case 'long[]':
              case 'float[]':
              case 'double[]':
                _results.push(createList(parameter.label, data, function (a) {
                  if (a) {
                    return a;
                  }
                  return void 0;
                }));
                break;
              case 'boolean':
                _results.push(createList(parameter.label, data, function (a) {
                  if (a) {
                    return 'true';
                  }
                  return 'false';
                }));
                break;
              default:
                _results.push(createList(parameter.label, data));
            }
          }
          return _results;
        }();
        var modelKeys = function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = models.length; _i < _len; _i++) {
            model = models[_i];
            _results.push(model.model_id.name);
          }
          return _results;
        }();
        return createDataframe('parameters', vectors, lodash.range(models.length), null, {
          description: 'Parameters for models ' + modelKeys.join(', '),
          origin: 'getModels ' + flowPrelude$20.stringify(modelKeys)
        });
      };
    }

    var flowPrelude$21 = flowPreludeFunction();

    function h2oModelsOutput(_, _go, _models) {
      var lodash = window._;
      var Flow = window.Flow;
      var _modelViews = Flow.Dataflow.signal([]);
      var _checkAllModels = Flow.Dataflow.signal(false);
      var _checkedModelCount = Flow.Dataflow.signal(0);
      var _canCompareModels = Flow.Dataflow.lift(_checkedModelCount, function (count) {
        return count > 1;
      });
      var _hasSelectedModels = Flow.Dataflow.lift(_checkedModelCount, function (count) {
        return count > 0;
      });
      var _isCheckingAll = false;
      Flow.Dataflow.react(_checkAllModels, function (checkAll) {
        var view = void 0;
        var _i = void 0;
        var _len = void 0;
        _isCheckingAll = true;
        var views = _modelViews();
        for (_i = 0, _len = views.length; _i < _len; _i++) {
          view = views[_i];
          view.isChecked(checkAll);
        }
        _checkedModelCount(checkAll ? views.length : 0);
        _isCheckingAll = false;
      });
      var createModelView = function createModelView(model) {
        var _isChecked = Flow.Dataflow.signal(false);
        Flow.Dataflow.react(_isChecked, function () {
          var view = void 0;
          if (_isCheckingAll) {
            return;
          }
          var checkedViews = function () {
            var _i = void 0;
            var _len = void 0;
            var _ref = _modelViews();
            var _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              view = _ref[_i];
              if (view.isChecked()) {
                _results.push(view);
              }
            }
            return _results;
          }();
          return _checkedModelCount(checkedViews.length);
        });
        var predict = function predict() {
          return _.insertAndExecuteCell('cs', 'predict model: ' + flowPrelude$21.stringify(model.model_id.name));
        };
        var cloneModel = function cloneModel() {
          return (// return _.insertAndExecuteCell('cs', `cloneModel ${flowPrelude.stringify(model.model_id.name)}`);
            alert('Not implemented')
          );
        };
        var view = function view() {
          return _.insertAndExecuteCell('cs', 'getModel ' + flowPrelude$21.stringify(model.model_id.name));
        };
        var inspect = function inspect() {
          return _.insertAndExecuteCell('cs', 'inspect getModel ' + flowPrelude$21.stringify(model.model_id.name));
        };
        return {
          key: model.model_id.name,
          algo: model.algo_full_name,
          isChecked: _isChecked,
          predict: predict,
          clone: cloneModel,
          inspect: inspect,
          view: view
        };
      };
      var buildModel = function buildModel() {
        return _.insertAndExecuteCell('cs', 'buildModel');
      };
      var collectSelectedKeys = function collectSelectedKeys() {
        var view = void 0;
        var _i = void 0;
        var _len = void 0;
        var _ref = _modelViews();
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (view.isChecked()) {
            _results.push(view.key);
          }
        }
        return _results;
      };
      var compareModels = function compareModels() {
        return _.insertAndExecuteCell('cs', 'inspect getModels ' + flowPrelude$21.stringify(collectSelectedKeys()));
      };
      var predictUsingModels = function predictUsingModels() {
        return _.insertAndExecuteCell('cs', 'predict models: ' + flowPrelude$21.stringify(collectSelectedKeys()));
      };
      var deleteModels = function deleteModels() {
        return _.confirm('Are you sure you want to delete these models?', {
          acceptCaption: 'Delete Models',
          declineCaption: 'Cancel'
        }, function (accept) {
          if (accept) {
            return _.insertAndExecuteCell('cs', 'deleteModels ' + flowPrelude$21.stringify(collectSelectedKeys()));
          }
        });
      };
      var inspectAll = function inspectAll() {
        var view = void 0;
        var allKeys = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref = _modelViews();
          var _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            view = _ref[_i];
            _results.push(view.key);
          }
          return _results;
        }();
        // TODO use table origin
        return _.insertAndExecuteCell('cs', 'inspect getModels ' + flowPrelude$21.stringify(allKeys));
      };
      var initialize = function initialize(models) {
        _modelViews(lodash.map(models, createModelView));
        return lodash.defer(_go);
      };
      initialize(_models);
      return {
        modelViews: _modelViews,
        hasModels: _models.length > 0,
        buildModel: buildModel,
        compareModels: compareModels,
        predictUsingModels: predictUsingModels,
        deleteModels: deleteModels,
        checkedModelCount: _checkedModelCount,
        canCompareModels: _canCompareModels,
        hasSelectedModels: _hasSelectedModels,
        checkAllModels: _checkAllModels,
        inspect: inspectAll,
        template: 'flow-models-output'
      };
    }

    function extendModels(_, models) {
      var lodash = window._;
      var model = void 0;
      var inspections = {};
      var algos = lodash.unique(function () {
        var _i = void 0;
        var _len = void 0;
        var _results = [];
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          model = models[_i];
          _results.push(model.algo);
        }
        return _results;
      }());
      if (algos.length === 1) {
        inspections.parameters = inspectParametersAcrossModels(models);
      }

      // modelCategories = unique (model.output.model_category for model in models)
      //
      // TODO implement model comparision after 2d table cleanup for model metrics
      //
      // if modelCategories.length is 1
      //  inspections.outputs = inspectOutputsAcrossModels (head modelCategories), models

      inspect_(models, inspections);
      return render_(_, models, h2oModelsOutput, models);
    }

    function requestModels(_, go) {
      return getModelsRequest(_, function (error, models) {
        if (error) {
          return go(error);
        }
        return go(null, extendModels(_, models));
      });
    }

    function findColumnIndexByColumnLabel(frame, columnLabel) {
      var Flow = window.Flow;
      var column = void 0;
      var i = void 0;
      var _i = void 0;
      var _len = void 0;
      var _ref1 = frame.columns;
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        column = _ref1[i];
        if (column.label === columnLabel) {
          return i;
        }
      }
      throw new Flow.Error("Column [" + columnLabel + "] not found in frame");
    }

    function findColumnIndicesByColumnLabels(frame, columnLabels) {
      var columnLabel = void 0;
      var _i = void 0;
      var _len = void 0;
      var _results = [];
      for (_i = 0, _len = columnLabels.length; _i < _len; _i++) {
        columnLabel = columnLabels[_i];
        _results.push(findColumnIndexByColumnLabel(frame, columnLabel));
      }
      return _results;
    }

    function requestImputeColumn(_, opts, go) {
      var combineMethod = void 0;
      var frame = opts.frame;
      var column = opts.column;
      var method = opts.method;
      combineMethod = opts.combineMethod;
      var groupByColumns = opts.groupByColumns;
      combineMethod = combineMethod != null ? combineMethod : 'interpolate';
      return _.requestFrameSummaryWithoutData(_, frame, function (error, result) {
        var columnIndex = void 0;
        var columnIndicesError = void 0;
        var columnKeyError = void 0;
        var groupByColumnIndices = void 0;
        if (error) {
          return go(error);
        }
        try {
          columnIndex = findColumnIndexByColumnLabel(result, column);
        } catch (_error) {
          columnKeyError = _error;
          return go(columnKeyError);
        }
        if (groupByColumns && groupByColumns.length) {
          try {
            groupByColumnIndices = findColumnIndicesByColumnLabels(result, groupByColumns);
          } catch (_error) {
            columnIndicesError = _error;
            return go(columnIndicesError);
          }
        } else {
          groupByColumnIndices = null;
        }
        var groupByArg = groupByColumnIndices ? '[' + groupByColumnIndices.join(' ') + ']' : '[]';
        return requestExec(_, '(h2o.impute ' + frame + ' ' + columnIndex + ' ' + JSON.stringify(method) + ' ' + JSON.stringify(combineMethod) + ' ' + groupByArg + ' _ _)', function (error, result) {
          if (error) {
            return go(error);
          }
          return requestColumnSummary(_, frame, column, go);
        });
      });
    }

    function requestChangeColumnType(_, opts, go) {
      var frame = opts.frame;
      var column = opts.column;
      var type = opts.type;
      var method = type === 'enum' ? 'as.factor' : 'as.numeric';
      return _.requestFrameSummaryWithoutData(_, frame, function (error, result) {
        var columnIndex = void 0;
        var columnKeyError = void 0;
        try {
          columnIndex = findColumnIndexByColumnLabel(result, column);
        } catch (_error) {
          columnKeyError = _error;
          return go(columnKeyError);
        }
        return requestExec(_, '(assign ' + frame + ' (:= ' + frame + ' (' + method + ' (cols ' + frame + ' ' + columnIndex + ')) ' + columnIndex + ' [0:' + result.rows + ']))', function (error, result) {
          if (error) {
            return go(error);
          }
          return requestColumnSummary(_, frame, column, go);
        });
      });
    }

    function doDelete(_, path, go) {
      return http(_, 'DELETE', path, null, go);
    }

    function deleteModelRequest(_, key, go) {
      return doDelete(_, '/3/Models/' + encodeURIComponent(key), go);
    }

    function requestDeleteModel(_, modelKey, go) {
      return deleteModelRequest(_, modelKey, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendDeletedKeys(_, [modelKey]));
      });
    }

    function extendImportModel(_, result) {
      var H2O = window.H2O;
      return render_(_, result, h2oImportModelOutput, result);
    }

    function postImportModelRequest(_, path, overwrite, go) {
      var opts = {
        dir: path,
        force: overwrite
      };
      return doPost(_, '/99/Models.bin/not_in_use', opts, go);
    }

    function requestImportModel(_, path, opts, go) {
      return postImportModelRequest(_, path, opts.overwrite, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendImportModel(_, result));
      });
    }

    function requestJob(_, key, go) {
      return getJobRequest(_, key, function (error, job) {
        if (error) {
          return go(error);
        }
        return go(null, extendJob(_, job));
      });
    }

    var flowPrelude$22 = flowPreludeFunction();

    function h2oImportFilesOutput(_, _go, _importResults) {
      var lodash = window._;
      var Flow = window.Flow;
      var _allFrames = lodash.flatten(lodash.compact(lodash.map(_importResults, function (result) {
        return result.destination_frames;
      })));
      var _canParse = _allFrames.length > 0;
      var _title = _allFrames.length + ' / ' + _importResults.length + ' files imported.';
      var createImportView = function createImportView(result) {
        return {
          // TODO dels?
          // TODO fails?
          files: result.files,
          template: 'flow-import-file-output'
        };
      };
      var _importViews = lodash.map(_importResults, createImportView);
      var parse = function parse() {
        var paths = lodash.map(_allFrames, flowPrelude$22.stringify);
        return _.insertAndExecuteCell('cs', 'setupParse source_frames: [ ' + paths.join(',') + ' ]');
      };
      lodash.defer(_go);
      return {
        title: _title,
        importViews: _importViews,
        canParse: _canParse,
        parse: parse,
        template: 'flow-import-files-output',
        templateOf: function templateOf(view) {
          return view.template;
        }
      };
    }

    function extendImportResults(_, importResults) {
      return render_(_, importResults, h2oImportFilesOutput, importResults);
    }

    var parseTypesArray = ['AUTO', 'ARFF', 'XLS', 'XLSX', 'CSV', 'SVMLight', 'ORC', 'AVRO', 'PARQUET'];

    var whitespaceSeparators = ['NULL', 'SOH (start of heading)', 'STX (start of text)', 'ETX (end of text)', 'EOT (end of transmission)', 'ENQ (enquiry)', 'ACK (acknowledge)', 'BEL \'\\a\' (bell)', 'BS  \'\\b\' (backspace)', 'HT  \'\\t\' (horizontal tab)', 'LF  \'\\n\' (new line)', 'VT  \'\\v\' (vertical tab)', 'FF  \'\\f\' (form feed)', 'CR  \'\\r\' (carriage ret)', 'SO  (shift out)', 'SI  (shift in)', 'DLE (data link escape)', 'DC1 (device control 1) ', 'DC2 (device control 2)', 'DC3 (device control 3)', 'DC4 (device control 4)', 'NAK (negative ack.)', 'SYN (synchronous idle)', 'ETB (end of trans. blk)', 'CAN (cancel)', 'EM  (end of medium)', 'SUB (substitute)', 'ESC (escape)', 'FS  (file separator)', 'GS  (group separator)', 'RS  (record separator)', 'US  (unit separator)', '\' \' SPACE'];

    var dataTypes = ['Unknown', 'Numeric', 'Enum', 'Time', 'UUID', 'String', 'Invalid'];

    function createDelimiter(caption, charCode) {
      return {
        charCode: charCode,
        caption: caption + ": '" + ("00" + charCode).slice(-2) + "'"
      };
    }

    function encodeArrayForPost(array) {
      var lodash = window._;
      if (array) {
        if (array.length === 0) {
          return null;
        }
        return '[' + lodash.map(array, function (element) {
          if (lodash.isNumber(element)) {
            return element;
          }return '"' + element + '"';
        }).join(',') + ' ]';
      }
      return null;
    }

    function postParseSetupPreviewRequest(_, sourceKeys, parseType, separator, useSingleQuotes, checkHeader, columnTypes, go) {
      var opts = {
        source_frames: encodeArrayForPost(sourceKeys),
        parse_type: parseType,
        separator: separator,
        single_quotes: useSingleQuotes,
        check_header: checkHeader,
        column_types: encodeArrayForPost(columnTypes)
      };
      return doPost(_, '/3/ParseSetup', opts, go);
    }

    function refreshPreview(_, _columns, _sourceKeys, _parseType, _delimiter, _useSingleQuotes, _headerOptions, _headerOption, _preview) {
      var column = void 0;
      var columnTypes = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = _columns();
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          column = _ref[_i];
          _results.push(column.type());
        }
        return _results;
      }();
      return postParseSetupPreviewRequest(_, _sourceKeys, _parseType().type, _delimiter().charCode, _useSingleQuotes(), _headerOptions[_headerOption()], columnTypes, function (error, result) {
        if (!error) {
          return _preview(result);
        }
      });
    }

    function makePage(index, columns) {
      return {
        index: index,
        columns: columns
      };
    }

    function filterColumns(_activePage, _columns, _columnNameSearchTerm) {
      var lodash = window._;
      return _activePage(makePage(0, lodash.filter(_columns(), function (column) {
        return column.name().toLowerCase().indexOf(_columnNameSearchTerm().toLowerCase()) > -1;
      })));
    }

    var flowPrelude$24 = flowPreludeFunction();

    function parseFiles(_, _columns, _headerOptions, _headerOption, _inputKey, _inputs, _destinationKey, _parseType, _delimiter, _columnCount, _useSingleQuotes, _canReconfigure, _deleteOnDone, _chunkSize) {
      var lodash = window._;
      var column = void 0;
      var columnNames = void 0;
      var headerOption = void 0;
      columnNames = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = _columns();
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          column = _ref[_i];
          _results.push(column.name());
        }
        return _results;
      }();
      headerOption = _headerOptions[_headerOption()];
      if (lodash.every(columnNames, function (columnName) {
        return columnName.trim() === '';
      })) {
        columnNames = null;
        headerOption = -1;
      }
      var columnTypes = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = _columns();
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          column = _ref[_i];
          _results.push(column.type());
        }
        return _results;
      }();
      var codeCellCode = 'parseFiles\n  ' + _inputKey + ': ' + flowPrelude$24.stringify(_inputs[_inputKey]) + '\n  destination_frame: ' + flowPrelude$24.stringify(_destinationKey()) + '\n  parse_type: ' + flowPrelude$24.stringify(_parseType().type) + '\n  separator: ' + _delimiter().charCode + '\n  number_columns: ' + _columnCount() + '\n  single_quotes: ' + _useSingleQuotes() + '\n  ' + (_canReconfigure() ? 'column_names: ' + flowPrelude$24.stringify(columnNames) + '\n  ' : '') + (_canReconfigure() ? 'column_types: ' + flowPrelude$24.stringify(columnTypes) + '\n  ' : '') + 'delete_on_done: ' + _deleteOnDone() + '\n  check_header: ' + headerOption + '\n  chunk_size: ' + _chunkSize(); // eslint-disable-line prefer-template
      return _.insertAndExecuteCell('cs', codeCellCode);
    }

    function _columnsAccessorFunction(preview) {
      var Flow = window.Flow;
      var data = void 0;
      var i = void 0;
      var j = void 0;
      var row = void 0;
      var _i = void 0;
      var _j = void 0;
      var columnTypes = preview.column_types;
      var columnCount = columnTypes.length;
      var previewData = preview.data;
      var rowCount = previewData.length;
      var columnNames = preview.column_names;
      var rows = new Array(columnCount);
      for (j = _i = 0; columnCount >= 0 ? _i < columnCount : _i > columnCount; j = columnCount >= 0 ? ++_i : --_i) {
        data = new Array(rowCount);
        for (i = _j = 0; rowCount >= 0 ? _j < rowCount : _j > rowCount; i = rowCount >= 0 ? ++_j : --_j) {
          data[i] = previewData[i][j];
        }
        rows[j] = row = {
          index: '' + (j + 1),
          name: Flow.Dataflow.signal(columnNames ? columnNames[j] : ''),
          type: Flow.Dataflow.signal(columnTypes[j]),
          data: data
        };
      }
      return rows;
    }

    function goToNextPage(_activePage) {
      var currentPage = _activePage();
      return _activePage(makePage(currentPage.index + 1, currentPage.columns));
    }

    function goToPreviousPage(_activePage) {
      var currentPage = _activePage();
      if (currentPage.index > 0) {
        return _activePage(makePage(currentPage.index - 1, currentPage.columns));
      }
    }

    var flowPrelude$23 = flowPreludeFunction();

    function h2oSetupParseOutput(_, _go, _inputs, _result) {
      var Flow = window.Flow;
      var lodash = window._;
      var MaxItemsPerPage = 15;
      var parseTypes = parseTypesArray.map(function (type) {
        return {
          type: type,
          caption: type
        };
      });
      var parseDelimiters = function () {
        var whitespaceDelimiters = whitespaceSeparators.map(createDelimiter);
        var characterDelimiters = lodash.times(126 - whitespaceSeparators.length, function (i) {
          var charCode = i + whitespaceSeparators.length;
          return createDelimiter(String.fromCharCode(charCode), charCode);
        });
        var otherDelimiters = [{
          charCode: -1,
          caption: 'AUTO'
        }];
        return whitespaceDelimiters.concat(characterDelimiters, otherDelimiters);
      }();
      var _currentPage = void 0;
      var _inputKey = _inputs.paths ? 'paths' : 'source_frames';
      var _sourceKeys = _result.source_frames.map(function (src) {
        return src.name;
      });
      var _parseType = Flow.Dataflow.signal(lodash.find(parseTypes, function (parseType) {
        return parseType.type === _result.parse_type;
      }));
      var _canReconfigure = Flow.Dataflow.lift(_parseType, function (parseType) {
        return parseType.type !== 'SVMLight';
      });
      var _delimiter = Flow.Dataflow.signal(lodash.find(parseDelimiters, function (delimiter) {
        return delimiter.charCode === _result.separator;
      }));
      var _useSingleQuotes = Flow.Dataflow.signal(_result.single_quotes);
      var _destinationKey = Flow.Dataflow.signal(_result.destination_frame);
      var _headerOptions = {
        auto: 0,
        header: 1,
        data: -1
      };
      var _headerOption = Flow.Dataflow.signal(_result.check_header === 0 ? 'auto' : _result.check_header === -1 ? 'data' : 'header');
      var _deleteOnDone = Flow.Dataflow.signal(true);
      var _columnNameSearchTerm = Flow.Dataflow.signal('');
      var _preview = Flow.Dataflow.signal(_result);
      var _chunkSize = Flow.Dataflow.lift(_preview, function (preview) {
        return preview.chunk_size;
      });
      var _columns = Flow.Dataflow.lift(_preview, function (preview) {
        return _columnsAccessorFunction(preview);
      });
      var _columnCount = Flow.Dataflow.lift(_columns, function (columns) {
        return (columns != null ? columns.length : void 0) || 0;
      });
      _currentPage = 0;
      Flow.Dataflow.act(_columns, function (columns) {
        // eslint-disable-line arrow-body-style
        return columns.forEach(function (column) {
          // eslint-disable-line arrow-body-style
          return Flow.Dataflow.react(column.type, function () {
            _currentPage = _activePage().index;
            return refreshPreview(_, _columns, _sourceKeys, _parseType, _delimiter, _useSingleQuotes, _headerOptions, _headerOption, _preview);
          });
        });
      });
      Flow.Dataflow.react(_parseType, _delimiter, _useSingleQuotes, _headerOption, function () {
        _currentPage = 0;
        return refreshPreview(_, _columns, _sourceKeys, _parseType, _delimiter, _useSingleQuotes, _headerOptions, _headerOption, _preview, _delimiter);
      });
      var _filteredColumns = Flow.Dataflow.lift(_columns, function (columns) {
        return columns;
      });
      var _activePage = Flow.Dataflow.lift(_columns, function (columns) {
        return makePage(_currentPage, columns);
      });
      Flow.Dataflow.react(_columnNameSearchTerm, lodash.throttle(filterColumns.bind(this, _activePage, _columns, _columnNameSearchTerm), 500));
      var _visibleColumns = Flow.Dataflow.lift(_activePage, function (currentPage) {
        var start = currentPage.index * MaxItemsPerPage;
        return currentPage.columns.slice(start, start + MaxItemsPerPage);
      });
      var _canGoToNextPage = Flow.Dataflow.lift(_activePage, function (currentPage) {
        return (currentPage.index + 1) * MaxItemsPerPage < currentPage.columns.length;
      });
      var _canGoToPreviousPage = Flow.Dataflow.lift(_activePage, function (currentPage) {
        return currentPage.index > 0;
      });
      lodash.defer(_go);
      return {
        sourceKeys: _inputs[_inputKey],
        canReconfigure: _canReconfigure,
        parseTypes: parseTypes,
        dataTypes: dataTypes,
        delimiters: parseDelimiters,
        parseType: _parseType,
        delimiter: _delimiter,
        useSingleQuotes: _useSingleQuotes,
        destinationKey: _destinationKey,
        headerOption: _headerOption,
        deleteOnDone: _deleteOnDone,
        columns: _visibleColumns,
        parseFiles: parseFiles.bind(this, _, _columns, _headerOptions, _headerOption, _inputKey, _inputs, _destinationKey, _parseType, _delimiter, _columnCount, _useSingleQuotes, _canReconfigure, _deleteOnDone, _chunkSize),
        columnNameSearchTerm: _columnNameSearchTerm,
        canGoToNextPage: _canGoToNextPage,
        canGoToPreviousPage: _canGoToPreviousPage,
        goToNextPage: goToNextPage.bind(this, _activePage),
        goToPreviousPage: goToPreviousPage.bind(this, _activePage),
        template: 'flow-parse-raw-input'
      };
    }

    function extendParseSetupResults(_, args, parseSetupResults) {
      var H2O = window.H2O;
      return render_(_, parseSetupResults, h2oSetupParseOutput, args, parseSetupResults);
    }

    function postParseSetupRequest(_, sourceKeys, go) {
      var opts = { source_frames: encodeArrayForPost(sourceKeys) };
      return doPost(_, '/3/ParseSetup', opts, go);
    }

    function requestImportAndParseSetup(_, paths, go) {
      var lodash = window._;
      return _.requestImportFiles(paths, function (error, importResults) {
        if (error) {
          return go(error);
        }
        var sourceKeys = lodash.flatten(lodash.compact(lodash.map(importResults, function (result) {
          return result.destination_frames;
        })));
        return postParseSetupRequest(_, sourceKeys, function (error, parseSetupResults) {
          if (error) {
            return go(error);
          }
          return go(null, extendParseSetupResults(_, { paths: paths }, parseSetupResults));
        });
      });
    }

    function extendParseResult(_, parseResult) {
      return render_(_, parseResult, h2oJobOutput, parseResult.job);
    }

    function postParseFilesRequest(_, sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) {
      var opts = {
        destination_frame: destinationKey,
        source_frames: encodeArrayForPost(sourceKeys),
        parse_type: parseType,
        separator: separator,
        number_columns: columnCount,
        single_quotes: useSingleQuotes,
        column_names: encodeArrayForPost(columnNames),
        column_types: encodeArrayForPost(columnTypes),
        check_header: checkHeader,
        delete_on_done: deleteOnDone,
        chunk_size: chunkSize
      };
      return doPost(_, '/3/Parse', opts, go);
    }

    function requestImportAndParseFiles(_, paths, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) {
      return _.requestImportFiles(paths, function (error, importResults) {
        var lodash = window._;
        if (error) {
          return go(error);
        }
        var sourceKeys = lodash.flatten(lodash.compact(lodash.map(importResults, function (result) {
          return result.destination_frames;
        })));
        return postParseFilesRequest(_, sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, function (error, parseResult) {
          if (error) {
            return go(error);
          }
          return go(null, extendParseResult(_, parseResult));
        });
      });
    }

    function requestParseFiles(_, sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) {
      return postParseFilesRequest(_, sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, function (error, parseResult) {
        if (error) {
          return go(error);
        }
        return go(null, extendParseResult(_, parseResult));
      });
    }

    function encodeObjectForPost(source) {
      var lodash = window._;
      var k = void 0;
      var v = void 0;
      var target = {};
      for (k in source) {
        if ({}.hasOwnProperty.call(source, k)) {
          v = source[k];
          target[k] = lodash.isArray(v) ? encodeArrayForPost(v) : v;
        }
      }
      return target;
    }

    var flowPrelude$25 = flowPreludeFunction();

    function postModelBuildRequest(_, algo, parameters, go) {
      _.trackEvent('model', algo);
      if (parameters.hyper_parameters) {
        // super-hack: nest this object as stringified json
        parameters.hyper_parameters = flowPrelude$25.stringify(parameters.hyper_parameters);
        if (parameters.search_criteria) {
          parameters.search_criteria = flowPrelude$25.stringify(parameters.search_criteria);
        }
        return doPost(_, _.__.gridModelBuilderEndpoints[algo], encodeObjectForPost(parameters), go);
      }
      return doPost(_, _.__.modelBuilderEndpoints[algo], encodeObjectForPost(parameters), go);
    }

    function requestModelBuild(_, algo, opts, go) {
      return postModelBuildRequest(_, algo, opts, function (error, result) {
        var Flow = window.Flow;
        var messages = void 0;
        var validation = void 0;
        if (error) {
          return go(error);
        }
        if (result.error_count > 0) {
          messages = function () {
            var _i = void 0;
            var _len = void 0;
            var _ref1 = result.messages;
            var _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              validation = _ref1[_i];
              _results.push(validation.message);
            }
            return _results;
          }();
          return go(new Flow.Error('Model build failure: ' + messages.join('; ')));
        }
        return go(null, extendJob(_, result.job));
      });
    }

    function format6fi(number) {
      if (number) {
        if (number === 'NaN') {
          return void 0;
        }
        return number.toFixed(6).replace(/\.0+$/, '');
      }
      return number;
    }

    function parseAndFormatArray(source) {
      var lodash = window._;
      var element = void 0;
      var i = void 0;
      var _i = void 0;
      var _len = void 0;
      var target = new Array(source.length);
      for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
        element = source[i];
        target[i] = element != null ? lodash.isNumber(element) ? format6fi(element) : element : void 0;
      }
      return target;
    }

    function inspectRawArray_(name, origin, description, array) {
      return function () {
        var lodash = window._;

        var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
        if (lightning.settings) {
          lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
          lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
        }
        var createList = lightning.createList;
        var createDataframe = lightning.createFrame;

        return createDataframe(name, [createList(name, parseAndFormatArray(array))], lodash.range(array.length), null, {
          description: '',
          origin: origin
        });
      };
    }

    var flowPrelude$28 = flowPreludeFunction();

    function parseAndFormatObjectArray(source) {
      var lodash = window._;
      var element = void 0;
      var i = void 0;
      var _i = void 0;
      var _len = void 0;
      var _ref = void 0;
      var _ref1 = void 0;
      var target = new Array(source.length);
      for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
        element = source[i];
        _ref = element.__meta;
        _ref1 = element.__meta;
        target[i] = element != null ? (_ref != null ? _ref.schema_type : void 0) === 'Key<Model>' ? '<a href=\'#\' data-type=\'model\' data-key=' + flowPrelude$28.stringify(element.name) + '>' + lodash.escape(element.name) + '</a>' : (_ref1 != null ? _ref1.schema_type : void 0) === 'Key<Frame>' ? '<a href=\'#\' data-type=\'frame\' data-key=' + flowPrelude$28.stringify(element.name) + '>' + lodash.escape(element.name) + '</a>' : element : void 0;
      }
      return target;
    }

    function inspectObjectArray_(name, origin, description, array) {
      return function () {
        var lodash = window._;
        var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
        if (lightning.settings) {
          lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
          lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
        }
        var createList = lightning.createList;
        var createDataframe = lightning.createFrame;

        return createDataframe(name, [createList(name, parseAndFormatObjectArray(array))], lodash.range(array.length), null, {
          description: '',
          origin: origin
        });
      };
    }

    function inspectRawObject_(name, origin, description, obj) {
      return function () {
        var lodash = window._;

        var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
        if (lightning.settings) {
          lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
          lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
        }
        var createList = lightning.createList;
        var createDataframe = lightning.createFrame;

        var k = void 0;
        var v = void 0;
        var vectors = function () {
          var _results = [];
          for (k in obj) {
            if ({}.hasOwnProperty.call(obj, k)) {
              v = obj[k];
              _results.push(createList(k, [v === null ? void 0 : lodash.isNumber(v) ? format6fi(v) : v]));
            }
          }
          return _results;
        }();
        return createDataframe(name, vectors, lodash.range(1), null, {
          description: '',
          origin: origin
        });
      };
    }

    function getTwoDimData(table, columnName) {
      var lodash = window._;
      var columnIndex = lodash.findIndex(table.columns, function (column) {
        return column.name === columnName;
      });
      if (columnIndex >= 0) {
        return table.data[columnIndex];
      }
      return void 0;
    }

    function transformBinomialMetrics(metrics) {
      var cms = void 0;
      var domain = void 0;
      var fns = void 0;
      var fps = void 0;
      var i = void 0;
      var tns = void 0;
      var tp = void 0;
      var tps = void 0;
      var scores = metrics.thresholds_and_metric_scores;
      if (scores) {
        domain = metrics.domain;
        tps = getTwoDimData(scores, 'tps');
        tns = getTwoDimData(scores, 'tns');
        fps = getTwoDimData(scores, 'fps');
        fns = getTwoDimData(scores, 'fns');
        cms = function () {
          var _i = void 0;
          var _results = [];
          _i = 0;
          var _len = tps.length;
          for (i = _i, _len; _i < _len; i = ++_i) {
            tp = tps[i];
            _results.push({
              domain: domain,
              matrix: [[tns[i], fps[i]], [fns[i], tp]]
            });
          }
          return _results;
        }();
        scores.columns.push({
          name: 'CM',
          description: 'CM',
          format: 'matrix', // TODO HACK
          type: 'matrix'
        });
        scores.data.push(cms);
      }
      return metrics;
    }

    var _schemaHacks = {
      KMeansOutput: { fields: 'names domains help' },
      GBMOutput: { fields: 'names domains help' },
      GLMOutput: { fields: 'names domains help' },
      DRFOutput: { fields: 'names domains help' },
      DeepLearningModelOutput: { fields: 'names domains help' },
      NaiveBayesOutput: { fields: 'names domains help pcond' },
      PCAOutput: { fields: 'names domains help' },
      GLRMOutput: { fields: 'names domains help' },
      SVMOutput: { fields: 'names domains help' },
      // Word2VecOutput: { fields: 'names domains help' },
      ModelMetricsBinomialGLM: {
        fields: null,
        transform: transformBinomialMetrics
      },
      ModelMetricsBinomial: {
        fields: null,
        transform: transformBinomialMetrics
      },
      ModelMetricsMultinomialGLM: { fields: null },
      ModelMetricsMultinomial: { fields: null },
      ModelMetricsRegressionGLM: { fields: null },
      ModelMetricsRegression: { fields: null },
      ModelMetricsClustering: { fields: null },
      ModelMetricsAutoEncoder: { fields: null },
      ModelMetricsPCA: { fields: null },
      ModelMetricsGLRM: { fields: null },
      ConfusionMatrix: { fields: null }
    };

    function schemaTransforms() {
      var attrs = void 0;
      var schema = void 0;
      var transform = void 0;
      var transforms = {};
      for (schema in _schemaHacks) {
        if ({}.hasOwnProperty.call(_schemaHacks, schema)) {
          attrs = _schemaHacks[schema];
          transform = attrs.transform;
          if (transform) {
            transforms[schema] = transform;
          }
        }
      }
      return transforms;
    }

    var flowPrelude$29 = flowPreludeFunction();

    function blacklistedAttributesBySchema() {
      var attrs = void 0;
      var dict = void 0;
      var field = void 0;
      var schema = void 0;
      var _i = void 0;
      var _len = void 0;
      var _ref1 = void 0;
      var dicts = {};
      for (schema in _schemaHacks) {
        if ({}.hasOwnProperty.call(_schemaHacks, schema)) {
          attrs = _schemaHacks[schema];
          dicts[schema] = dict = { __meta: true };
          if (attrs.fields) {
            _ref1 = flowPrelude$29.words(attrs.fields);
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              field = _ref1[_i];
              dict[field] = true;
            }
          }
        }
      }
      return dicts;
    }

    var flowPrelude$27 = flowPreludeFunction();

    function inspectObject(inspections, name, origin, obj) {
      var lodash = window._;
      var k = void 0;
      var meta = void 0;
      var v = void 0;
      var _ref2 = void 0;
      var schemaType = void 0;
      if (typeof obj !== 'undefined') {
        if (typeof obj.__meta !== 'undefined') {
          schemaType = obj.__meta.schema_type;
        }
      }
      var attrs = blacklistedAttributesBySchema()[schemaType];
      var blacklistedAttributes = { __meta: true };
      if (schemaType && typeof attrs !== 'undefined') {
        blacklistedAttributes = attrs;
      }
      var transform = schemaTransforms[schemaType];
      if (transform) {
        obj = transform(obj);
      }
      var record = {};
      inspections[name] = inspectRawObject_(name, origin, name, record);
      for (k in obj) {
        if ({}.hasOwnProperty.call(obj, k) && typeof obj !== 'undefined') {
          v = obj[k];
          if (!blacklistedAttributes[k]) {
            if (v === null) {
              record[k] = null;
            } else {
              _ref2 = v.__meta;
              if ((_ref2 != null ? _ref2.schema_type : void 0) === 'TwoDimTable') {
                inspections[name + ' - ' + v.name] = inspectTwoDimTable_(origin, name + ' - ' + v.name, v);
              } else {
                if (lodash.isArray(v)) {
                  if (k === 'cross_validation_models' || k === 'cross_validation_predictions' || name === 'output' && (k === 'weights' || k === 'biases')) {
                    inspections[k] = inspectObjectArray_(k, origin, k, v);
                  } else {
                    inspections[k] = inspectRawArray_(k, origin, k, v);
                  }
                } else if (lodash.isObject(v)) {
                  meta = v.__meta;
                  if (meta) {
                    if (meta.schema_type === 'Key<Frame>') {
                      record[k] = '<a href=\'#\' data-type=\'frame\' data-key=' + flowPrelude$27.stringify(v.name) + '>' + lodash.escape(v.name) + '</a>';
                    } else if (meta.schema_type === 'Key<Model>') {
                      record[k] = '<a href=\'#\' data-type=\'model\' data-key=' + flowPrelude$27.stringify(v.name) + '>' + lodash.escape(v.name) + '</a>';
                    } else if (meta.schema_type === 'Frame') {
                      record[k] = '<a href=\'#\' data-type=\'frame\' data-key=' + flowPrelude$27.stringify(v.frame_id.name) + '>' + lodash.escape(v.frame_id.name) + '</a>';
                    } else {
                      inspectObject(inspections, name + ' - ' + k, origin, v);
                    }
                  } else {
                  }
                } else {
                  record[k] = lodash.isNumber(v) ? format6fi(v) : v;
                }
              }
            }
          }
        }
      }
    }

    var flowPrelude$30 = flowPreludeFunction();

    function h2oPredictOutput(_, _go, prediction) {
      var lodash = window._;
      var Flow = window.Flow;
      var $ = window.jQuery;
      var frame = void 0;
      var model = void 0;
      var table = void 0;
      var tableName = void 0;
      var _i = void 0;
      var _len = void 0;
      var _ref = void 0;
      var _ref1 = void 0;
      if (prediction) {
        frame = prediction.frame;
        model = prediction.model;
      }
      _.plots = Flow.Dataflow.signals([]);
      var _canInspect = prediction.__meta;
      var renderPlot = function renderPlot(title, prediction, render) {
        var container = Flow.Dataflow.signal(null);
        var combineWithFrame = function combineWithFrame() {
          var predictionsFrameName = prediction.predictions.frame_id.name;
          var targetFrameName = 'combined-' + predictionsFrameName;
          return _.insertAndExecuteCell('cs', 'bindFrames ' + flowPrelude$30.stringify(targetFrameName) + ', [ ' + flowPrelude$30.stringify(predictionsFrameName) + ', ' + flowPrelude$30.stringify(frame.name) + ' ]');
        };
        render(function (error, vis) {
          if (error) {
            return console.debug(error);
          }
          $('a', vis.element).on('click', function (e) {
            var $a = $(e.target);
            switch ($a.attr('data-type')) {
              case 'frame':
                return _.insertAndExecuteCell('cs', 'getFrameSummary ' + flowPrelude$30.stringify($a.attr('data-key')));
              case 'model':
                return _.insertAndExecuteCell('cs', 'getModel ' + flowPrelude$30.stringify($a.attr('data-key')));
              default:
              // do nothing
            }
          });
          return container(vis.element);
        });
        return _.plots.push({
          title: title,
          plot: container,
          combineWithFrame: combineWithFrame,
          canCombineWithFrame: title === 'Prediction'
        });
      };
      if (prediction) {
        _ref = prediction.__meta;
        switch (_ref != null ? _ref.schema_type : void 0) {
          case 'ModelMetricsBinomial':
          case 'ModelMetricsBinomialGLM':
            table = _.inspect('Prediction - Metrics for Thresholds', prediction);
            if (table) {
              renderPlot('ROC Curve', prediction, _.plot(function (g) {
                return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
              }));
            }
            break;
          default:
          // do nothing
        }
        _ref1 = _.ls(prediction);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          tableName = _ref1[_i];
          table = _.inspect(tableName, prediction);
          if (table) {
            if (table.indices.length > 1) {
              renderPlot(tableName, prediction, _.plot(function (g) {
                return g(g.select(), g.from(table));
              }));
            } else {
              renderPlot(tableName, prediction, _.plot(function (g) {
                return g(g.select(0), g.from(table));
              }));
            }
          }
        }
      }
      var inspect = function inspect() {
        // eslint-disable-line
        // XXX get this from prediction table
        return _.insertAndExecuteCell('cs', 'inspect getPrediction model: ' + flowPrelude$30.stringify(model.name) + ', frame: ' + flowPrelude$30.stringify(frame.name));
      };
      lodash.defer(_go);
      return {
        plots: _.plots,
        inspect: inspect,
        canInspect: _canInspect,
        template: 'flow-predict-output'
      };
    }

    var flowPrelude$26 = flowPreludeFunction();

    function extendPrediction(_, result) {
      var lodash = window._;
      var prediction = void 0;
      var modelKey = result.model.name;
      var _ref1 = result.frame;
      var frameKey = _ref1 != null ? _ref1.name : void 0;
      prediction = lodash.head(result.model_metrics);
      var predictionFrame = result.predictions_frame;
      var inspections = {};
      if (prediction) {
        inspectObject(inspections, 'Prediction', 'getPrediction model: ' + flowPrelude$26.stringify(modelKey) + ', frame: ' + flowPrelude$26.stringify(frameKey), prediction);
      } else {
        prediction = {};
        inspectObject(inspections, 'Prediction', 'getPrediction model: ' + flowPrelude$26.stringify(modelKey) + ', frame: ' + flowPrelude$26.stringify(frameKey), { prediction_frame: predictionFrame });
      }
      inspect_(prediction, inspections);
      return render_(_, prediction, h2oPredictOutput, prediction);
    }

    function unwrapPrediction(_, go) {
      return function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendPrediction(_, result));
      };
    }

    function postPredictRequest(_, destinationKey, modelKey, frameKey, options, go) {
      var opt = void 0;
      var opts = {};
      if (destinationKey) {
        opts.predictions_frame = destinationKey;
      }
      opt = options.reconstruction_error;
      if (void 0 !== opt) {
        opts.reconstruction_error = opt;
      }
      opt = options.deep_features_hidden_layer;
      if (void 0 !== opt) {
        opts.deep_features_hidden_layer = opt;
      }
      opt = options.leaf_node_assignment;
      if (void 0 !== opt) {
        opts.leaf_node_assignment = opt;
      }
      opt = options.exemplar_index;
      if (void 0 !== opt) {
        opts.exemplar_index = opt;
      }
      return doPost(_, '/3/Predictions/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), opts, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, result);
      });
    }

    function requestPredict(_, destinationKey, modelKey, frameKey, options, go) {
      return postPredictRequest(_, destinationKey, modelKey, frameKey, options, unwrapPrediction(_, go));
    }

    function requestParseSetup(_, sourceKeys, go) {
      return postParseSetupRequest(_, sourceKeys, function (error, parseSetupResults) {
        if (error) {
          return go(error);
        }
        return go(null, extendParseSetupResults(_, { source_frames: sourceKeys }, parseSetupResults));
      });
    }

    function h2oCancelJobOutput(_, _go, _cancellation) {
      var lodash = window._;
      lodash.defer(_go);
      return { template: 'flow-cancel-job-output' };
    }

    function extendCancelJob(_, cancellation) {
      return render_(_, cancellation, h2oCancelJobOutput, cancellation);
    }

    function requestCancelJob(_, key, go) {
      return postCancelJobRequest(_, key, function (error) {
        if (error) {
          return go(error);
        }
        return go(null, extendCancelJob(_, {}));
      });
    }

    // Create data for partial dependence plot(s)
    // for the specified model and frame.
    //
    // make a post request to h2o-3 to request
    // the data about the specified model and frame
    // subject to the other options `opts`
    //
    // returns a job
    function postPartialDependenceRequest(_, opts, go) {
      return doPost(_, '/3/PartialDependence/', opts, go);
    }

    function requestPartialDependence(_, opts, go) {
      return postPartialDependenceRequest(_, opts, function (error, result) {
        if (error) {
          return go(error);
        }
        return getJobRequest(_, result.key.name, function (error, job) {
          if (error) {
            return go(error);
          }
          return go(null, extendJob(_, job));
        });
      });
    }

    var flowPrelude$32 = flowPreludeFunction();

    function h2oPartialDependenceOutput(_, _go, _result) {
      var lodash = window._;
      var Flow = window.Flow;
      var data = void 0;
      var i = void 0;
      var section = void 0;
      var table = void 0;
      var x = void 0;
      var y = void 0;
      var _i = void 0;
      var _len = void 0;
      var _destinationKey = _result.destination_key;
      var _modelId = _result.model_id.name;
      var _frameId = _result.frame_id.name;
      var _isFrameShown = Flow.Dataflow.signal(false);
      var renderPlot = function renderPlot(target, render) {
        return render(function (error, vis) {
          if (error) {
            return console.debug(error);
          }
          return target(vis.element);
        });
      };

      // Hold as many plots as are present in the result.
      _.plots = [];

      var _ref = _result.partial_dependence_data;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        data = _ref[i];
        table = _.inspect('plot' + (i + 1), _result);
        if (table) {
          x = data.columns[0].name;
          y = data.columns[1].name;
          _.plots.push(section = {
            title: x + ' vs ' + y,
            plot: Flow.Dataflow.signal(null),
            frame: Flow.Dataflow.signal(null),
            isFrameShown: Flow.Dataflow.signal(false)
          });
          renderPlot(section.plot, _.plot(function (g) {
            return g(g.path(g.position(x, y), g.strokeColor(g.value('#1f77b4'))), g.point(g.position(x, y), g.strokeColor(g.value('#1f77b4'))), g.from(table));
          }));
          renderPlot(section.frame, _.plot(function (g) {
            return g(g.select(), g.from(table));
          }));
          section.isFrameShown = Flow.Dataflow.lift(_isFrameShown, function (value) {
            return value;
          });
        }
      }
      var _viewFrame = function _viewFrame() {
        return _.insertAndExecuteCell('cs', 'requestPartialDependenceData ' + flowPrelude$32.stringify(_destinationKey));
      };
      lodash.defer(_go);
      return {
        destinationKey: _destinationKey,
        modelId: _modelId,
        frameId: _frameId,
        plots: _.plots,
        isFrameShown: _isFrameShown,
        viewFrame: _viewFrame,
        template: 'flow-partial-dependence-output'
      };
    }

    var flowPrelude$31 = flowPreludeFunction();

    function extendPartialDependence(_, result) {
      var data = void 0;
      var i = void 0;
      var origin = void 0;
      var _i = void 0;
      var inspections = {};
      var _ref1 = result.partial_dependence_data;
      _i = 0;
      var _len = _ref1.length;
      for (i = _i, _len; _i < _len; i = ++_i) {
        data = _ref1[i];
        origin = 'getPartialDependence ' + flowPrelude$31.stringify(result.destination_key);
        inspections['plot' + (i + 1)] = inspectTwoDimTable_(origin, 'plot' + (i + 1), data);
      }
      inspect_(result, inspections);
      render_(_, result, h2oPartialDependenceOutput, result);
      return result;
    }

    // make a post request to h2o-3 to do request
    // the data about the specified model and frame
    // subject to the other options `opts`
    //
    // returns a json response that contains the data
    function postPartialDependenceDataRequest(_, key, go) {
      return doGet(_, '/3/PartialDependence/' + encodeURIComponent(key), function (error, result) {
        if (error) {
          return go(error, result);
        }
        return go(error, result);
      });
    }

    function requestPartialDependenceData(_, key, go) {
      return postPartialDependenceDataRequest(_, key, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendPartialDependence(_, result));
      });
    }

    function h2oExportModelOutput(_, _go, result) {
      var lodash = window._;
      lodash.defer(_go);
      return { template: 'flow-export-model-output' };
    }

    function extendExportModel(_, result) {
      return render_(_, result, h2oExportModelOutput, result);
    }

    function getExportModelRequest(_, key, path, overwrite, go) {
      return doGet(_, '/99/Models.bin/' + encodeURIComponent(key) + '?dir=' + encodeURIComponent(path) + '&force=' + overwrite, go);
    }

    function requestExportModel(_, modelKey, path, opts, go) {
      return getExportModelRequest(_, modelKey, path, opts.overwrite, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendExportModel(_, result));
      });
    }

    function getNetworkTestRequest(_, go) {
      return doGet(_, '/3/NetworkTest', go);
    }

    function inspectNetworkTestResult(testResult) {
      return function () {
        return convertTableToFrame(testResult.table, testResult.table.name, {
          description: testResult.table.name,
          origin: 'testNetwork'
        });
      };
    }

    function h2oNetworkTestOutput(_, _go, _testResult) {
      var lodash = window._;
      var Flow = window.Flow;
      var _result = Flow.Dataflow.signal(null);
      var render = _.plot(function (g) {
        return g(g.select(), g.from(_.inspect('result', _testResult)));
      });
      render(function (error, vis) {
        if (error) {
          return console.debug(error);
        }
        return _result(vis.element);
      });
      lodash.defer(_go);
      return {
        result: _result,
        template: 'flow-network-test-output'
      };
    }

    function extendNetworkTest(_, testResult) {
      inspect_(testResult, { result: inspectNetworkTestResult(testResult) });
      return render_(_, testResult, h2oNetworkTestOutput, testResult);
    }

    function requestNetworkTest(_, go) {
      return getNetworkTestRequest(_, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendNetworkTest(_, result));
      });
    }

    function testNetwork(_) {
      return _fork(requestNetworkTest, _);
    }

    var flowPrelude$33 = flowPreludeFunction();

    function h2oFramesOutput(_, _go, _frames) {
      var lodash = window._;
      var Flow = window.Flow;
      var _isCheckingAll = void 0;
      var _frameViews = Flow.Dataflow.signal([]);
      var _checkAllFrames = Flow.Dataflow.signal(false);
      var _hasSelectedFrames = Flow.Dataflow.signal(false);
      _isCheckingAll = false;
      Flow.Dataflow.react(_checkAllFrames, function (checkAll) {
        var _i = void 0;
        var _len = void 0;
        var view = void 0;
        _isCheckingAll = true;
        var _ref = _frameViews();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.isChecked(checkAll);
        }
        _hasSelectedFrames(checkAll);
        _isCheckingAll = false;
      });
      var createFrameView = function createFrameView(frame) {
        var _isChecked = Flow.Dataflow.signal(false);
        Flow.Dataflow.react(_isChecked, function () {
          var view = void 0;
          if (_isCheckingAll) {
            return;
          }
          var checkedViews = function () {
            var _i = void 0;
            var _len = void 0;
            var _ref = _frameViews();
            var _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              view = _ref[_i];
              if (view.isChecked()) {
                _results.push(view);
              }
            }
            return _results;
          }();
          return _hasSelectedFrames(checkedViews.length > 0);
        });
        var columnLabels = lodash.head(lodash.map(frame.columns, function (column) {
          return column.label;
        }), 15);
        var view = function view() {
          if (frame.is_text) {
            return _.insertAndExecuteCell('cs', 'setupParse source_frames: [ ' + flowPrelude$33.stringify(frame.frame_id.name) + ' ]');
          }
          return _.insertAndExecuteCell('cs', 'getFrameSummary ' + flowPrelude$33.stringify(frame.frame_id.name));
        };
        var predict = function predict() {
          return _.insertAndExecuteCell('cs', 'predict frame: ' + flowPrelude$33.stringify(frame.frame_id.name));
        };
        var inspect = function inspect() {
          return _.insertAndExecuteCell('cs', 'inspect getFrameSummary ' + flowPrelude$33.stringify(frame.frame_id.name));
        };
        var createModel = function createModel() {
          return _.insertAndExecuteCell('cs', 'assist buildModel, null, training_frame: ' + flowPrelude$33.stringify(frame.frame_id.name));
        };
        return {
          key: frame.frame_id.name,
          isChecked: _isChecked,
          size: formatBytes(frame.byte_size),
          rowCount: frame.rows,
          columnCount: frame.columns,
          isText: frame.is_text,
          view: view,
          predict: predict,
          inspect: inspect,
          createModel: createModel
        };
      };
      var importFiles = function importFiles() {
        return _.insertAndExecuteCell('cs', 'importFiles');
      };
      var collectSelectedKeys = function collectSelectedKeys() {
        var view = void 0;
        var _i = void 0;
        var _len = void 0;
        var _ref = _frameViews();
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (view.isChecked()) {
            _results.push(view.key);
          }
        }
        return _results;
      };
      var predictOnFrames = function predictOnFrames() {
        return _.insertAndExecuteCell('cs', 'predict frames: ' + flowPrelude$33.stringify(collectSelectedKeys()));
      };
      var deleteFrames = function deleteFrames() {
        return _.confirm('Are you sure you want to delete these frames?', {
          acceptCaption: 'Delete Frames',
          declineCaption: 'Cancel'
        }, function (accept) {
          if (accept) {
            return _.insertAndExecuteCell('cs', 'deleteFrames ' + flowPrelude$33.stringify(collectSelectedKeys()));
          }
        });
      };
      _frameViews(lodash.map(_frames, createFrameView));
      lodash.defer(_go);
      return {
        frameViews: _frameViews,
        hasFrames: _frames.length > 0,
        importFiles: importFiles,
        predictOnFrames: predictOnFrames,
        deleteFrames: deleteFrames,
        hasSelectedFrames: _hasSelectedFrames,
        checkAllFrames: _checkAllFrames,
        template: 'flow-frames-output'
      };
    }

    function extendFrames(_, frames) {
      render_(_, frames, h2oFramesOutput, frames);
      return frames;
    }

    function requestFrames(_, go) {
      return _.requestFrames(_, function (error, frames) {
        if (error) {
          return go(error);
        }
        return go(null, extendFrames(_, frames));
      });
    }

    function getFrames(_) {
      return _fork(requestFrames, _);
    }

    var flowPrelude$34 = flowPreludeFunction();

    function h2oBindFramesOutput(_, _go, key, result) {
      var lodash = window._;
      var Flow = window.Flow;
      var viewFrame = function viewFrame() {
        return _.insertAndExecuteCell('cs', 'getFrameSummary ' + flowPrelude$34.stringify(key));
      };
      lodash.defer(_go);
      return {
        viewFrame: viewFrame,
        template: 'flow-bind-frames-output'
      };
    }

    function extendBindFrames(_, key, result) {
      return render_(_, result, h2oBindFramesOutput, key, result);
    }

    function requestBindFrames(_, key, sourceKeys, go) {
      return requestExec(_, '(assign ' + key + ' (cbind ' + sourceKeys.join(' ') + '))', function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendBindFrames(_, key, result));
      });
    }

    var flowPrelude$35 = flowPreludeFunction();

    function h2oGridsOutput(_, _go, _grids) {
      var lodash = window._;
      var Flow = window.Flow;
      var _gridViews = Flow.Dataflow.signal([]);
      var createGridView = function createGridView(grid) {
        var view = function view() {
          return _.insertAndExecuteCell('cs', 'getGrid ' + flowPrelude$35.stringify(grid.grid_id.name));
        };
        return {
          key: grid.grid_id.name,
          size: grid.model_ids.length,
          view: view
        };
      };
      var buildModel = function buildModel() {
        return _.insertAndExecuteCell('cs', 'buildModel');
      };
      var initialize = function initialize(grids) {
        _gridViews(lodash.map(grids, createGridView));
        return lodash.defer(_go);
      };
      initialize(_grids);
      return {
        gridViews: _gridViews,
        hasGrids: _grids.length > 0,
        buildModel: buildModel,
        template: 'flow-grids-output'
      };
    }

    function extendGrids(_, grids) {
      return render_(_, grids, h2oGridsOutput, grids);
    }

    function getGridsRequest(_, go, opts) {
      return doGet(_, '/99/Grids', function (error, result) {
        if (error) {
          return go(error, result);
        }
        return go(error, result.grids);
      });
    }

    function requestGrids(_, go) {
      return getGridsRequest(_, function (error, grids) {
        if (error) {
          return go(error);
        }
        return go(null, extendGrids(_, grids));
      });
    }

    function getGrids(_) {
      return _fork(requestGrids, _);
    }

    function getCloudRequest(_, go) {
      return doGet(_, '/3/Cloud', go);
    }

    function fromNow(date) {
      var moment = window.moment;
      return moment(date).fromNow();
    }

    function h2oCloudOutput(_, _go, _cloud) {
      var lodash = window._;
      var Flow = window.Flow;
      var moment = window.moment;
      var d3 = window.d3;
      var _isHealthy = Flow.Dataflow.signal();
      // TODO Display in .jade
      var _exception = Flow.Dataflow.signal(null);
      var _isLive = Flow.Dataflow.signal(false);
      var _isBusy = Flow.Dataflow.signal(false);
      var _isExpanded = Flow.Dataflow.signal(false);
      var _name = Flow.Dataflow.signal();
      var _size = Flow.Dataflow.signal();
      var _uptime = Flow.Dataflow.signal();
      var _version = Flow.Dataflow.signal();
      var _nodeCounts = Flow.Dataflow.signal();
      var _hasConsensus = Flow.Dataflow.signal();
      var _isLocked = Flow.Dataflow.signal();
      var _nodes = Flow.Dataflow.signals();
      var formatMilliseconds = function formatMilliseconds(ms) {
        return fromNow(new Date(new Date().getTime() - ms));
      };

      // precision = 3
      var format3f = d3.format('.3f');
      var _sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      var prettyPrintBytes = function prettyPrintBytes(bytes) {
        if (bytes === 0) {
          return '-';
        }
        var i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + _sizes[i];
      };
      var formatThreads = function formatThreads(fjs) {
        var i = void 0;
        var maxLo = void 0;
        var s = void 0;
        var _i = void 0;
        var _j = void 0;
        var _k = void 0;
        var _ref = void 0;
        for (maxLo = _i = 120; _i > 0; maxLo = --_i) {
          if (fjs[maxLo - 1] !== -1) {
            break;
          }
        }
        s = '[';
        for (i = _j = 0; maxLo >= 0 ? _j < maxLo : _j > maxLo; i = maxLo >= 0 ? ++_j : --_j) {
          s += Math.max(fjs[i], 0);
          s += '/';
        }
        s += '.../';
        for (i = _k = 120, _ref = fjs.length - 1; _ref >= 120 ? _k < _ref : _k > _ref; i = _ref >= 120 ? ++_k : --_k) {
          s += fjs[i];
          s += '/';
        }
        s += fjs[fjs.length - 1];
        s += ']';
        return s;
      };
      var sum = function sum(nodes, attrOf) {
        var node = void 0;
        var total = void 0;
        var _i = void 0;
        var _len = void 0;
        total = 0;
        for (_i = 0, _len = nodes.length; _i < _len; _i++) {
          node = nodes[_i];
          total += attrOf(node);
        }
        return total;
      };
      var avg = function avg(nodes, attrOf) {
        return sum(nodes, attrOf) / nodes.length;
      };
      var _headers = [
      // [ Caption, show_always? ]
      ['&nbsp;', true], ['Name', true], ['Ping', true], ['Cores', true], ['Load', true], ['My CPU %', true], ['Sys CPU %', true], ['GFLOPS', true], ['Memory Bandwidth', true], ['Data (Used/Total)', true], ['Data (% Cached)', true], ['GC (Free / Total / Max)', true], ['Disk (Free / Max)', true], ['Disk (% Free)', true], ['PID', false], ['Keys', false], ['TCP', false], ['FD', false], ['RPCs', false], ['Threads', false], ['Tasks', false]];
      var createNodeRow = function createNodeRow(node) {
        return [node.healthy, node.ip_port, moment(new Date(node.last_ping)).fromNow(), node.num_cpus, format3f(node.sys_load), node.my_cpu_pct, node.sys_cpu_pct, format3f(node.gflops), prettyPrintBytes(node.mem_bw) + ' / s', prettyPrintBytes(node.mem_value_size) + ' / ' + prettyPrintBytes(node.total_value_size), Math.floor(node.mem_value_size * 100 / node.total_value_size) + '%', prettyPrintBytes(node.free_mem) + ' / ' + prettyPrintBytes(node.tot_mem) + ' / ' + prettyPrintBytes(node.max_mem), prettyPrintBytes(node.free_disk) + ' / ' + prettyPrintBytes(node.max_disk), Math.floor(node.free_disk * 100 / node.max_disk) + '%', node.pid, node.num_keys, node.tcps_active, node.open_fds, node.rpcs_active, formatThreads(node.fjthrds), formatThreads(node.fjqueue)];
      };
      var createTotalRow = function createTotalRow(cloud) {
        var nodes = cloud.nodes;
        return [cloud.cloud_healthy, 'TOTAL', '-', sum(nodes, function (node) {
          return node.num_cpus;
        }), format3f(sum(nodes, function (node) {
          return node.sys_load;
        })), '-', '-', '' + format3f(sum(nodes, function (node) {
          return node.gflops;
        })), prettyPrintBytes(sum(nodes, function (node) {
          return node.mem_bw;
        })) + ' / s', prettyPrintBytes(sum(nodes, function (node) {
          return node.mem_value_size;
        })) + ' / ' + prettyPrintBytes(sum(nodes, function (node) {
          return node.total_value_size;
        })), Math.floor(avg(nodes, function (node) {
          return node.mem_value_size * 100 / node.total_value_size;
        })) + '%', prettyPrintBytes(sum(nodes, function (node) {
          return node.free_mem;
        })) + ' / ' + prettyPrintBytes(sum(nodes, function (node) {
          return node.tot_mem;
        })) + ' / ' + prettyPrintBytes(sum(nodes, function (node) {
          return node.max_mem;
        })), prettyPrintBytes(sum(nodes, function (node) {
          return node.free_disk;
        })) + ' / ' + prettyPrintBytes(sum(nodes, function (node) {
          return node.max_disk;
        })), Math.floor(avg(nodes, function (node) {
          return node.free_disk * 100 / node.max_disk;
        })) + '%', '-', sum(nodes, function (node) {
          return node.num_keys;
        }), sum(nodes, function (node) {
          return node.tcps_active;
        }), sum(nodes, function (node) {
          return node.open_fds;
        }), sum(nodes, function (node) {
          return node.rpcs_active;
        }), '-', '-'];
      };
      var createGrid = function createGrid(cloud, isExpanded) {
        var caption = void 0;
        var cell = void 0;
        var i = void 0;
        var row = void 0;
        var showAlways = void 0;
        var tds = void 0;
        var _ref = Flow.HTML.template('.grid', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'i.fa.fa-check-circle.text-success', 'i.fa.fa-exclamation-circle.text-danger');
        var grid = _ref[0];
        var table = _ref[1];
        var thead = _ref[2];
        var tbody = _ref[3];
        var tr = _ref[4];
        var th = _ref[5];
        var td = _ref[6];
        var success = _ref[7];
        var danger = _ref[8];
        var nodeRows = lodash.map(cloud.nodes, createNodeRow);
        nodeRows.push(createTotalRow(cloud));
        var ths = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref1 = void 0;
          var _results = [];
          for (_i = 0, _len = _headers.length; _i < _len; _i++) {
            _ref1 = _headers[_i];
            caption = _ref1[0];
            showAlways = _ref1[1];
            if (showAlways || isExpanded) {
              _results.push(th(caption));
            }
          }
          return _results;
        }();
        var trs = function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = nodeRows.length; _i < _len; _i++) {
            row = nodeRows[_i];
            tds = function () {
              var _j = void 0;
              var _len1 = void 0;
              var _results1 = [];
              for (i = _j = 0, _len1 = row.length; _j < _len1; i = ++_j) {
                cell = row[i];
                if (_headers[i][1] || isExpanded) {
                  if (i === 0) {
                    _results1.push(td(cell ? success() : danger()));
                  } else {
                    _results1.push(td(cell));
                  }
                }
              }
              return _results1;
            }();
            _results.push(tr(tds));
          }
          return _results;
        }();
        return Flow.HTML.render('div', grid([table([thead(tr(ths)), tbody(trs)])]));
      };
      var updateCloud = function updateCloud(cloud, isExpanded) {
        _name(cloud.cloud_name);
        _version(cloud.version);
        _hasConsensus(cloud.consensus);
        _uptime(formatMilliseconds(cloud.cloud_uptime_millis));
        _nodeCounts(cloud.cloud_size - cloud.bad_nodes + ' / ' + cloud.cloud_size);
        _isLocked(cloud.locked);
        _isHealthy(cloud.cloud_healthy);
        return _nodes(createGrid(cloud, isExpanded));
      };
      var toggleRefresh = function toggleRefresh() {
        return _isLive(!_isLive());
      };
      var refresh = function refresh() {
        _isBusy(true);
        return getCloudRequest(_, function (error, cloud) {
          _isBusy(false);
          if (error) {
            _exception(Flow.failure(_, new Flow.Error('Error fetching cloud status', error)));
            return _isLive(false);
          }
          updateCloud(_cloud = cloud, _isExpanded());
          if (_isLive()) {
            return lodash.delay(refresh, 2000);
          }
        });
      };
      Flow.Dataflow.act(_isLive, function (isLive) {
        if (isLive) {
          return refresh();
        }
      });
      var toggleExpansion = function toggleExpansion() {
        return _isExpanded(!_isExpanded());
      };
      Flow.Dataflow.act(_isExpanded, function (isExpanded) {
        return updateCloud(_cloud, isExpanded);
      });
      updateCloud(_cloud, _isExpanded());
      lodash.defer(_go);
      return {
        name: _name,
        size: _size,
        uptime: _uptime,
        version: _version,
        nodeCounts: _nodeCounts,
        hasConsensus: _hasConsensus,
        isLocked: _isLocked,
        isHealthy: _isHealthy,
        nodes: _nodes,
        isLive: _isLive,
        isBusy: _isBusy,
        toggleRefresh: toggleRefresh,
        refresh: refresh,
        isExpanded: _isExpanded,
        toggleExpansion: toggleExpansion,
        template: 'flow-cloud-output'
      };
    }

    function extendCloud(_, cloud) {
      return render_(_, cloud, h2oCloudOutput, cloud);
    }

    function requestCloud(_, go) {
      return getCloudRequest(_, function (error, cloud) {
        if (error) {
          return go(error);
        }
        return go(null, extendCloud(_, cloud));
      });
    }

    function getCloud(_) {
      return _fork(requestCloud, _);
    }

    function getTimelineRequest(_, go) {
      return doGet(_, '/3/Timeline', go);
    }

    function h2oTimelineOutput(_, _go, _timeline) {
      var lodash = window._;
      var Flow = window.Flow;
      var _exception = Flow.Dataflow.signal(null);
      var _isLive = Flow.Dataflow.signal(false);
      var _isBusy = Flow.Dataflow.signal(false);
      var _headers = ['HH:MM:SS:MS', 'nanosec', 'Who', 'I/O Type', 'Event', 'Type', 'Bytes'];
      var _data = Flow.Dataflow.signal(null);
      var _timestamp = Flow.Dataflow.signal(Date.now());
      var createEvent = function createEvent(event) {
        switch (event.type) {
          case 'io':
            return [event.date, event.nanos, event.node, event.io_flavor || '-', 'I/O', '-', event.data];
          case 'heartbeat':
            return [event.date, event.nanos, 'many &#8594;  many', 'UDP', event.type, '-', event.sends + ' sent ' + event.recvs + ' received\''];
          case 'network_msg':
            return [event.date, event.nanos, event.from + ' &#8594; ' + event.to, event.protocol, event.msg_type, event.is_send ? 'send' : 'receive', event.data];
          default:
        }
      };
      var updateTimeline = function updateTimeline(timeline) {
        var cell = void 0;
        var event = void 0;
        var header = void 0;
        var _ref = Flow.HTML.template('.grid', 'table', 'thead', 'tbody', 'tr', 'th', 'td');
        var grid = _ref[0];
        var table = _ref[1];
        var thead = _ref[2];
        var tbody = _ref[3];
        var tr = _ref[4];
        var th = _ref[5];
        var td = _ref[6];
        var ths = function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = _headers.length; _i < _len; _i++) {
            header = _headers[_i];
            _results.push(th(header));
          }
          return _results;
        }();
        var trs = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref1 = timeline.events;
          var _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            event = _ref1[_i];
            _results.push(tr(function () {
              var _j = void 0;
              var _len1 = void 0;
              var _ref2 = createEvent(event);
              var _results1 = [];
              for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                cell = _ref2[_j];
                _results1.push(td(cell));
              }
              return _results1;
            }()));
          }
          return _results;
        }();
        return _data(Flow.HTML.render('div', grid([table([thead(tr(ths)), tbody(trs)])])));
      };
      var toggleRefresh = function toggleRefresh() {
        return _isLive(!_isLive());
      };
      var refresh = function refresh() {
        _isBusy(true);
        return getTimelineRequest(_, function (error, timeline) {
          _isBusy(false);
          if (error) {
            _exception(Flow.failure(_, new Flow.Error('Error fetching timeline', error)));
            return _isLive(false);
          }
          updateTimeline(timeline);
          if (_isLive()) {
            return lodash.delay(refresh, 2000);
          }
        });
      };
      Flow.Dataflow.act(_isLive, function (isLive) {
        if (isLive) {
          return refresh();
        }
      });
      updateTimeline(_timeline);
      lodash.defer(_go);
      return {
        data: _data,
        isLive: _isLive,
        isBusy: _isBusy,
        toggleRefresh: toggleRefresh,
        refresh: refresh,
        template: 'flow-timeline-output'
      };
    }

    function extendTimeline(_, timeline) {
      return render_(_, timeline, h2oTimelineOutput, timeline);
    }

    function requestTimeline(_, go) {
      return getTimelineRequest(_, function (error, timeline) {
        if (error) {
          return go(error);
        }
        return go(null, extendTimeline(_, timeline));
      });
    }

    function getTimeline(_) {
      return _fork(requestTimeline, _);
    }

    function h2oStackTraceOutput(_, _go, _stackTrace) {
      var lodash = window._;
      var Flow = window.Flow;
      var node = void 0;
      var _activeNode = Flow.Dataflow.signal(null);
      var createThread = function createThread(thread) {
        var lines = thread.split('\n');
        return {
          title: lodash.head(lines),
          stackTrace: lodash.tail(lines).join('\n')
        };
      };
      var createNode = function createNode(node) {
        var thread = void 0;
        var display = function display() {
          return _activeNode(self);
        };
        var self = {
          name: node.node,
          timestamp: new Date(node.time),
          threads: function () {
            var _i = void 0;
            var _len = void 0;
            var _ref = node.thread_traces;
            var _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              thread = _ref[_i];
              _results.push(createThread(thread));
            }
            return _results;
          }(),
          display: display
        };
        return self;
      };
      var _nodes = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = _stackTrace.traces;
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          _results.push(createNode(node));
        }
        return _results;
      }();
      _activeNode(lodash.head(_nodes));
      lodash.defer(_go);
      return {
        nodes: _nodes,
        activeNode: _activeNode,
        template: 'flow-stacktrace-output'
      };
    }

    function extendStackTrace(_, stackTrace) {
      return render_(_, stackTrace, h2oStackTraceOutput, stackTrace);
    }

    function getStackTraceRequest(_, go) {
      return doGet(_, '/3/JStack', go);
    }

    function requestStackTrace(_, go) {
      return getStackTraceRequest(_, function (error, stackTrace) {
        if (error) {
          return go(error);
        }
        return go(null, extendStackTrace(_, stackTrace));
      });
    }

    function getStackTrace(_) {
      return _fork(requestStackTrace, _);
    }

    function getLogFileRequest(_, nodeIndex, fileType, go) {
      return doGet(_, '/3/Logs/nodes/' + nodeIndex + '/files/' + fileType, go);
    }

    function h2oLogFileOutput(_, _go, _cloud, _nodeIndex, _fileType, _logFile) {
      var lodash = window._;
      var Flow = window.Flow;
      // TODO Display in .jade
      var _exception = Flow.Dataflow.signal(null);
      var _contents = Flow.Dataflow.signal('');
      var _nodes = Flow.Dataflow.signal([]);
      var _activeNode = Flow.Dataflow.signal(null);
      var _fileTypes = Flow.Dataflow.signal(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'httpd', 'stdout', 'stderr']);
      var _activeFileType = Flow.Dataflow.signal(null);
      var createNode = function createNode(node, index) {
        return {
          name: node.ip_port,
          index: index
        };
      };
      var refreshActiveView = function refreshActiveView(node, fileType) {
        if (node) {
          return getLogFileRequest(_, node.index, fileType, function (error, logFile) {
            if (error) {
              return _contents('Error fetching log file: ' + error.message);
            }
            return _contents(logFile.log);
          });
        }
        return _contents('');
      };
      var refresh = function refresh() {
        return refreshActiveView(_activeNode(), _activeFileType());
      };
      var initialize = function initialize(cloud, nodeIndex, fileType, logFile) {
        var NODE_INDEX_SELF = void 0;
        var clientNode = void 0;
        var i = void 0;
        var n = void 0;
        var _i = void 0;
        var _len = void 0;
        _activeFileType(fileType);
        _contents(logFile.log);
        var nodes = [];
        if (cloud.is_client) {
          clientNode = { ip_port: 'driver' };
          NODE_INDEX_SELF = -1;
          nodes.push(createNode(clientNode, NODE_INDEX_SELF));
        }
        var _ref = cloud.nodes;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          n = _ref[i];
          nodes.push(createNode(n, i));
        }
        _nodes(nodes);
        if (nodeIndex < nodes.length) {
          _activeNode(nodes[nodeIndex]);
        }
        Flow.Dataflow.react(_activeNode, _activeFileType, refreshActiveView);
        return lodash.defer(_go);
      };
      initialize(_cloud, _nodeIndex, _fileType, _logFile);
      return {
        nodes: _nodes,
        activeNode: _activeNode,
        fileTypes: _fileTypes,
        activeFileType: _activeFileType,
        contents: _contents,
        refresh: refresh,
        template: 'flow-log-file-output'
      };
    }

    function extendLogFile(_, cloud, nodeIndex, fileType, logFile) {
      return render_(_, logFile, h2oLogFileOutput, cloud, nodeIndex, fileType, logFile);
    }

    function requestLogFile(_, nodeIndex, fileType, go) {
      return getCloudRequest(_, function (error, cloud) {
        var NODE_INDEX_SELF = void 0;
        if (error) {
          return go(error);
        }
        if (nodeIndex < 0 || nodeIndex >= cloud.nodes.length) {
          NODE_INDEX_SELF = -1;
          nodeIndex = NODE_INDEX_SELF;
        }
        return getLogFileRequest(_, nodeIndex, fileType, function (error, logFile) {
          if (error) {
            return go(error);
          }
          return go(null, extendLogFile(_, cloud, nodeIndex, fileType, logFile));
        });
      });
    }

    function deleteAllRequest(_, go) {
      return doDelete(_, '/3/DKV', go);
    }

    function requestRemoveAll(_, go) {
      return deleteAllRequest(_, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendDeletedKeys(_, []));
      });
    }

    function deleteAll(_) {
      return _fork(requestRemoveAll, _);
    }

    function getProfileRequest(_, depth, go) {
      return doGet(_, '/3/Profiler?depth=' + depth, go);
    }

    function h2oProfileOutput(_, _go, _profile) {
      var lodash = window._;
      var Flow = window.Flow;
      var i = void 0;
      var node = void 0;
      var _activeNode = Flow.Dataflow.signal(null);
      var createNode = function createNode(node) {
        var entry = void 0;
        var display = function display() {
          return _activeNode(self);
        };
        var entries = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref = node.entries;
          var _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            entry = _ref[_i];
            _results.push({
              stacktrace: entry.stacktrace,
              caption: 'Count: ' + entry.count
            });
          }
          return _results;
        }();
        var self = {
          name: node.node_name,
          caption: node.node_name + ' at ' + new Date(node.timestamp),
          entries: entries,
          display: display
        };
        return self;
      };
      var _nodes = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = _profile.nodes;
        var _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          node = _ref[i];
          _results.push(createNode(node));
        }
        return _results;
      }();
      _activeNode(lodash.head(_nodes));
      lodash.defer(_go);
      return {
        nodes: _nodes,
        activeNode: _activeNode,
        template: 'flow-profile-output'
      };
    }

    function extendProfile(_, profile) {
      return render_(_, profile, h2oProfileOutput, profile);
    }

    function requestProfile(_, depth, go) {
      return getProfileRequest(_, depth, function (error, profile) {
        if (error) {
          return go(error);
        }
        return go(null, extendProfile(_, profile));
      });
    }

    function doPostJSON(_, path, opts, go) {
      return http(_, 'POSTJSON', path, opts, go);
    }

    function postAutoModelBuildRequest(_, parameters, go) {
      return doPostJSON(_, '/99/AutoMLBuilder', parameters, go);
    }

    function requestAutoModelBuild(_, opts, go) {
      var params = {
        input_spec: {
          training_frame: opts.frame,
          response_column: opts.column
        },
        build_control: { stopping_criteria: { max_runtime_secs: opts.maxRunTime } }
      };
      return postAutoModelBuildRequest(_, params, function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, extendJob(_, result.job));
      });
    }

    function requestDeleteModels(_, modelKeys, go) {
      var lodash = window._;
      var Flow = window.Flow;
      var futures = lodash.map(modelKeys, function (modelKey) {
        return _fork(deleteModelRequest, _, modelKey);
      });
      return Flow.Async.join(futures, function (error, results) {
        if (error) {
          return go(error);
        }
        return go(null, extendDeletedKeys(_, modelKeys));
      });
    }

    function getModelRequest(_, key, go) {
      var lodash = window._;
      return doGet(_, '/3/Models/' + encodeURIComponent(key), function (error, result) {
        if (error) {
          return go(error, result);
        }
        return go(error, lodash.head(result.models));
      });
    }

    function requestModelsByKeys(_, modelKeys, go) {
      var lodash = window._;
      var Flow = window.Flow;
      var futures = lodash.map(modelKeys, function (key) {
        return _fork(getModelRequest, _, key);
      });
      return Flow.Async.join(futures, function (error, models) {
        if (error) {
          return go(error);
        }
        return go(null, extendModels(_, models));
      });
    }

    function requestDeleteFrames(_, frameKeys, go) {
      var lodash = window._;
      var Flow = window.Flow;
      var futures = lodash.map(frameKeys, function (frameKey) {
        return _fork(_.requestDeleteFrame, _, frameKey);
      });
      return Flow.Async.join(futures, function (error, results) {
        if (error) {
          return go(error);
        }
        return go(null, extendDeletedKeys(_, frameKeys));
      });
    }

    var flowPrelude$37 = flowPreludeFunction();

    function inspectModelParameters(model) {
      return function () {
        var lodash = window._;

        var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
        if (lightning.settings) {
          lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
          lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
        }
        var createList = lightning.createList;
        var createDataframe = lightning.createFrame;

        var attr = void 0;
        var data = void 0;
        var i = void 0;
        var parameter = void 0;
        var parameters = model.parameters;
        var attrs = ['label', 'type', 'level', 'actual_value', 'default_value'];
        var vectors = function () {
          var _i = void 0;
          var _j = void 0;
          var _len = void 0;
          var _len1 = void 0;
          var _results = [];
          for (_i = 0, _len = attrs.length; _i < _len; _i++) {
            attr = attrs[_i];
            data = new Array(parameters.length);
            for (i = _j = 0, _len1 = parameters.length; _j < _len1; i = ++_j) {
              parameter = parameters[i];
              data[i] = attr === 'actual_value' ? getModelParameterValue(parameter.type, parameter[attr]) : parameter[attr];
            }
            _results.push(createList(attr, data));
          }
          return _results;
        }();
        return createDataframe('parameters', vectors, lodash.range(parameters.length), null, {
          description: 'Parameters for model \'' + model.model_id.name + '\'', // TODO frame model_id
          origin: 'getModel ' + flowPrelude$37.stringify(model.model_id.name)
        });
      };
    }

    function renderMultinomialConfusionMatrix(_, title, cm) {
      var lodash = window._;
      var Flow = window.Flow;
      var cell = void 0;
      var cells = void 0;
      var column = void 0;
      var i = void 0;
      var rowIndex = void 0;
      var _i = void 0;
      var _ref = Flow.HTML.template('table.flow-confusion-matrix', 'tbody', 'tr', 'td', 'td.strong', 'td.bg-yellow');
      var table = _ref[0];
      var tbody = _ref[1];
      var tr = _ref[2];
      var normal = _ref[3];
      var bold = _ref[4];
      var yellow = _ref[5];
      var columnCount = cm.columns.length;
      var rowCount = cm.rowcount;
      var headers = lodash.map(cm.columns, function (column, i) {
        return bold(column.description);
      });

      // NW corner cell
      headers.unshift(normal(' '));
      var rows = [tr(headers)];
      var errorColumnIndex = columnCount - 2;
      var totalRowIndex = rowCount - 1;
      for (rowIndex = _i = 0; rowCount >= 0 ? _i < rowCount : _i > rowCount; rowIndex = rowCount >= 0 ? ++_i : --_i) {
        cells = function () {
          var _j = void 0;
          var _len = void 0;
          var _ref1 = cm.data;
          var _results = [];
          for (i = _j = 0, _len = _ref1.length; _j < _len; i = ++_j) {
            column = _ref1[i];

            // Last two columns should be emphasized
            // special-format error column
            cell = i < errorColumnIndex ? i === rowIndex ? yellow : rowIndex < totalRowIndex ? normal : bold : bold;
            _results.push(cell(i === errorColumnIndex ? format4f(column[rowIndex]) : column[rowIndex]));
          }
          return _results;
        }();
        // Add the corresponding column label
        cells.unshift(bold(rowIndex === rowCount - 1 ? 'Total' : cm.columns[rowIndex].description));
        rows.push(tr(cells));
      }
      return _.plots.push({
        title: title + (cm.description ? ' ' + cm.description : ''),
        plot: Flow.Dataflow.signal(Flow.HTML.render('div', table(tbody(rows)))),
        frame: Flow.Dataflow.signal(null),
        controls: Flow.Dataflow.signal(null),
        isCollapsed: false
      });
    }

    function renderConfusionMatrices(_) {
      var output = _.model.output;
      var confusionMatrix = void 0;
      if (output.model_category === 'Multinomial') {
        // training metrics
        if (output.training_metrics !== null && output.training_metrics.cm !== null && output.training_metrics.cm.table) {
          confusionMatrix = output.training_metrics.cm.table;
          renderMultinomialConfusionMatrix(_, 'Training Metrics - Confusion Matrix', confusionMatrix);
        }
        // validation metrics
        if (output.validation_metrics !== null && output.validation_metrics.cm !== null && output.validation_metrics.cm.table) {
          confusionMatrix = output.validation_metrics.cm.table;
          renderMultinomialConfusionMatrix(_, 'Validation Metrics - Confusion Matrix', confusionMatrix);
        }
        // cross validation metrics
        if (output.cross_validation_metrics !== null && output.cross_validation_metrics.cm !== null && output.cross_validation_metrics.cm.table) {
          confusionMatrix = output.cross_validation_metrics.cm.table;
          renderMultinomialConfusionMatrix(_, 'Cross Validation Metrics - Confusion Matrix', confusionMatrix);
        }
      }
    }

    function toggle(_) {
      return _.modelOutputIsExpanded(!_.modelOutputIsExpanded());
    }

    function cloneModel() {
      return alert('Not implemented');
    }

    var flowPrelude$38 = flowPreludeFunction();

    // the function called when the predict button
    // on the model output cell
    // is clicked
    function predict$1(_) {
      return _.insertAndExecuteCell('cs', 'predict model: ' + flowPrelude$38.stringify(_.model.model_id.name));
    }

    var flowPrelude$39 = flowPreludeFunction();

    function inspect$1(_) {
      _.insertAndExecuteCell('cs', 'inspect getModel ' + flowPrelude$39.stringify(_.model.model_id.name));
    }

    function download$1(type, url, go) {
      var Flow = window.Flow;
      var $ = window.jQuery;
      if (url.substring(0, 1) === '/') {
        url = window.Flow.ContextPath + url.substring(1);
      }
      return $.ajax({
        dataType: type,
        url: url,
        success: function success(data, status, xhr) {
          return go(null, data);
        },
        error: function error(xhr, status, _error) {
          return go(new Flow.Error(_error));
        }
      });
    }

    function requestPojoPreview(key, go) {
      return download$1('text', '/3/Models.java/' + encodeURIComponent(key) + '/preview', go);
    }

    function highlight(code, lang) {
      if (window.hljs) {
        return window.hljs.highlightAuto(code, [lang]).value;
      }
      return code;
    }

    function previewPojo(_) {
      var lodash = window._;
      return requestPojoPreview(_.model.model_id.name, function (error, result) {
        if (error) {
          return _.pojoPreview('<pre>' + lodash.escape(error) + '</pre>');
        }
        return _.pojoPreview('<pre>' + highlight(result, 'java') + '</pre>');
      });
    }

    function downloadPojo(_) {
      return window.open('/3/Models.java/' + encodeURIComponent(_.model.model_id.name), '_blank');
    }

    function downloadMojo(_) {
      return window.open('/3/Models/' + encodeURIComponent(_.model.model_id.name) + '/mojo', '_blank');
    }

    var flowPrelude$40 = flowPreludeFunction();

    function exportModel(_) {
      return _.insertAndExecuteCell('cs', 'exportModel ' + flowPrelude$40.stringify(_.model.model_id.name));
    }

    var flowPrelude$41 = flowPreludeFunction();

    function deleteModel(_) {
      return _.confirm('Are you sure you want to delete this model?', {
        acceptCaption: 'Delete Model',
        declineCaption: 'Cancel'
      }, function (accept) {
        if (accept) {
          return _.insertAndExecuteCell('cs', 'deleteModel ' + flowPrelude$41.stringify(_.model.model_id.name));
        }
      });
    }

    function renderTable(indices, subframe, g) {
      var lodash = window._;
      return g(indices.length > 1 ? g.select() : g.select(lodash.head(indices)), g.from(subframe));
    }

    var flowPrelude$42 = flowPreludeFunction();

    // TODO Mega-hack alert
    // Last arg thresholdsAndCriteria applicable only to
    // ROC charts for binomial models.
    function renderPlot$1(_, title, isCollapsed, render, thresholdsAndCriteria) {
      var _this = this;

      var lodash = window._;
      var Flow = window.Flow;
      var $ = window.jQuery;
      var rocPanel = void 0;
      var container = Flow.Dataflow.signal(null);
      var linkedFrame = Flow.Dataflow.signal(null);

      // TODO HACK
      if (thresholdsAndCriteria) {
        rocPanel = {
          thresholds: Flow.Dataflow.signals(thresholdsAndCriteria.thresholds),
          threshold: Flow.Dataflow.signal(null),
          criteria: Flow.Dataflow.signals(thresholdsAndCriteria.criteria),
          criterion: Flow.Dataflow.signal(null)
        };
      }
      render(function (error, vis) {
        var _autoHighlight = void 0;
        if (error) {
          return console.debug(error);
        }
        $('a', vis.element).on('click', function (e) {
          var $a = $(e.target);
          switch ($a.attr('data-type')) {
            case 'frame':
              return _.insertAndExecuteCell('cs', 'getFrameSummary ' + flowPrelude$42.stringify($a.attr('data-key')));
            case 'model':
              return _.insertAndExecuteCell('cs', 'getModel ' + flowPrelude$42.stringify($a.attr('data-key')));
            default:
            // do nothing
          }
        });
        container(vis.element);
        _autoHighlight = true;
        if (vis.subscribe) {
          vis.subscribe('markselect', function (_arg) {
            var currentCriterion = void 0;
            var selectedIndex = void 0;
            var frame = _arg.frame;
            var indices = _arg.indices;
            var subframe = window.plot.createFrame(frame.label, frame.vectors, indices);
            _.plot(renderTable.bind(_this, indices, subframe))(function (error, table) {
              if (!error) {
                return linkedFrame(table.element);
              }
            });

            // TODO HACK
            if (rocPanel) {
              if (indices.length === 1) {
                selectedIndex = lodash.head(indices);
                _autoHighlight = false;
                rocPanel.threshold(lodash.find(rocPanel.thresholds(), function (threshold) {
                  return threshold.index === selectedIndex;
                }));
                currentCriterion = rocPanel.criterion();

                // More than one criterion can point to the same threshold,
                // so ensure that we're preserving the existing criterion, if any.
                if (!currentCriterion || currentCriterion && currentCriterion.index !== selectedIndex) {
                  rocPanel.criterion(lodash.find(rocPanel.criteria(), function (criterion) {
                    return criterion.index === selectedIndex;
                  }));
                }
                _autoHighlight = true;
              } else {
                rocPanel.criterion(null);
                rocPanel.threshold(null);
              }
            }
          });
          vis.subscribe('markdeselect', function () {
            linkedFrame(null);

            // TODO HACK
            if (rocPanel) {
              rocPanel.criterion(null);
              return rocPanel.threshold(null);
            }
          });

          // TODO HACK
          if (rocPanel) {
            Flow.Dataflow.react(rocPanel.threshold, function (threshold) {
              if (threshold && _autoHighlight) {
                return vis.highlight([threshold.index]);
              }
            });
            return Flow.Dataflow.react(rocPanel.criterion, function (criterion) {
              if (criterion && _autoHighlight) {
                return vis.highlight([criterion.index]);
              }
            });
          }
        }
      });
      return _.plots.push({
        title: title,
        plot: container,
        frame: linkedFrame,
        controls: Flow.Dataflow.signal(rocPanel),
        isCollapsed: isCollapsed
      });
    }

    function plotKMeansScoringHistory(_, table) {
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('iteration', 'within_cluster_sum_of_squares'), g.strokeColor(g.value('#1f77b4'))), g.point(g.position('iteration', 'within_cluster_sum_of_squares'), g.strokeColor(g.value('#1f77b4'))), g.from(table));
      };
      var plotFunction = _.plot(gFunction);
      renderPlot$1(_, 'Scoring History', false, plotFunction);
    }

    function renderKMeansPlots(_) {
      var table = _.inspect('output - Scoring History', _.model);
      if (typeof table !== 'undefined') {
        plotKMeansScoringHistory(_, table);
      }
    }

    function generateOnePathPointGFunction(a, table) {
      var positionKeyA = a[0];
      var positionValueA = a[1];
      var strokeColorValueA = a[2];
      return function (g) {
        return g(g.path(g.position(positionKeyA, positionValueA), g.strokeColor(g.value(strokeColorValueA))), g.point(g.position(positionKeyA, positionValueA), g.strokeColor(g.value(strokeColorValueA))), g.from(table));
      };
    }

    function generateTwoPathPointGFunction(a, b, table) {
      var positionKeyA = a[0];
      var positionValueA = a[1];
      var strokeColorValueA = a[2];
      var positionKeyB = b[0];
      var positionValueB = b[1];
      var strokeColorValueB = b[2];
      return function (g) {
        return g(g.path(g.position(positionKeyA, positionValueA), g.strokeColor(g.value(strokeColorValueA))), g.path(g.position(positionKeyB, positionValueB), g.strokeColor(g.value(strokeColorValueB))), g.point(g.position(positionKeyA, positionValueA), g.strokeColor(g.value(strokeColorValueA))), g.point(g.position(positionKeyB, positionValueB), g.strokeColor(g.value(strokeColorValueB))), g.from(table));
      };
    }

    function plotGLMScoringHistory(_, table) {
      var lodash = window._;
      var plotTitle = 'Scoring History';
      var lambdaSearchParameter = lodash.find(_.model.parameters, function (parameter) {
        return parameter.name === 'lambda_search';
      });
      var plotFunction = void 0;
      if (lambdaSearchParameter != null ? lambdaSearchParameter.actual_value : void 0) {
        var gFunction = generateTwoPathPointGFunction(['lambda', 'explained_deviance_train', '#1f77b4'], ['lambda', 'explained_deviance_test', '#ff7f0e'], table);
        plotFunction = _.plot(gFunction);
      } else {
        var _gFunction = generateOnePathPointGFunction(['iteration', 'objective', '#1f77b4'], table);
        plotFunction = _.plot(_gFunction);
      }
      renderPlot$1(_, plotTitle, false, plotFunction);
    }

    function getThresholdsAndCriteria(_, table, tableName) {
      var criteria = void 0;
      var i = void 0;
      var idxVector = void 0;
      var metricVector = void 0;
      var thresholdVector = void 0;
      var thresholds = void 0;
      var criterionTable = _.inspect(tableName, _.model);
      if (criterionTable) {
        // Threshold dropdown items
        thresholdVector = table.schema.threshold;
        thresholds = function () {
          var _i = void 0;
          var _ref = void 0;
          var _results = [];
          for (i = _i = 0, _ref = thresholdVector.count(); _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
            _results.push({
              index: i,
              value: thresholdVector.at(i)
            });
          }
          return _results;
        }();

        // Threshold criterion dropdown item
        metricVector = criterionTable.schema.metric;
        idxVector = criterionTable.schema.idx;
        criteria = function () {
          var _i = void 0;
          var _ref = void 0;
          var _results = [];
          for (i = _i = 0, _ref = metricVector.count(); _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
            _results.push({
              index: idxVector.at(i),
              value: metricVector.valueAt(i)
            });
          }
          return _results;
        }();
        return {
          thresholds: thresholds,
          criteria: criteria
        };
      }
      return void 0;
    }

    function getAucAsLabel(_, model, tableName) {
      var metrics = _.inspect(tableName, model);
      if (metrics) {
        return ' , AUC = ' + metrics.schema.AUC.at(0);
      }
      return '';
    }

    function plotGLMThresholdsTrainingMetrics(_, table) {
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      var thresholdFunction = getThresholdsAndCriteria(_, table, 'output - training_metrics - Maximum Metrics');
      var plotTitle = 'ROC Curve - Training Metrics' + getAucAsLabel(_, _.model, 'output - training_metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdFunction);
    }

    function plotGLMThresholdsMetrics(_, table) {
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      var thresholdFunction = getThresholdsAndCriteria(_, table, 'output - validation_metrics - Maximum Metrics');
      var plotTitle = 'ROC Curve - Validation Metrics' + getAucAsLabel(_, _.model, 'output - validation_metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdFunction);
    }

    function plotGLMCrossValidationMetrics(_, table) {
      var plotTitle = 'ROC Curve - Cross Validation Metrics\' + ' + getAucAsLabel(_, _.model, 'output - cross_validation_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      var thresholdFunction = getThresholdsAndCriteria(_, table, 'output - cross_validation_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdFunction);
    }

    function plotGLMStandardizedCoefficientMagnitudes(_, table) {
      var plotTitle = 'Standardized Coefficient Magnitudes';
      var gFunction = function gFunction(g) {
        return g(g.rect(g.position('coefficients', 'names'), g.fillColor('sign')), g.from(table), g.limit(25));
      };
      var plotFunction = _.plot(gFunction);
      renderPlot$1(_, plotTitle, false, plotFunction);
    }

    function renderGLMPlots(_) {
      var table = void 0;
      table = _.inspect('output - Scoring History', _.model);
      if (typeof table !== 'undefined') {
        plotGLMScoringHistory(_, table);
      }
      table = _.inspect('output - training_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotGLMThresholdsTrainingMetrics(_, table);
      }
      table = _.inspect('output - validation_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotGLMThresholdsMetrics(_, table);
      }
      table = _.inspect('output - cross_validation_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotGLMCrossValidationMetrics(_, table);
      }
      table = _.inspect('output - Standardized Coefficient Magnitudes', _.model);
      if (typeof table !== 'undefined') {
        plotGLMStandardizedCoefficientMagnitudes(_, table);
      }
    }

    function plotDeepNetScoringHistory(_, table) {
      //
      // if we have both training and validation logloss
      //
      if (table.schema.validation_logloss && table.schema.training_logloss) {
        var gFunction = generateTwoPathPointGFunction(['epochs', 'training_logloss', '#1f77b4'], ['epochs', 'validation_logloss', '#ff7f0e'], table);
        var plotFunction = _.plot(gFunction);
        renderPlot$1(_, 'Scoring History - logloss', false, plotFunction);
        //
        // if we have only training logloss
        //
      } else if (table.schema.training_logloss) {
        var _gFunction = generateOnePathPointGFunction(['epochs', 'training_logloss', '#1f77b4'], table);
        var _plotFunction = _.plot(_gFunction);
        renderPlot$1(_, 'Scoring History - logloss', false, _plotFunction);
      }
      if (table.schema.training_deviance) {
        //
        // if we have training deviance and validation deviance
        //
        if (table.schema.validation_deviance) {
          var _gFunction2 = generateTwoPathPointGFunction(['epochs', 'training_deviance', '#1f77b4'], ['epochs', 'validation_deviance', '#ff7f0e'], table);
          var _plotFunction2 = _.plot(_gFunction2);
          renderPlot$1(_, 'Scoring History - Deviance', false, _plotFunction2);
          //
          // if we have only training deviance
          //
        } else {
          var _gFunction3 = generateOnePathPointGFunction(['epochs', 'training_deviance', '#1f77b4'], table);
          var _plotFunction3 = _.plot(_gFunction3);
          renderPlot$1(_, 'Scoring History - Deviance', false, _plotFunction3);
        }
      } else if (table.schema.training_mse) {
        //
        // if we have training mse and validation mse
        //
        if (table.schema.validation_mse) {
          var _gFunction4 = generateTwoPathPointGFunction(['epochs', 'training_mse', '#1f77b4'], ['epochs', 'validation_mse', '#ff7f0e'], table);
          var _plotFunction4 = _.plot(_gFunction4);
          renderPlot$1(_, 'Scoring History - MSE', false, _plotFunction4);
          //
          // if we have only training mse
          //
        } else {
          var _gFunction5 = generateOnePathPointGFunction(['epochs', 'training_mse', '#1f77b4'], table);
          var _plotFunction5 = _.plot(_gFunction5);
          renderPlot$1(_, 'Scoring History - MSE', false, _plotFunction5);
        }
      }
    }

    function plotDeepNetThresholdsTrainingMetrics(_, table) {
      var plotTitle = 'ROC Curve - Training Metrics' + getAucAsLabel(_, _.model, 'output - training_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      // TODO fix this hack
      // Mega-hack alert
      // the last arg thresholdsAndCriteria only applies to
      // ROC charts for binomial models.
      var thresholdFunction = getThresholdsAndCriteria(_, table, 'output - training_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdFunction);
    }

    function plotDeepNetThresholdsValidationMetrics(_, table) {
      var plotTitle = '\'ROC Curve - Validation Metrics\' + ' + getAucAsLabel(_, _.model, 'output - validation_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      // TODO fix this hack
      // Mega-hack alert
      // Last arg thresholdsAndCriteria only applies to
      // ROC charts for binomial models.
      var thresholdFunction = getThresholdsAndCriteria(_, table, 'output - validation_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdFunction);
    }

    function plotDeepNetThresholdsCrossValidationMetrics(_, table) {
      var plotTitle = '\'ROC Curve - Cross Validation Metrics\' + ' + getAucAsLabel(_, _.model, 'output - cross_validation_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      // TODO fix this hack
      // Mega-hack alert
      // Last arg thresholdsAndCriteria only applies to
      // ROC charts for binomial models
      var thresholdFunction = getThresholdsAndCriteria(_, table, 'output - cross_validation_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdFunction);
    }

    function plotDeepNetVariableImportances(_, table) {
      var plotTitle = 'Variable Importances';
      var gFunction = function gFunction(g) {
        return g(g.rect(g.position('scaled_importance', 'variable')), g.from(table), g.limit(25));
      };
      var plotFunction = _.plot(gFunction);
      renderPlot$1(_, plotTitle, false, plotFunction);
    }

    function renderDeepNetPlots(_) {
      var table = void 0;
      table = _.inspect('output - Scoring History', _.model);
      if (typeof table !== 'undefined') {
        plotDeepNetScoringHistory(_, table);
      }
      table = _.inspect('output - training_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotDeepNetThresholdsTrainingMetrics(_, table);
      }
      table = _.inspect('output - validation_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotDeepNetThresholdsValidationMetrics(_, table);
      }
      table = _.inspect('output - cross_validation_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotDeepNetThresholdsCrossValidationMetrics(_, table);
      }
      table = _.inspect('output - Variable Importances', _.model);
      if (typeof table !== 'undefined') {
        plotDeepNetVariableImportances(_, table);
      }
    }

    function plotTreeAlgoScoringHistory(_, table) {
      if (table.schema.validation_logloss && table.schema.training_logloss) {
        var plotTitle = 'Scoring History - logloss';
        var gFunction = generateTwoPathPointGFunction(['number_of_trees', 'training_logloss', '#1f77b4'], ['number_of_trees', 'validation_logloss', '#ff7f0e'], table);
        var plotFunction = _.plot(gFunction);
        renderPlot$1(_, plotTitle, false, plotFunction);
      } else if (table.schema.training_logloss) {
        var _plotTitle = 'Scoring History - logloss';
        var _gFunction = generateOnePathPointGFunction(['number_of_trees', 'training_logloss', '#1f77b4'], table);
        var _plotFunction = _.plot(_gFunction);
        renderPlot$1(_, _plotTitle, false, _plotFunction);
      }
      if (table.schema.training_deviance) {
        if (table.schema.validation_deviance) {
          var _plotTitle2 = 'Scoring History - Deviance';
          var _gFunction2 = generateTwoPathPointGFunction(['number_of_trees', 'training_logloss', '#1f77b4'], ['number_of_trees', 'validation_logloss', '#ff7f0e'], table);
          var _plotFunction2 = _.plot(_gFunction2);
          renderPlot$1(_, _plotTitle2, false, _plotFunction2);
        } else {
          var _plotTitle3 = 'Scoring History - Deviance';
          var _gFunction3 = generateOnePathPointGFunction(['number_of_trees', 'training_deviance', '#1f77b4'], table);
          var _plotFunction3 = _.plot(_gFunction3);
          renderPlot$1(_, _plotTitle3, false, _plotFunction3);
        }
      }
    }

    function plotTreeAlgoThresholdsTrainingMetrics(_, table) {
      var plotTitle = 'ROC Curve - Training Metrics' + getAucAsLabel(_, _.model, 'output - training_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      // TODO fix this hack
      // Mega-hack alert
      // Last arg thresholdsAndCriteria only applies to
      // ROC charts for binomial models
      var thresholdsFunction = getThresholdsAndCriteria(_, table, 'output - training_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdsFunction);
    }

    function plotTreeAlgoThresholdsValidationMetrics(_, table) {
      var plotTitle = 'ROC Curve - Validation Metrics' + getAucAsLabel(_, _.model, 'output - validation_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      // TODO fix this hack
      // Mega-hack alert
      // Last arg thresholdsAndCriteria only applies to
      // ROC charts for binomial models
      var thresholdsFunction = getThresholdsAndCriteria(_, table, 'output - validation_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdsFunction);
    }

    function plotTreeAlgoThresholdsCrossValidationMetrics(_, table) {
      var plotTitle = 'ROC Curve - Cross Validation Metrics' + getAucAsLabel(_, _.model, 'output - cross_validation_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      // TODO fix this hack
      // Mega-hack alert
      // Last arg thresholdsAndCriteria only applies to
      // ROC charts for binomial models
      var thresholdsFunction = getThresholdsAndCriteria(_, table, 'output - cross_validation_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdsFunction);
    }

    function plotTreeAlgoVariableImportances(_, table) {
      var plotTitle = 'Variable Importances';
      var gFunction = function gFunction(g) {
        return g(g.rect(g.position('scaled_importance', 'variable')), g.from(table), g.limit(25));
      };
      var plotFunction = _.plot(gFunction);
      renderPlot$1(_, plotTitle, false, plotFunction);
    }

    function renderTreeAlgoPlots(_) {
      var table = void 0;
      table = _.inspect('output - Scoring History', _.model);
      if (typeof table !== 'undefined') {
        plotTreeAlgoScoringHistory(_, table);
      }
      table = _.inspect('output - training_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotTreeAlgoThresholdsTrainingMetrics(_, table);
      }
      table = _.inspect('output - validation_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotTreeAlgoThresholdsValidationMetrics(_, table);
      }
      table = _.inspect('output - cross_validation_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotTreeAlgoThresholdsCrossValidationMetrics(_, table);
      }
      table = _.inspect('output - Variable Importances', _.model);
      if (typeof table !== 'undefined') {
        plotTreeAlgoVariableImportances(_, table);
      }
    }

    function plotStackedEnsembleThresholdsTrainingMetrics(_, table) {
      var plotTitle = 'ROC Curve - Training Metrics' + getAucAsLabel(_, _.model, 'output - training_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      // TODO fix this hack
      // Mega-hack alert
      // Last arg thresholdsAndCriteria only applies to
      // ROC charts for binomial models
      var thresholdsFunction = getThresholdsAndCriteria(_, table, 'output - training_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdsFunction);
    }

    function plotStackedEnsemblesThresholdsValidationMetrics(_, table) {
      var plotTitle = '\'ROC Curve - Validation Metrics' + getAucAsLabel(_, _.model, 'output - validation_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      // TODO fix this hack
      // Mega-hack alert
      // Last arg thresholdsAndCriteria only applies to
      // ROC charts for binomial models
      var thresholdsFunction = getThresholdsAndCriteria(_, table, 'output - validation_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdsFunction);
    }

    function plotStackedEnsembleThresholdsCrossValidationMetrics(_, table) {
      var plotTitle = 'ROC Curve - Cross Validation Metrics' + getAucAsLabel(_, _.model, 'output - cross_validation_metrics');
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1));
      };
      var plotFunction = _.plot(gFunction);
      // TODO fix this hack
      // Mega-hack alert
      // Last arg thresholdsAndCriteria only applies to
      // ROC charts for binomial models
      var thresholdsFunction = getThresholdsAndCriteria(_, table, 'output - cross_validation_metrics - Maximum Metrics');
      renderPlot$1(_, plotTitle, false, plotFunction, thresholdsFunction);
    }

    function plotStackedEnsembleVariableImportances(_, table) {
      var plotTitle = 'Variable Importances';
      var gFunction = function gFunction(g) {
        return g(g.rect(g.position('scaled_importance', 'variable')), g.from(table), g.limit(25));
      };
      var plotFunction = _.plot(gFunction);
      renderPlot$1(_, plotTitle, false, plotFunction);
    }

    function renderStackedEnsemblePlots(_) {
      var table = void 0;
      table = _.inspect('output - training_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotStackedEnsembleThresholdsTrainingMetrics(_, table);
      }
      table = _.inspect('output - validation_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotStackedEnsemblesThresholdsValidationMetrics(_, table);
      }
      table = _.inspect('output - cross_validation_metrics - Metrics for Thresholds', _.model);
      if (typeof table !== 'undefined') {
        plotStackedEnsembleThresholdsCrossValidationMetrics(_, table);
      }
      table = _.inspect('output - Variable Importances', _.model);
      if (typeof table !== 'undefined') {
        plotStackedEnsembleVariableImportances(_, table);
      }
    }

    function plotGainsLiftTrainingMetrics(_, table) {
      var plotTitle = 'Training Metrics - Gains/Lift Table';
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('cumulative_data_fraction', 'cumulative_capture_rate'), g.strokeColor(g.value('black'))), g.path(g.position('cumulative_data_fraction', 'cumulative_lift'), g.strokeColor(g.value('green'))), g.from(table));
      };
      var plotFunction = _.plot(gFunction);
      renderPlot$1(_, plotTitle, false, plotFunction);
    }

    function plotGainsLiftValidationMetrics(_, table) {
      var plotTitle = 'Validation Metrics - Gains/Lift Table';
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('cumulative_data_fraction', 'cumulative_capture_rate'), g.strokeColor(g.value('black'))), g.path(g.position('cumulative_data_fraction', 'cumulative_lift'), g.strokeColor(g.value('green'))), g.from(table));
      };
      var plotFunction = _.plot(gFunction);
      renderPlot$1(_, plotTitle, false, plotFunction);
    }

    function plotGainsLiftCrossValidationMetrics(_, table) {
      var plotTitle = 'Cross Validation Metrics - Gains/Lift Table';
      var gFunction = function gFunction(g) {
        return g(g.path(g.position('cumulative_data_fraction', 'cumulative_capture_rate'), g.strokeColor(g.value('black'))), g.path(g.position('cumulative_data_fraction', 'cumulative_lift'), g.strokeColor(g.value('green'))), g.from(table));
      };
      var plotFunction = _.plot(gFunction);
      renderPlot$1(_, plotTitle, false, plotFunction);
    }

    function renderGainsLiftPlots(_) {
      var table = void 0;
      table = _.inspect('output - training_metrics - Gains/Lift Table', _.model);
      if (typeof table !== 'undefined') {
        plotGainsLiftTrainingMetrics(_, table);
      }
      table = _.inspect('output - validation_metrics - Gains/Lift Table', _.model);
      if (typeof table !== 'undefined') {
        plotGainsLiftValidationMetrics(_, table);
      }
      table = _.inspect('output - cross_validation_metrics - Gains/Lift Table', _.model);
      if (typeof table !== 'undefined') {
        plotGainsLiftCrossValidationMetrics(_, table);
      }
    }

    function renderTables(_, _model) {
      var tableName = void 0;
      var output = void 0;
      var table = void 0;
      var tableNames = _.ls(_model);
      for (var i = 0; i < tableNames.length; i++) {
        tableName = tableNames[i];
        if (!(tableName !== 'parameters')) {
          continue;
        }
        // Skip confusion matrix tables for multinomial models
        var _output = void 0;
        if (_model !== 'undefined') {
          if (_model.output !== 'undefined') {
            if (_model.output.model_category === 'Multinomial') {
              _output = true;
            }
          }
        }
        if (_output) {
          if (tableName.indexOf('output - training_metrics - cm') === 0) {
            continue;
          } else if (tableName.indexOf('output - validation_metrics - cm') === 0) {
            continue;
          } else if (tableName.indexOf('output - cross_validation_metrics - cm') === 0) {
            continue;
          }
        }
        table = _.inspect(tableName, _model);
        if (typeof table !== 'undefined') {
          var plotTitle = tableName;
          // if there is a table description, use it in the plot title
          if (typeof table.metadata !== 'undefined') {
            if (typeof table.metadata.description !== 'undefined' && table.metadata.description.length > 0) {
              plotTitle = tableName + ' (' + table.metadata.description + ')';
            }
          }

          // set the gFunction
          var gFunction = void 0;
          if (table.indices.length > 1) {
            // lightning.js domain specific language
            gFunction = function gFunction(g) {
              return g(g.select(), g.from(table));
            };
          } else {
            // lightning.js domain specific language
            gFunction = function gFunction(g) {
              return g(g.select(0), g.from(table));
            };
          }

          var plotFunction = _.plot(gFunction);
          renderPlot$1(_, plotTitle, true, plotFunction);
        }
      }
    }

    function createOutput(_, _model) {
      var lodash = window._;
      var Flow = window.Flow;
      _.modelOutputIsExpanded = Flow.Dataflow.signal(false);
      _.plots = Flow.Dataflow.signals([]);
      _.pojoPreview = Flow.Dataflow.signal(null);
      var _isPojoLoaded = Flow.Dataflow.lift(_.pojoPreview, function (preview) {
        if (preview) {
          return true;
        }
        return false;
      });

      // TODO use _.enumerate()
      var _inputParameters = lodash.map(_model.parameters, function (parameter) {
        var type = parameter.type;
        var defaultValue = parameter.default_value;
        var actualValue = parameter.actual_value;
        var label = parameter.label;
        var help = parameter.help;
        var value = function () {
          switch (type) {
            case 'Key<Frame>':
            case 'Key<Model>':
              if (actualValue) {
                return actualValue.name;
              }
              return null;
            // break; // no-unreachable
            case 'VecSpecifier':
              if (actualValue) {
                return actualValue.column_name;
              }
              return null;
            // break; // no-unreachable
            case 'string[]':
            case 'byte[]':
            case 'short[]':
            case 'int[]':
            case 'long[]':
            case 'float[]':
            case 'double[]':
              if (actualValue) {
                return actualValue.join(', ');
              }
              return null;
            // break; // no-unreachable
            default:
              return actualValue;
          }
        }();
        return {
          label: label,
          value: value,
          help: help,
          isModified: defaultValue === actualValue
        };
      });

      // look at the algo of the current model
      // and render the relevant plots and tables
      switch (_model.algo) {
        case 'kmeans':
          renderKMeansPlots(_);
          break;
        case 'glm':
          renderGLMPlots(_);
          renderConfusionMatrices(_);
          break;
        case 'deeplearning':
        case 'deepwater':
          renderDeepNetPlots(_);
          renderConfusionMatrices(_);
          break;
        case 'gbm':
        case 'drf':
        case 'svm':
        case 'xgboost':
          renderTreeAlgoPlots(_);
          renderConfusionMatrices(_);
          break;
        case 'stackedensemble':
          renderStackedEnsemblePlots(_);
          renderConfusionMatrices(_);
          break;
        default:
        // do nothing
      }

      renderGainsLiftPlots(_);
      renderTables(_, _model);

      return {
        key: _model.model_id,
        algo: _model.algo_full_name,
        plots: _.plots,
        inputParameters: _inputParameters,
        isExpanded: _.modelOutputIsExpanded,
        toggle: toggle.bind(this, _),
        cloneModel: cloneModel,
        predict: predict$1.bind(this, _),
        inspect: inspect$1.bind(this, _),
        previewPojo: previewPojo.bind(this, _),
        downloadPojo: downloadPojo.bind(this, _),
        downloadMojo: downloadMojo.bind(this, _),
        pojoPreview: _.pojoPreview,
        isPojoLoaded: _isPojoLoaded,
        exportModel: exportModel.bind(this, _),
        deleteModel: deleteModel.bind(this, _)
      };
    }

    function _refresh(_, refresh) {
      var _this = this;
      var lodash = window._;
      refresh(function (error, model) {
        if (!error) {
          _.output(createOutput(_));
          if (_.isLive()) {
            return lodash.delay(_refresh.bind(_this, _, refresh), 2000);
          }
        }
      });
    }

    function _toggleRefresh(_) {
      return _.isLive(!_.isLive());
    }

    function h2oModelOutput(_, _go, _model, refresh) {
      var lodash = window._;
      var Flow = window.Flow;
      var $ = window.jQuery;
      _.output = Flow.Dataflow.signal(null);
      _.isLive = Flow.Dataflow.signal(false);
      Flow.Dataflow.act(_.isLive, function (isLive) {
        if (isLive) {
          return _refresh(_, refresh);
        }
      });
      _.output(createOutput(_, _model));
      lodash.defer(_go);
      return {
        output: _.output,
        toggleRefresh: _toggleRefresh.bind(this, _),
        isLive: _.isLive,
        template: 'flow-model-output'
      };
    }

    var flowPrelude$36 = flowPreludeFunction();

    function extendModel(_, model) {
      var lodash = window._;
      lodash.extend = function (model) {
        var table = void 0;
        var tableName = void 0;
        var _i = void 0;
        var _len = void 0;
        var _ref1 = void 0;
        var inspections = {};
        inspections.parameters = inspectModelParameters(model);
        var origin = 'getModel ' + flowPrelude$36.stringify(model.model_id.name);
        inspectObject(inspections, 'output', origin, model.output);

        // Obviously, an array of 2d tables calls for a megahack.
        if (model.__meta.schema_type === 'NaiveBayesModel') {
          if (lodash.isArray(model.output.pcond)) {
            _ref1 = model.output.pcond;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              table = _ref1[_i];
              tableName = 'output - pcond - ' + table.name;
              inspections[tableName] = inspectTwoDimTable_(origin, tableName, table);
            }
          }
        }
        inspect_(model, inspections);
        return model;
      };
      var refresh = function refresh(go) {
        return getModelRequest(_, model.model_id.name, function (error, model) {
          if (error) {
            return go(error);
          }
          return go(null, lodash.extend(model));
        });
      };
      lodash.extend(model);
      _.model = model;
      return render_(_, model, h2oModelOutput, model, refresh);
    }

    function requestModel(_, modelKey, go) {
      return getModelRequest(_, modelKey, function (error, model) {
        if (error) {
          return go(error);
        }
        return go(null, extendModel(_, model));
      });
    }

    function getPredictionRequest(_, modelKey, frameKey, go) {
      return doGet(_, '/3/ModelMetrics/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, result);
      });
    }

    function requestPrediction(_, modelKey, frameKey, go) {
      return getPredictionRequest(_, modelKey, frameKey, unwrapPrediction(_, go));
    }

    function getFrameSummarySliceRequest(_, key, searchTerm, offset, count, go) {
      var lodash = window._;
      var urlString = '/3/Frames/' + encodeURIComponent(key) + '/summary?column_offset=' + offset + '&column_count=' + count + '&_exclude_fields=frames/columns/data,frames/columns/domain,frames/columns/histogram_bins,frames/columns/percentiles';
      return doGet(_, urlString, unwrap(go, function (result) {
        return lodash.head(result.frames);
      }));
    }

    var flowPrelude$43 = flowPreludeFunction();

    function extendFrameSummary(_, frameKey, frame) {
      var column = void 0;
      // let enumColumns;
      var inspections = { columns: inspectFrameColumns('columns', frameKey, frame, frame.columns) };
      var enumColumns = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref1 = frame.columns;
        var _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          column = _ref1[_i];
          if (column.type === 'enum') {
            _results.push(column);
          }
        }
        return _results;
      }();
      if (enumColumns.length > 0) {
        inspections.factors = inspectFrameColumns('factors', frameKey, frame, enumColumns);
      }
      var origin = 'getFrameSummary ' + flowPrelude$43.stringify(frameKey);
      inspections[frame.chunk_summary.name] = inspectTwoDimTable_(origin, frame.chunk_summary.name, frame.chunk_summary);
      inspections[frame.distribution_summary.name] = inspectTwoDimTable_(origin, frame.distribution_summary.name, frame.distribution_summary);
      inspect_(frame, inspections);
      return render_(_, frame, h2oFrameOutput, frame);
    }

    function requestFrameSummarySlice(_, frameKey, searchTerm, offset, length, go) {
      return getFrameSummarySliceRequest(_, frameKey, searchTerm, offset, length, function (error, frame) {
        if (error) {
          return go(error);
        }
        return go(null, extendFrameSummary(_, frameKey, frame));
      });
    }

    function requestFrameSummary(_, frameKey, go) {
      return getFrameSummarySliceRequest(_, frameKey, void 0, 0, 20, function (error, frame) {
        if (error) {
          return go(error);
        }
        return go(null, extendFrameSummary(_, frameKey, frame));
      });
    }

    function getJobsRequest(_, go) {
      var Flow = window.Flow;
      return doGet(_, '/3/Jobs', function (error, result) {
        if (error) {
          return go(new Flow.Error('Error fetching jobs', error));
        }
        return go(null, result.jobs);
      });
    }

    var flowPrelude$44 = flowPreludeFunction();

    function h2oJobsOutput(_, _go, jobs) {
      var lodash = window._;
      var Flow = window.Flow;
      var _jobViews = Flow.Dataflow.signals([]);
      var _hasJobViews = Flow.Dataflow.lift(_jobViews, function (jobViews) {
        return jobViews.length > 0;
      });
      var _isLive = Flow.Dataflow.signal(false);
      var _isBusy = Flow.Dataflow.signal(false);
      var _exception = Flow.Dataflow.signal(null);
      var createJobView = function createJobView(job) {
        var view = function view() {
          return _.insertAndExecuteCell('cs', 'getJob ' + flowPrelude$44.stringify(job.key.name));
        };
        var type = function () {
          switch (job.dest.type) {
            case 'Key<Frame>':
              return 'Frame';
            case 'Key<Model>':
              return 'Model';
            case 'Key<Grid>':
              return 'Grid';
            case 'Key<PartialDependence>':
              return 'PartialDependence';
            default:
              return 'Unknown';
          }
        }();
        return {
          destination: job.dest.name,
          type: type,
          description: job.description,
          startTime: Flow.Format.time(new Date(job.start_time)),
          endTime: Flow.Format.time(new Date(job.start_time + job.msec)),
          elapsedTime: formatMilliseconds(job.msec),
          status: job.status,
          view: view
        };
      };
      var toggleRefresh = function toggleRefresh() {
        return _isLive(!_isLive());
      };
      var refresh = function refresh() {
        _isBusy(true);
        return getJobsRequest(_, function (error, jobs) {
          _isBusy(false);
          if (error) {
            _exception(Flow.failure(_, new Flow.Error('Error fetching jobs', error)));
            return _isLive(false);
          }
          _jobViews(lodash.map(jobs, createJobView));
          if (_isLive()) {
            return lodash.delay(refresh, 2000);
          }
        });
      };
      Flow.Dataflow.act(_isLive, function (isLive) {
        if (isLive) {
          return refresh();
        }
      });
      var initialize = function initialize() {
        _jobViews(lodash.map(jobs, createJobView));
        return lodash.defer(_go);
      };
      initialize();
      return {
        jobViews: _jobViews,
        hasJobViews: _hasJobViews,
        isLive: _isLive,
        isBusy: _isBusy,
        toggleRefresh: toggleRefresh,
        refresh: refresh,
        exception: _exception,
        template: 'flow-jobs-output'
      };
    }

    function extendJobs(_, jobs) {
      var job = void 0;
      var _i = void 0;
      var _len = void 0;
      for (_i = 0, _len = jobs.length; _i < _len; _i++) {
        job = jobs[_i];
        extendJob(_, job);
      }
      return render_(_, jobs, h2oJobsOutput, jobs);
    }

    function requestJobs(_, go) {
      return getJobsRequest(_, function (error, jobs) {
        if (error) {
          return go(error);
        }
        return go(null, extendJobs(_, jobs));
      });
    }

    function getJobs(_) {
      return _fork(requestJobs, _);
    }

    function goToUrl(url) {
      return function () {
        return window.open(url, '_blank');
      };
    }

    function showRoomscaleScatterplot(options) {
      var selectedFrame = options.frameID;

      // hard code values for `small-synth-data` for now
      // add proper form input soon
      var xVariable = options.xVariable;
      var yVariable = options.yVariable;
      var zVariable = options.zVariable;
      var colorVariable = options.colorVariable;
      var plotUrl = '/roomscale-scatterplot.html?frame_id=' + selectedFrame + '&x_variable=' + xVariable + '&y_variable=' + yVariable + '&z_variable=' + zVariable + '&color_variable=' + colorVariable;
      goToUrl(plotUrl)();
      return {
        plotUrl: plotUrl,
        template: 'flow-roomscale-scatterplot-output'
      };
      return {}; // eslint-disable-line
    }

    function requestFrameSummaryWithoutData(_, key, go) {
      return doGet(_, '/3/Frames/' + encodeURIComponent(key) + '/summary?_exclude_fields=frames/chunk_summary,frames/distribution_summary,frames/columns/data,frames/columns/domain,frames/columns/histogram_bins,frames/columns/percentiles', function (error, result) {
        var lodash = window._;
        if (error) {
          return go(error);
        }
        return go(null, lodash.head(result.frames));
      });
    }

    var flowPrelude$45 = flowPreludeFunction();

    function roomscaleScatterplotInput(_, _go) {
      var lodash = window._;
      var Flow = window.Flow;

      var _exception = Flow.Dataflow.signal(null);
      var _destinationKey = Flow.Dataflow.signal('ppd-' + uuid());
      var _frames = Flow.Dataflow.signals([]);
      var _models = Flow.Dataflow.signals([]);
      var _selectedModel = Flow.Dataflow.signals(null);
      _.selectedFrame = Flow.Dataflow.signal(null);
      _.selectedXVariable = Flow.Dataflow.signal(null);
      _.selectedYVariable = Flow.Dataflow.signal(null);
      _.selectedZVariable = Flow.Dataflow.signal(null);
      _.selectedColorVariable = Flow.Dataflow.signal(null);
      var _useCustomColumns = Flow.Dataflow.signal(false);
      var _columns = Flow.Dataflow.signal([]);
      var _nbins = Flow.Dataflow.signal(20);

      //  a conditional check that makes sure that
      //  all fields in the form are filled in
      //  before the button is shown as active
      var _canCompute = Flow.Dataflow.lift(_.selectedFrame, function (sf) {
        return sf;
      });
      var _compute = function _compute() {
        if (!_canCompute()) {
          return;
        }

        // parameters are selections from Flow UI
        // form dropdown menus, text boxes, etc
        var col = void 0;
        var cols = void 0;
        var i = void 0;
        var len = void 0;

        cols = '';

        var ref = _columns();
        for (i = 0, len = ref.length; i < len; i++) {
          col = ref[i];
          // if (col.isSelected()) {
          //   cols = `${cols}"${col.value}",`;
          // }
        }

        if (cols !== '') {
          cols = '[' + cols + ']';
        }

        var opts = {
          // destination_key: _destinationKey(),
          frameID: _.selectedFrame(),
          xVariable: _.selectedXVariable(),
          yVariable: _.selectedYVariable(),
          zVariable: _.selectedZVariable(),
          colorVariable: _.selectedColorVariable()
        };

        // assemble a string
        // this contains the function to call
        // along with the options to pass in
        var cs = 'showRoomscaleScatterplot ' + flowPrelude$45.stringify(opts);

        // insert a cell with the expression `cs`
        // into the current Flow notebook
        // and run the cell
        return _.insertAndExecuteCell('cs', cs);
      };

      _.requestFrames(_, function (error, frames) {
        var frame = void 0;
        if (error) {
          return _exception(new Flow.Error('Error fetching frame list.', error));
        }
        return _frames(function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = frames.length; _i < _len; _i++) {
            frame = frames[_i];
            if (!frame.is_text) {
              _results.push(frame.frame_id.name);
            }
          }
          return _results;
        }());
      });

      var _updateColumns = function _updateColumns() {
        var frameKey = _.selectedFrame();
        if (frameKey) {
          return requestFrameSummaryWithoutData(_, frameKey, function (error, frame) {
            var columnLabels = void 0;
            var columnValues = void 0;
            if (!error) {
              columnValues = frame.columns.map(function (column) {
                return column.label;
              });
              columnLabels = frame.columns.map(function (column) {
                var missingPercent = 100 * column.missing_count / frame.rows;
                return {
                  type: column.type === 'enum' ? 'enum(' + column.domain_cardinality + ')' : column.type,
                  value: column.label,
                  missingPercent: missingPercent,
                  missingLabel: missingPercent === 0 ? '' : Math.round(missingPercent) + '% NA'
                };
              });
              _columns(columnLabels.map(function (d) {
                return d.value;
              }));
            }
          });
        }
      };

      lodash.defer(_go);
      return {
        exception: _exception,
        destinationKey: _destinationKey,
        frames: _frames,
        columns: _columns,
        updateColumns: _updateColumns,
        selectedFrame: _.selectedFrame,
        selectedXVariable: _.selectedXVariable,
        selectedYVariable: _.selectedYVariable,
        selectedZVariable: _.selectedZVariable,
        selectedColorVariable: _.selectedColorVariable,
        nbins: _nbins,
        compute: _compute,
        canCompute: _canCompute,
        template: 'flow-roomscale-scatterplot-input'
      };
    }

    var flowPrelude$46 = flowPreludeFunction();

    function h2oInspectsOutput(_, _go, _tables) {
      var lodash = window._;
      var Flow = window.Flow;
      var createTableView = function createTableView(table) {
        var inspect = function inspect() {
          return _.insertAndExecuteCell('cs', 'inspect ' + flowPrelude$46.stringify(table.label) + ', ' + table.metadata.origin);
        };
        var grid = function grid() {
          return _.insertAndExecuteCell('cs', 'grid inspect ' + flowPrelude$46.stringify(table.label) + ', ' + table.metadata.origin);
        };
        var plot = function plot() {
          return _.insertAndExecuteCell('cs', table.metadata.plot);
        };
        return {
          label: table.label,
          description: table.metadata.description,
          // variables: table.variables #XXX unused?
          inspect: inspect,
          grid: grid,
          canPlot: table.metadata.plot,
          plot: plot
        };
      };
      lodash.defer(_go);
      return {
        hasTables: _tables.length > 0,
        tables: lodash.map(_tables, createTableView),
        template: 'flow-inspects-output'
      };
    }

    var flowPrelude$47 = flowPreludeFunction();

    function h2oInspectOutput(_, _go, _frame) {
      var lodash = window._;
      var Flow = window.Flow;
      var view = function view() {
        return _.insertAndExecuteCell('cs', 'grid inspect ' + flowPrelude$47.stringify(_frame.label) + ', ' + _frame.metadata.origin);
      };
      var plot = function plot() {
        return _.insertAndExecuteCell('cs', _frame.metadata.plot);
      };
      lodash.defer(_go);
      return {
        label: _frame.label,
        vectors: _frame.vectors,
        view: view,
        canPlot: _frame.metadata.plot,
        plot: plot,
        template: 'flow-inspect-output'
      };
    }

    function h2oPlotOutput(_, _go, _plot) {
      var lodash = window._;
      lodash.defer(_go);
      return {
        plot: _plot,
        template: 'flow-plot-output'
      };
    }

    var flowPrelude$48 = flowPreludeFunction();

    function h2oPlotInput(_, _go, _frame) {
      var Flow = window.Flow;
      var lodash = window._;
      var vector = void 0;
      var _types = ['point', 'path', 'rect'];
      var _vectors = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = _frame.vectors;
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          vector = _ref[_i];
          if (vector.type === 'String' || vector.type === 'Number') {
            _results.push(vector.label);
          }
        }
        return _results;
      }();
      var _type = Flow.Dataflow.signal(null);
      var _x = Flow.Dataflow.signal(null);
      var _y = Flow.Dataflow.signal(null);
      _.color = Flow.Dataflow.signal(null);
      var _canPlot = Flow.Dataflow.lift(_type, _x, _y, function (type, x, y) {
        return type && x && y;
      });
      var plot = function plot() {
        var color = _.color();
        // refactor this ternary statement
        // const command = color ? `plot (g) -> g(\n  g.${_type()}(\n    g.position ${flowPrelude.stringify(_x())}, ${flowPrelude.stringify(_y())}\n    g.color ${flowPrelude.stringify(color)}\n  )\n  g.from inspect ${flowPrelude.stringify(_frame.label)}, ${_frame.metadata.origin}\n)` : `plot (g) -> g(\n  g.${_type()}(\n    g.position ${flowPrelude.stringify(_x())}, ${flowPrelude.stringify(_y())}\n  )\n  g.from inspect ${flowPrelude.stringify(_frame.label)}, ${_frame.metadata.origin}\n)`;

        var command = void 0;
        if (color) {
          // CoffeeScript skinny arrow since this command will be passed into a
          // CoffeeScript code cell in Flow
          command = 'plot (g) -> g(\n  g.' + _type() + '(\n    g.position ' + flowPrelude$48.stringify(_x()) + ', ' + flowPrelude$48.stringify(_y()) + '\n    g.color ' + flowPrelude$48.stringify(color) + '\n  )\n  g.from inspect ' + flowPrelude$48.stringify(_frame.label) + ', ' + _frame.metadata.origin + '\n)';
        } else {
          // CoffeeScript skinny arrow since this command will be passed into a
          // CoffeeScript code cell in Flow
          command = 'plot (g) -> g(\n  g.' + _type() + '(\n    g.position ' + flowPrelude$48.stringify(_x()) + ', ' + flowPrelude$48.stringify(_y()) + '\n  )\n  g.from inspect ' + flowPrelude$48.stringify(_frame.label) + ', ' + _frame.metadata.origin + '\n)';
        }
        return _.insertAndExecuteCell('cs', command);
      };
      lodash.defer(_go);
      return {
        types: _types,
        type: _type,
        vectors: _vectors,
        x: _x,
        y: _y,
        color: _.color,
        plot: plot,
        canPlot: _canPlot,
        template: 'flow-plot-input'
      };
    }

    var flowPrelude$49 = flowPreludeFunction();

    function h2oGridOutput(_, _go, _grid) {
      var lodash = window._;
      var Flow = window.Flow;
      var _isCheckingAll = void 0;
      var _modelViews = Flow.Dataflow.signal([]);
      var _hasModels = _grid.model_ids.length > 0;
      var _errorViews = Flow.Dataflow.signal([]);
      var _hasErrors = _grid.failure_details.length > 0;
      var _checkAllModels = Flow.Dataflow.signal(false);
      var _checkedModelCount = Flow.Dataflow.signal(0);
      var _canCompareModels = Flow.Dataflow.lift(_checkedModelCount, function (count) {
        return count > 1;
      });
      var _hasSelectedModels = Flow.Dataflow.lift(_checkedModelCount, function (count) {
        return count > 0;
      });
      _isCheckingAll = false;
      Flow.Dataflow.react(_checkAllModels, function (checkAll) {
        var view = void 0;
        var _i = void 0;
        var _len = void 0;
        _isCheckingAll = true;
        var views = _modelViews();
        for (_i = 0, _len = views.length; _i < _len; _i++) {
          view = views[_i];
          view.isChecked(checkAll);
        }
        _checkedModelCount(checkAll ? views.length : 0);
        _isCheckingAll = false;
      });

      // allow a non-camelCase function parameter name for now
      // to avoid an error that breaks getModel
      var createModelView = function createModelView(model_id) {
        // eslint-disable-line
        var _isChecked = Flow.Dataflow.signal(false);
        Flow.Dataflow.react(_isChecked, function () {
          var view = void 0;
          if (_isCheckingAll) {
            return;
          }
          var checkedViews = function () {
            var _i = void 0;
            var _len = void 0;
            var _ref = _modelViews();
            var _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              view = _ref[_i];
              if (view.isChecked()) {
                _results.push(view);
              }
            }
            return _results;
          }();
          return _checkedModelCount(checkedViews.length);
        });
        var predict = function predict() {
          return _.insertAndExecuteCell('cs', 'predict model: ' + flowPrelude$49.stringify(model_id.name));
        };
        var cloneModel = function cloneModel() {
          return (// return _.insertAndExecuteCell('cs', `cloneModel ${flowPrelude.stringify(model_id.name)}`);
            alert('Not implemented')
          );
        };
        var view = function view() {
          return _.insertAndExecuteCell('cs', 'getModel ' + flowPrelude$49.stringify(model_id.name));
        };
        var inspect = function inspect() {
          return _.insertAndExecuteCell('cs', 'inspect getModel ' + flowPrelude$49.stringify(model_id.name));
        };
        return {
          key: model_id.name,
          isChecked: _isChecked,
          predict: predict,
          clone: cloneModel,
          inspect: inspect,
          view: view
        };
      };
      var buildModel = function buildModel() {
        return _.insertAndExecuteCell('cs', 'buildModel');
      };
      var collectSelectedKeys = function collectSelectedKeys() {
        var view = void 0;
        var _i = void 0;
        var _len = void 0;
        var _ref = _modelViews();
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (view.isChecked()) {
            _results.push(view.key);
          }
        }
        return _results;
      };
      var compareModels = function compareModels() {
        return _.insertAndExecuteCell('cs', '\'inspect getModels ' + flowPrelude$49.stringify(collectSelectedKeys()));
      };
      var predictUsingModels = function predictUsingModels() {
        return _.insertAndExecuteCell('cs', 'predict models: ' + flowPrelude$49.stringify(collectSelectedKeys()));
      };
      var deleteModels = function deleteModels() {
        return _.confirm('Are you sure you want to delete these models?', {
          acceptCaption: 'Delete Models',
          declineCaption: 'Cancel'
        }, function (accept) {
          if (accept) {
            return _.insertAndExecuteCell('cs', 'deleteModels ' + flowPrelude$49.stringify(collectSelectedKeys()));
          }
        });
      };
      var inspect = function inspect() {
        var summary = _.inspect('summary', _grid);
        return _.insertAndExecuteCell('cs', 'grid inspect \'summary\', ' + summary.metadata.origin);
      };
      var inspectHistory = function inspectHistory() {
        var history = _.inspect('scoring_history', _grid);
        return _.insertAndExecuteCell('cs', 'grid inspect \'scoring_history\', ' + history.metadata.origin);
      };
      var inspectAll = function inspectAll() {
        var view = void 0;
        var allKeys = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref = _modelViews();
          var _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            view = _ref[_i];
            _results.push(view.key);
          }
          return _results;
        }();
        // TODO use table origin
        return _.insertAndExecuteCell('cs', 'inspect getModels ' + flowPrelude$49.stringify(allKeys));
      };
      var initialize = function initialize(grid) {
        var i = void 0;
        _modelViews(lodash.map(grid.model_ids, createModelView));
        var errorViews = function () {
          var _i = void 0;
          var _ref = void 0;
          var _results = [];
          for (i = _i = 0, _ref = grid.failure_details.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
            _results.push({
              title: 'Error ' + (i + 1),
              detail: grid.failure_details[i],
              params: 'Parameters: [ ' + grid.failed_raw_params[i].join(', ') + ' ]',
              stacktrace: grid.failure_stack_traces[i]
            });
          }
          return _results;
        }();
        _errorViews(errorViews);
        return lodash.defer(_go);
      };
      initialize(_grid);
      return {
        modelViews: _modelViews,
        hasModels: _hasModels,
        errorViews: _errorViews,
        hasErrors: _hasErrors,
        buildModel: buildModel,
        compareModels: compareModels,
        predictUsingModels: predictUsingModels,
        deleteModels: deleteModels,
        checkedModelCount: _checkedModelCount,
        canCompareModels: _canCompareModels,
        hasSelectedModels: _hasSelectedModels,
        checkAllModels: _checkAllModels,
        inspect: inspect,
        inspectHistory: inspectHistory,
        inspectAll: inspectAll,
        template: 'flow-grid-output'
      };
    }

    var flowPrelude$50 = flowPreludeFunction();

    function h2oPredictsOutput(_, _go, opts, _predictions) {
      var lodash = window._;
      var Flow = window.Flow;
      var _isCheckingAll = void 0;
      var _predictionViews = Flow.Dataflow.signal([]);
      var _checkAllPredictions = Flow.Dataflow.signal(false);
      var _canComparePredictions = Flow.Dataflow.signal(false);
      var _rocCurve = Flow.Dataflow.signal(null);
      var arePredictionsComparable = function arePredictionsComparable(views) {
        if (views.length === 0) {
          return false;
        }
        return lodash.every(views, function (view) {
          return view.modelCategory === 'Binomial';
        });
      };
      _isCheckingAll = false;
      Flow.Dataflow.react(_checkAllPredictions, function (checkAll) {
        var view = void 0;
        var _i = void 0;
        var _len = void 0;
        _isCheckingAll = true;
        var _ref = _predictionViews();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.isChecked(checkAll);
        }
        _canComparePredictions(checkAll && arePredictionsComparable(_predictionViews()));
        _isCheckingAll = false;
      });
      var createPredictionView = function createPredictionView(prediction) {
        var _ref = prediction.frame;
        var _modelKey = prediction.model.name;
        var _frameKey = _ref != null ? _ref.name : void 0;
        var _hasFrame = _frameKey;
        var _isChecked = Flow.Dataflow.signal(false);
        Flow.Dataflow.react(_isChecked, function () {
          var view = void 0;
          if (_isCheckingAll) {
            return;
          }
          var checkedViews = function () {
            var _i = void 0;
            var _len = void 0;
            var _ref1 = _predictionViews();
            var _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              view = _ref1[_i];
              if (view.isChecked()) {
                _results.push(view);
              }
            }
            return _results;
          }();
          return _canComparePredictions(arePredictionsComparable(checkedViews));
        });
        var view = function view() {
          if (_hasFrame) {
            return _.insertAndExecuteCell('cs', 'getPrediction model: ' + flowPrelude$50.stringify(_modelKey) + ', frame: ' + flowPrelude$50.stringify(_frameKey));
          }
        };
        var inspect = function inspect() {
          if (_hasFrame) {
            return _.insertAndExecuteCell('cs', 'inspect getPrediction model: ' + flowPrelude$50.stringify(_modelKey) + ', frame: ' + flowPrelude$50.stringify(_frameKey));
          }
        };
        return {
          modelKey: _modelKey,
          frameKey: _frameKey,
          modelCategory: prediction.model_category,
          isChecked: _isChecked,
          hasFrame: _hasFrame,
          view: view,
          inspect: inspect
        };
      };
      var _predictionsTable = _.inspect('predictions', _predictions);
      var _metricsTable = _.inspect('metrics', _predictions);
      var _scoresTable = _.inspect('scores', _predictions);
      var comparePredictions = function comparePredictions() {
        var view = void 0;
        var selectedKeys = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref = _predictionViews();
          var _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            view = _ref[_i];
            if (view.isChecked()) {
              _results.push({
                model: view.modelKey,
                frame: view.frameKey
              });
            }
          }
          return _results;
        }();
        return _.insertAndExecuteCell('cs', 'getPredictions ' + flowPrelude$50.stringify(selectedKeys));
      };
      var plotPredictions = function plotPredictions() {
        return _.insertAndExecuteCell('cs', _predictionsTable.metadata.plot);
      };
      var plotScores = function plotScores() {
        return _.insertAndExecuteCell('cs', _scoresTable.metadata.plot);
      };
      var plotMetrics = function plotMetrics() {
        return _.insertAndExecuteCell('cs', _metricsTable.metadata.plot);
      };
      var inspectAll = function inspectAll() {
        return _.insertAndExecuteCell('cs', 'inspect ' + _predictionsTable.metadata.origin);
      };
      var predict = function predict() {
        return _.insertAndExecuteCell('cs', 'predict');
      };
      var initialize = function initialize(predictions) {
        _predictionViews(lodash.map(predictions, createPredictionView));

        // TODO handle non-binomial models
        // warning: sample code is CoffeeScript
        // rocCurveConfig =
        //   data: _.inspect 'scores', _predictions
        //   type: 'line'
        //   x: 'FPR'
        //   y: 'TPR'
        //   color: 'key'
        // _.plot rocCurveConfig, (error, el) ->
        //   unless error
        //     _rocCurve el

        return lodash.defer(_go);
      };
      initialize(_predictions);
      return {
        predictionViews: _predictionViews,
        hasPredictions: _predictions.length > 0,
        comparePredictions: comparePredictions,
        canComparePredictions: _canComparePredictions,
        checkAllPredictions: _checkAllPredictions,
        plotPredictions: plotPredictions,
        plotScores: plotScores,
        plotMetrics: plotMetrics,
        inspect: inspectAll,
        predict: predict,
        rocCurve: _rocCurve,
        template: 'flow-predicts-output'
      };
    }

    function h2oH2OFrameOutput(_, _go, _result) {
      var lodash = window._;
      var Flow = window.Flow;
      var _h2oframeView = Flow.Dataflow.signal(null);
      var createH2oFrameView = function createH2oFrameView(result) {
        return {
          h2oframe_id: result.h2oframe_id
        };
      };
      _h2oframeView(createH2oFrameView(_result));
      lodash.defer(_go);
      return {
        h2oframeView: _h2oframeView,
        template: 'flow-h2oframe-output'
      };
    }

    function h2oRDDsOutput(_, _go, _rDDs) {
      var lodash = window._;
      var Flow = window.Flow;
      var _rDDViews = Flow.Dataflow.signal([]);
      var createRDDView = function createRDDView(rDD) {
        return {
          id: rDD.rddId,
          name: rDD.name,
          partitions: rDD.partitions
        };
      };
      _rDDViews(lodash.map(_rDDs, createRDDView));
      lodash.defer(_go);
      return {
        rDDViews: _rDDViews,
        hasRDDs: _rDDs.length > 0,
        template: 'flow-rdds-output'
      };
    }

    function h2oDataFramesOutput(_, _go, _dataFrames) {
      var lodash = window._;
      var Flow = window.Flow;
      var _dataFramesViews = Flow.Dataflow.signal([]);
      var createDataFrameView = function createDataFrameView(dataFrame) {
        return {
          dataframe_id: dataFrame.dataframe_id,
          partitions: dataFrame.partitions
        };
      };
      _dataFramesViews(lodash.map(_dataFrames, createDataFrameView));
      lodash.defer(_go);
      return {
        dataFrameViews: _dataFramesViews,
        hasDataFrames: _dataFrames.length > 0,
        template: 'flow-dataframes-output'
      };
    }

    function h2oScalaCodeOutput(_, _go, _result) {
      var lodash = window._;
      var Flow = window.Flow;
      var _scalaCodeView = Flow.Dataflow.signal(null);
      var _scalaResponseVisible = Flow.Dataflow.signal(false);
      var _scalaLinkText = Flow.Dataflow.signal('Show Scala Response');
      var createScalaCodeView = function createScalaCodeView(result) {
        return {
          output: result.output,
          response: result.response,
          status: result.status,
          scalaResponseVisible: _scalaResponseVisible,
          scalaLinkText: _scalaLinkText,

          toggleVisibility: function toggleVisibility() {
            _scalaResponseVisible(!_scalaResponseVisible());
            if (_scalaResponseVisible()) {
              return _scalaLinkText('Hide Scala Response');
            }
            return _scalaLinkText('Show Scala Response');
          }
        };
      };
      _scalaCodeView(createScalaCodeView(_result));
      lodash.defer(_go);
      return {
        scalaCodeView: _scalaCodeView,
        template: 'flow-scala-code-output'
      };
    }

    function h2oScalaIntpOutput(_, _go, _result) {
      var lodash = window._;
      var Flow = window.Flow;
      var _scalaIntpView = Flow.Dataflow.signal(null);
      var createScalaIntpView = function createScalaIntpView(result) {
        return {
          session_id: result.session_id
        };
      };
      _scalaIntpView(createScalaIntpView(_result));
      lodash.defer(_go);
      return {
        scalaIntpView: _scalaIntpView,
        template: 'flow-scala-intp-output'
      };
    }

    function h2oAssist(_, _go, _items) {
      var lodash = window._;
      var item = void 0;
      var name = void 0;
      var createAssistItem = function createAssistItem(name, item) {
        return {
          name: name,
          description: item.description,
          icon: 'fa fa-' + item.icon + ' flow-icon',

          execute: function execute() {
            return _.insertAndExecuteCell('cs', name);
          }
        };
      };
      lodash.defer(_go);
      return {
        routines: function () {
          var _results = [];
          for (name in _items) {
            if ({}.hasOwnProperty.call(_items, name)) {
              item = _items[name];
              _results.push(createAssistItem(name, item));
            }
          }
          return _results;
        }(),
        template: 'flow-assist'
      };
    }

    function describeCount(count, singular, plural) {
      if (!plural) {
        plural = singular + "s";
      }
      switch (count) {
        case 0:
          return "No " + plural;
        case 1:
          return "1 " + singular;
        default:
          return count + " " + plural;
      }
    }

    var flowPrelude$51 = flowPreludeFunction();

    function h2oImportFilesInput(_, _go) {
      //
      // Search files/directories
      //
      var lodash = window._;
      var Flow = window.Flow;
      var _specifiedPath = Flow.Dataflow.signal('');
      var _exception = Flow.Dataflow.signal('');
      var _hasErrorMessage = Flow.Dataflow.lift(_exception, function (exception) {
        if (exception) {
          return true;
        }
        return false;
      });
      var tryImportFiles = function tryImportFiles() {
        var specifiedPath = _specifiedPath();
        return _.requestFileGlob(_, specifiedPath, -1, function (error, result) {
          if (error) {
            return _exception(error.stack);
          }
          _exception('');
          // _go 'confirm', result
          return processImportResult(result);
        });
      };

      //
      // File selection
      //
      var _importedFiles = Flow.Dataflow.signals([]);
      var _importedFileCount = Flow.Dataflow.lift(_importedFiles, function (files) {
        if (files.length) {
          return 'Found ' + describeCount(files.length, 'file') + ':';
        }
        return '';
      });
      var _hasImportedFiles = Flow.Dataflow.lift(_importedFiles, function (files) {
        return files.length > 0;
      });
      var _hasUnselectedFiles = Flow.Dataflow.lift(_importedFiles, function (files) {
        return lodash.some(files, function (file) {
          return !file.isSelected();
        });
      });
      var _selectedFiles = Flow.Dataflow.signals([]);
      var _selectedFilesDictionary = Flow.Dataflow.lift(_selectedFiles, function (files) {
        var file = void 0;
        var _i = void 0;
        var _len = void 0;
        var dictionary = {};
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          file = files[_i];
          dictionary[file.path] = true;
        }
        return dictionary;
      });
      var _selectedFileCount = Flow.Dataflow.lift(_selectedFiles, function (files) {
        if (files.length) {
          return describeCount(files.length, 'file') + ' selected:';
        }
        return '(No files selected)';
      });
      var _hasSelectedFiles = Flow.Dataflow.lift(_selectedFiles, function (files) {
        return files.length > 0;
      });
      var importFiles = function importFiles(files) {
        var paths = lodash.map(files, function (file) {
          return flowPrelude$51.stringify(file.path);
        });
        return _.insertAndExecuteCell('cs', 'importFiles [ ' + paths.join(',') + ' ]');
      };
      var importSelectedFiles = function importSelectedFiles() {
        return importFiles(_selectedFiles());
      };
      var createSelectedFileItem = function createSelectedFileItem(path) {
        var self = {
          path: path,
          deselect: function deselect() {
            var file = void 0;
            var _i = void 0;
            var _len = void 0;
            _selectedFiles.remove(self);
            var _ref = _importedFiles();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              file = _ref[_i];
              if (file.path === path) {
                file.isSelected(false);
              }
            }
          }
        };
        return self;
      };
      var createFileItem = function createFileItem(path, isSelected) {
        var self = {
          path: path,
          isSelected: Flow.Dataflow.signal(isSelected),
          select: function select() {
            _selectedFiles.push(createSelectedFileItem(self.path));
            return self.isSelected(true);
          }
        };
        Flow.Dataflow.act(self.isSelected, function (isSelected) {
          return _hasUnselectedFiles(lodash.some(_importedFiles(), function (file) {
            return !file.isSelected();
          }));
        });
        return self;
      };
      var createFileItems = function createFileItems(result) {
        return lodash.map(result.matches, function (path) {
          return createFileItem(path, _selectedFilesDictionary()[path]);
        });
      };
      var listPathHints = function listPathHints(query, process) {
        return _.requestFileGlob(_, query, 10, function (error, result) {
          if (!error) {
            return process(lodash.map(result.matches, function (value) {
              return {
                value: value
              };
            }));
          }
        });
      };
      var selectAllFiles = function selectAllFiles() {
        var file = void 0;
        var _i = void 0;
        var _j = void 0;
        var _len = void 0;
        var _len1 = void 0;
        var dict = {};
        var _ref = _selectedFiles();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          dict[file.path] = true;
        }
        var _ref1 = _importedFiles();
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          file = _ref1[_j];
          if (!dict[file.path]) {
            file.select();
          }
        }
      };
      var deselectAllFiles = function deselectAllFiles() {
        var file = void 0;
        var _i = void 0;
        var _len = void 0;
        _selectedFiles([]);
        var _ref = _importedFiles();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          file.isSelected(false);
        }
      };
      function processImportResult(result) {
        var files = createFileItems(result);
        return _importedFiles(files);
      }
      lodash.defer(_go);
      return {
        specifiedPath: _specifiedPath,
        hasErrorMessage: _hasErrorMessage, // XXX obsolete
        exception: _exception,
        tryImportFiles: tryImportFiles,
        listPathHints: lodash.throttle(listPathHints, 100),
        hasImportedFiles: _hasImportedFiles,
        importedFiles: _importedFiles,
        importedFileCount: _importedFileCount,
        selectedFiles: _selectedFiles,
        selectAllFiles: selectAllFiles,
        deselectAllFiles: deselectAllFiles,
        hasUnselectedFiles: _hasUnselectedFiles,
        hasSelectedFiles: _hasSelectedFiles,
        selectedFileCount: _selectedFileCount,
        importSelectedFiles: importSelectedFiles,
        template: 'flow-import-files'
      };
    }

    function h2oAutoModelInput(_, _go, opts) {
      var lodash = window._;
      var Flow = window.Flow;
      if (opts == null) {
        opts = {};
      }
      var _frames = Flow.Dataflow.signal([]);
      var _frame = Flow.Dataflow.signal(null);
      var _hasFrame = Flow.Dataflow.lift(_frame, function (frame) {
        if (frame) {
          return true;
        }
        return false;
      });
      var _columns = Flow.Dataflow.signal([]);
      var _column = Flow.Dataflow.signal(null);
      var _canBuildModel = Flow.Dataflow.lift(_frame, _column, function (frame, column) {
        return frame && column;
      });
      var defaultMaxRunTime = 3600;
      var _maxRunTime = Flow.Dataflow.signal(defaultMaxRunTime);
      var buildModel = function buildModel() {
        var maxRunTime = defaultMaxRunTime;
        var parsed = parseInt(_maxRunTime(), 10);
        if (!lodash.isNaN(parsed)) {
          maxRunTime = parsed;
        }
        var arg = {
          frame: _frame(),
          column: _column(),
          maxRunTime: maxRunTime
        };
        return _.insertAndExecuteCell('cs', 'buildAutoModel ' + JSON.stringify(arg));
      };
      _.requestFrames(_, function (error, frames) {
        var frame = void 0;
        if (error) {
          // empty
          // TODO handle properly
        } else {
          _frames(function () {
            var _i = void 0;
            var _len = void 0;
            var _results = [];
            for (_i = 0, _len = frames.length; _i < _len; _i++) {
              frame = frames[_i];
              if (!frame.is_text) {
                _results.push(frame.frame_id.name);
              }
            }
            return _results;
          }());
          if (opts.frame) {
            _frame(opts.frame);
          }
        }
      });
      Flow.Dataflow.react(_frame, function (frame) {
        if (frame) {
          return _.requestFrameSummaryWithoutData(_, frame, function (error, frame) {
            var column = void 0;
            if (error) {
              // empty
              // TODO handle properly
            } else {
              _columns(function () {
                var _i = void 0;
                var _len = void 0;
                var _ref = frame.columns;
                var _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  column = _ref[_i];
                  _results.push(column.label);
                }
                return _results;
              }());
              if (opts.column) {
                _column(opts.column);
                return delete opts.column; // HACK
              }
            }
          });
        }
        return _columns([]);
      });
      lodash.defer(_go);
      return {
        frames: _frames,
        frame: _frame,
        hasFrame: _hasFrame,
        columns: _columns,
        column: _column,
        maxRunTime: _maxRunTime,
        canBuildModel: _canBuildModel,
        buildModel: buildModel,
        template: 'flow-automodel-input'
      };
    }

    var flowPrelude$52 = flowPreludeFunction();

    function h2oPredictInput(_, _go, opt) {
      var lodash = window._;
      var Flow = window.Flow;
      var _ref = opt.predictions_frame;
      var _destinationKey = Flow.Dataflow.signal(_ref != null ? _ref : 'prediction-' + uuid());
      var _selectedModels = opt.models ? opt.models : opt.model ? [opt.model] : [];
      var _selectedFrames = opt.frames ? opt.frames : opt.frame ? [opt.frame] : [];
      var _selectedModelsCaption = _selectedModels.join(', ');
      var _selectedFramesCaption = _selectedFrames.join(', ');
      var _exception = Flow.Dataflow.signal(null);
      var _selectedFrame = Flow.Dataflow.signal(null);
      var _selectedModel = Flow.Dataflow.signal(null);
      var _hasFrames = _selectedFrames.length;
      var _hasModels = _selectedModels.length;
      var _frames = Flow.Dataflow.signals([]);
      var _models = Flow.Dataflow.signals([]);
      var _isDeepLearning = Flow.Dataflow.lift(_selectedModel, function (model) {
        return model && model.algo === 'deeplearning';
      });
      var _hasReconError = Flow.Dataflow.lift(_selectedModel, function (model) {
        var parameter = void 0;
        var _i = void 0;
        var _len = void 0;
        var _ref1 = void 0;
        if (model) {
          if (model.algo === 'deeplearning') {
            _ref1 = model.parameters;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              parameter = _ref1[_i];
              if (parameter.name === 'autoencoder' && parameter.actual_value === true) {
                return true;
              }
            }
          }
        }
        return false;
      });
      var _hasLeafNodeAssignment = Flow.Dataflow.lift(_selectedModel, function (model) {
        if (model) {
          switch (model.algo) {
            case 'gbm':
            case 'drf':
              return true;
            default:
              return false;
          }
        }
      });
      var _hasExemplarIndex = Flow.Dataflow.lift(_selectedModel, function (model) {
        if (model) {
          switch (model.algo) {
            case 'aggregator':
              return true;
            default:
              return false;
          }
        }
      });
      var _computeReconstructionError = Flow.Dataflow.signal(false);
      var _computeDeepFeaturesHiddenLayer = Flow.Dataflow.signal(false);
      var _computeLeafNodeAssignment = Flow.Dataflow.signal(false);
      var _deepFeaturesHiddenLayer = Flow.Dataflow.signal(0);
      var _deepFeaturesHiddenLayerValue = Flow.Dataflow.lift(_deepFeaturesHiddenLayer, function (text) {
        return parseInt(text, 10);
      });
      var _exemplarIndex = Flow.Dataflow.signal(0);
      var _exemplarIndexValue = Flow.Dataflow.lift(_exemplarIndex, function (text) {
        return parseInt(text, 10);
      });
      var _canPredict = Flow.Dataflow.lift(_selectedFrame, _selectedModel, _hasReconError, _computeReconstructionError, _computeDeepFeaturesHiddenLayer, _deepFeaturesHiddenLayerValue, _exemplarIndexValue, _hasExemplarIndex, function (frame, model, hasReconError, computeReconstructionError, computeDeepFeaturesHiddenLayer, deepFeaturesHiddenLayerValue, exemplarIndexValue, hasExemplarIndex) {
        var hasFrameAndModel = frame && model || _hasFrames && model || _hasModels && frame || _hasModels && hasExemplarIndex;
        var hasValidOptions = hasReconError ? computeReconstructionError ? true : computeDeepFeaturesHiddenLayer ? !lodash.isNaN(deepFeaturesHiddenLayerValue) : true : true;
        return hasFrameAndModel && hasValidOptions;
      });
      if (!_hasFrames) {
        _.requestFrames(_, function (error, frames) {
          var frame = void 0;
          if (error) {
            return _exception(new Flow.Error('Error fetching frame list.', error));
          }
          return _frames(function () {
            var _i = void 0;
            var _len = void 0;
            var _results = [];
            for (_i = 0, _len = frames.length; _i < _len; _i++) {
              frame = frames[_i];
              if (!frame.is_text) {
                _results.push(frame.frame_id.name);
              }
            }
            return _results;
          }());
        });
      }
      if (!_hasModels) {
        getModelsRequest(_, function (error, models) {
          var model = void 0;
          if (error) {
            return _exception(new Flow.Error('Error fetching model list.', error));
          }
          return _models(function () {
            var _i = void 0;
            var _len = void 0;
            var _results = [];
            // TODO use models directly
            for (_i = 0, _len = models.length; _i < _len; _i++) {
              model = models[_i];
              _results.push(model.model_id.name);
            }
            return _results;
          }());
        });
      }
      if (!_selectedModel()) {
        if (opt.model && lodash.isString(opt.model)) {
          getModelRequest(_, opt.model, function (error, model) {
            return _selectedModel(model);
          });
        }
      }
      var predict = function predict() {
        var cs = void 0;
        var frameArg = void 0;
        var modelArg = void 0;
        if (_hasFrames) {
          frameArg = _selectedFrames.length > 1 ? _selectedFrames : lodash.head(_selectedFrames);
          modelArg = _selectedModel();
        } else if (_hasModels) {
          modelArg = _selectedModels.length > 1 ? _selectedModels : lodash.head(_selectedModels);
          frameArg = _selectedFrame();
        } else {
          modelArg = _selectedModel();
          frameArg = _selectedFrame();
        }
        var destinationKey = _destinationKey();
        cs = 'predict model: ' + flowPrelude$52.stringify(modelArg) + ', frame: ' + flowPrelude$52.stringify(frameArg);
        if (destinationKey) {
          cs += ', predictions_frame: ' + flowPrelude$52.stringify(destinationKey);
        }
        if (_hasReconError()) {
          if (_computeReconstructionError()) {
            cs += ', reconstruction_error: true';
          }
        }
        if (_computeDeepFeaturesHiddenLayer()) {
          cs += ', deep_features_hidden_layer: ' + _deepFeaturesHiddenLayerValue();
        }
        if (_hasLeafNodeAssignment()) {
          if (_computeLeafNodeAssignment()) {
            cs += ', leaf_node_assignment: true';
          }
        }
        if (_hasExemplarIndex()) {
          cs += ', exemplar_index: ' + _exemplarIndexValue();
        }
        return _.insertAndExecuteCell('cs', cs);
      };
      lodash.defer(_go);
      return {
        destinationKey: _destinationKey,
        exception: _exception,
        hasModels: _hasModels,
        hasFrames: _hasFrames,
        canPredict: _canPredict,
        selectedFramesCaption: _selectedFramesCaption,
        selectedModelsCaption: _selectedModelsCaption,
        selectedFrame: _selectedFrame,
        selectedModel: _selectedModel,
        frames: _frames,
        models: _models,
        predict: predict,
        isDeepLearning: _isDeepLearning,
        hasReconError: _hasReconError,
        hasLeafNodeAssignment: _hasLeafNodeAssignment,
        hasExemplarIndex: _hasExemplarIndex,
        computeReconstructionError: _computeReconstructionError,
        computeDeepFeaturesHiddenLayer: _computeDeepFeaturesHiddenLayer,
        computeLeafNodeAssignment: _computeLeafNodeAssignment,
        deepFeaturesHiddenLayer: _deepFeaturesHiddenLayer,
        exemplarIndex: _exemplarIndex,
        template: 'flow-predict-input'
      };
    }

    var flowPrelude$53 = flowPreludeFunction();

    function h2oCreateFrameInput(_, _go) {
      var lodash = window._;
      var Flow = window.Flow;
      var _key = Flow.Dataflow.signal('');
      var _rows = Flow.Dataflow.signal(10000);
      var _columns = Flow.Dataflow.signal(100);
      var _seed = Flow.Dataflow.signal(7595850248774472000);
      var _seedForColumnTypes = Flow.Dataflow.signal(-1);
      var _randomize = Flow.Dataflow.signal(true);
      var _value = Flow.Dataflow.signal(0);
      var _realRange = Flow.Dataflow.signal(100);
      var _categoricalFraction = Flow.Dataflow.signal(0.1);
      var _factors = Flow.Dataflow.signal(5);
      var _integerFraction = Flow.Dataflow.signal(0.5);
      var _binaryFraction = Flow.Dataflow.signal(0.1);
      var _binaryOnesFraction = Flow.Dataflow.signal(0.02);
      var _timeFraction = Flow.Dataflow.signal(0);
      var _stringFraction = Flow.Dataflow.signal(0);
      var _integerRange = Flow.Dataflow.signal(1);
      var _missingFraction = Flow.Dataflow.signal(0.01);
      var _responseFactors = Flow.Dataflow.signal(2);
      var _hasResponse = Flow.Dataflow.signal(false);
      var createFrame = function createFrame() {
        var opts = {
          dest: _key(),
          rows: _rows(),
          cols: _columns(),
          seed: _seed(),
          seed_for_column_types: _seedForColumnTypes(),
          randomize: _randomize(),
          value: _value(),
          real_range: _realRange(),
          categorical_fraction: _categoricalFraction(),
          factors: _factors(),
          integer_fraction: _integerFraction(),
          binary_fraction: _binaryFraction(),
          binary_ones_fraction: _binaryOnesFraction(),
          time_fraction: _timeFraction(),
          string_fraction: _stringFraction(),
          integer_range: _integerRange(),
          missing_fraction: _missingFraction(),
          response_factors: _responseFactors(),
          has_response: _hasResponse()
        };
        return _.insertAndExecuteCell('cs', 'createFrame ' + flowPrelude$53.stringify(opts));
      };
      lodash.defer(_go);
      return {
        key: _key,
        rows: _rows,
        columns: _columns,
        seed: _seed,
        seed_for_column_types: _seedForColumnTypes,
        randomize: _randomize,
        value: _value,
        realRange: _realRange,
        categoricalFraction: _categoricalFraction,
        factors: _factors,
        integerFraction: _integerFraction,
        binaryFraction: _binaryFraction,
        binaryOnesFraction: _binaryOnesFraction,
        timeFraction: _timeFraction,
        stringFraction: _stringFraction,
        integerRange: _integerRange,
        missingFraction: _missingFraction,
        responseFactors: _responseFactors,
        hasResponse: _hasResponse,
        createFrame: createFrame,
        template: 'flow-create-frame-input'
      };
    }

    var flowPrelude$54 = flowPreludeFunction();

    function h2oSplitFrameInput(_, _go, _frameKey) {
      var lodash = window._;
      var Flow = window.Flow;

      var _frames = Flow.Dataflow.signal([]);
      var _frame = Flow.Dataflow.signal(null);
      var _lastSplitRatio = Flow.Dataflow.signal(1);
      var format4f = function format4f(value) {
        return value.toPrecision(4).replace(/0+$/, '0');
      };
      var _lastSplitRatioText = Flow.Dataflow.lift(_lastSplitRatio, function (ratio) {
        if (lodash.isNaN(ratio)) {
          return ratio;
        }
        return format4f(ratio);
      });
      var _lastSplitKey = Flow.Dataflow.signal('');
      var _splits = Flow.Dataflow.signals([]);
      var _seed = Flow.Dataflow.signal(Math.random() * 1000000 | 0);
      Flow.Dataflow.react(_splits, function () {
        return updateSplitRatiosAndNames();
      });
      var _validationMessage = Flow.Dataflow.signal('');
      var collectRatios = function collectRatios() {
        var entry = void 0;
        var _i = void 0;
        var _len = void 0;
        var _ref = _splits();
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          entry = _ref[_i];
          _results.push(entry.ratio());
        }
        return _results;
      };
      var collectKeys = function collectKeys() {
        var entry = void 0;
        var splitKeys = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref = _splits();
          var _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            entry = _ref[_i];
            _results.push(entry.key().trim());
          }
          return _results;
        }();
        splitKeys.push(_lastSplitKey().trim());
        return splitKeys;
      };
      var createSplitName = function createSplitName(key, ratio) {
        return key + '_' + format4f(ratio);
      };
      function updateSplitRatiosAndNames() {
        var entry = void 0;
        var frame = _frame();
        var ratio = void 0;
        var totalRatio = void 0;
        var _i = void 0;
        var _j = void 0;
        var _len = void 0;
        var _len1 = void 0;
        totalRatio = 0;
        var _ref = collectRatios();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ratio = _ref[_i];
          totalRatio += ratio;
        }
        var lastSplitRatio = _lastSplitRatio(1 - totalRatio);
        var frameKey = frame || 'frame';
        var _ref1 = _splits();
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          entry = _ref1[_j];
          entry.key(createSplitName(frameKey, entry.ratio()));
        }
        _lastSplitKey(createSplitName(frameKey, _lastSplitRatio()));
      }
      var computeSplits = function computeSplits(go) {
        var key = void 0;
        var ratio = void 0;
        var totalRatio = void 0;
        var _i = void 0;
        var _j = void 0;
        var _len = void 0;
        var _len1 = void 0;
        if (!_frame()) {
          return go('Frame not specified.');
        }
        var splitRatios = collectRatios();
        totalRatio = 0;
        for (_i = 0, _len = splitRatios.length; _i < _len; _i++) {
          ratio = splitRatios[_i];
          if (ratio > 0 && ratio < 1) {
            totalRatio += ratio;
          } else {
            return go('One or more split ratios are invalid. Ratios should between 0 and 1.');
          }
        }
        if (totalRatio >= 1) {
          return go('Sum of ratios is >= 1.');
        }
        var splitKeys = collectKeys();
        for (_j = 0, _len1 = splitKeys.length; _j < _len1; _j++) {
          key = splitKeys[_j];
          if (key === '') {
            return go('One or more keys are empty or invalid.');
          }
        }
        if (splitKeys.length < 2) {
          return go('Please specify at least two splits.');
        }
        if (splitKeys.length !== lodash.unique(splitKeys).length) {
          return go('Duplicate keys specified.');
        }
        return go(null, splitRatios, splitKeys);
      };
      var createSplit = function createSplit(ratio) {
        var _ratioText = Flow.Dataflow.signal('' + ratio);
        var _key = Flow.Dataflow.signal('');
        var _ratio = Flow.Dataflow.lift(_ratioText, function (text) {
          return parseFloat(text);
        });
        Flow.Dataflow.react(_ratioText, updateSplitRatiosAndNames);
        flowPrelude$54.remove = function () {
          return _splits.remove(self);
        };
        var self = {
          key: _key,
          ratioText: _ratioText,
          ratio: _ratio,
          remove: flowPrelude$54.remove
        };
        return self;
      };
      var addSplitRatio = function addSplitRatio(ratio) {
        return _splits.push(createSplit(ratio));
      };
      var addSplit = function addSplit() {
        return addSplitRatio(0);
      };
      var splitFrame = function splitFrame() {
        return computeSplits(function (error, splitRatios, splitKeys) {
          if (error) {
            return _validationMessage(error);
          }
          _validationMessage('');
          return _.insertAndExecuteCell('cs', 'splitFrame ' + flowPrelude$54.stringify(_frame()) + ', ' + flowPrelude$54.stringify(splitRatios) + ', ' + flowPrelude$54.stringify(splitKeys) + ', ' + _seed()); // eslint-disable-line
        });
      };
      var initialize = function initialize() {
        _.requestFrames(_, function (error, frames) {
          var frame = void 0;
          var frameKeys = void 0;
          if (!error) {
            frameKeys = function () {
              var _i = void 0;
              var _len = void 0;
              var _results = [];
              for (_i = 0, _len = frames.length; _i < _len; _i++) {
                frame = frames[_i];
                if (!frame.is_text) {
                  _results.push(frame.frame_id.name);
                }
              }
              return _results;
            }();
            frameKeys.sort();
            _frames(frameKeys);
            return _frame(_frameKey);
          }
        });
        addSplitRatio(0.75);
        return lodash.defer(_go);
      };
      initialize();
      return {
        frames: _frames,
        frame: _frame,
        lastSplitRatio: _lastSplitRatio,
        lastSplitRatioText: _lastSplitRatioText,
        lastSplitKey: _lastSplitKey,
        splits: _splits,
        seed: _seed,
        addSplit: addSplit,
        splitFrame: splitFrame,
        validationMessage: _validationMessage,
        template: 'flow-split-frame-input'
      };
    }

    var flowPrelude$55 = flowPreludeFunction();

    function h2oMergeFramesInput(_, _go) {
      var lodash = window._;
      var Flow = window.Flow;
      // TODO display in .jade
      var _exception = Flow.Dataflow.signal(null);
      var _destinationKey = Flow.Dataflow.signal('merged-' + uuid());
      var _frames = Flow.Dataflow.signals([]);
      var _selectedLeftFrame = Flow.Dataflow.signal(null);
      var _leftColumns = Flow.Dataflow.signals([]);
      var _selectedLeftColumn = Flow.Dataflow.signal(null);
      var _includeAllLeftRows = Flow.Dataflow.signal(false);
      var _selectedRightFrame = Flow.Dataflow.signal(null);
      var _rightColumns = Flow.Dataflow.signals([]);
      var _selectedRightColumn = Flow.Dataflow.signal(null);
      var _includeAllRightRows = Flow.Dataflow.signal(false);
      var _canMerge = Flow.Dataflow.lift(_selectedLeftFrame, _selectedLeftColumn, _selectedRightFrame, _selectedRightColumn, function (lf, lc, rf, rc) {
        return lf && lc && rf && rc;
      });
      Flow.Dataflow.react(_selectedLeftFrame, function (frameKey) {
        if (frameKey) {
          return _.requestFrameSummaryWithoutData(_, frameKey, function (error, frame) {
            return _leftColumns(lodash.map(frame.columns, function (column, i) {
              return {
                label: column.label,
                index: i
              };
            }));
          });
        }
        _selectedLeftColumn(null);
        return _leftColumns([]);
      });
      Flow.Dataflow.react(_selectedRightFrame, function (frameKey) {
        if (frameKey) {
          return _.requestFrameSummaryWithoutData(_, frameKey, function (error, frame) {
            return _rightColumns(lodash.map(frame.columns, function (column, i) {
              return {
                label: column.label,
                index: i
              };
            }));
          });
        }
        _selectedRightColumn(null);
        return _rightColumns([]);
      });
      var _merge = function _merge() {
        if (!_canMerge()) {
          return;
        }
        var cs = 'mergeFrames ' + flowPrelude$55.stringify(_destinationKey()) + ', ' + flowPrelude$55.stringify(_selectedLeftFrame()) + ', ' + _selectedLeftColumn().index + ', ' + _includeAllLeftRows() + ', ' + flowPrelude$55.stringify(_selectedRightFrame()) + ', ' + _selectedRightColumn().index + ', ' + _includeAllRightRows();
        return _.insertAndExecuteCell('cs', cs);
      };
      _.requestFrames(_, function (error, frames) {
        var frame = void 0;
        if (error) {
          return _exception(new Flow.Error('Error fetching frame list.', error));
        }
        return _frames(function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = frames.length; _i < _len; _i++) {
            frame = frames[_i];
            if (!frame.is_text) {
              _results.push(frame.frame_id.name);
            }
          }
          return _results;
        }());
      });
      lodash.defer(_go);
      return {
        destinationKey: _destinationKey,
        frames: _frames,
        selectedLeftFrame: _selectedLeftFrame,
        leftColumns: _leftColumns,
        selectedLeftColumn: _selectedLeftColumn,
        includeAllLeftRows: _includeAllLeftRows,
        selectedRightFrame: _selectedRightFrame,
        rightColumns: _rightColumns,
        selectedRightColumn: _selectedRightColumn,
        includeAllRightRows: _includeAllRightRows,
        merge: _merge,
        canMerge: _canMerge,
        template: 'flow-merge-frames-input'
      };
    }

    function blockSelectionUpdates(f) {
      var _isUpdatingSelectionCount = true;
      f();
      _isUpdatingSelectionCount = false;
      return _isUpdatingSelectionCount;
    }

    function incrementSelectionCount(amount, _selectionCount) {
      var Flow = window.Flow;
      return _selectionCount(_selectionCount() + amount);
    }

    function changeSelection(source, value) {
      var entry = void 0;
      var _i = void 0;
      var _len = void 0;
      for (_i = 0, _len = source.length; _i < _len; _i++) {
        entry = source[_i];
        entry.isSelected(value);
      }
    }

    var flowPrelude$56 = flowPreludeFunction();

    function h2oPartialDependenceInput(_, _go) {
      var lodash = window._;
      var Flow = window.Flow;

      var _exception = Flow.Dataflow.signal(null);
      var _destinationKey = Flow.Dataflow.signal('ppd-' + uuid());
      var _frames = Flow.Dataflow.signals([]);
      var _models = Flow.Dataflow.signals([]);
      var _selectedModel = Flow.Dataflow.signals(null);
      var _selectedFrame = Flow.Dataflow.signal(null);
      var _useCustomColumns = Flow.Dataflow.signal(false);
      var _columns = Flow.Dataflow.signal([]);
      var _nbins = Flow.Dataflow.signal(20);

      // search and filter functionality
      var _visibleItems = Flow.Dataflow.signal([]);
      var _filteredItems = Flow.Dataflow.signal([]);

      var maxItemsPerPage = 100;

      var _currentPage = Flow.Dataflow.signal(0);
      var _maxPages = Flow.Dataflow.lift(_filteredItems, function (entries) {
        return Math.ceil(entries.length / maxItemsPerPage);
      });
      var _canGoToPreviousPage = Flow.Dataflow.lift(_currentPage, function (index) {
        return index > 0;
      });
      var _canGoToNextPage = Flow.Dataflow.lift(_maxPages, _currentPage, function (maxPages, index) {
        return index < maxPages - 1;
      });

      var _selectionCount = Flow.Dataflow.signal(0);

      var _isUpdatingSelectionCount = false;

      var _searchTerm = Flow.Dataflow.signal('');
      var _searchCaption = Flow.Dataflow.lift(_columns, _filteredItems, _selectionCount, _currentPage, _maxPages, function (entries, filteredItems, selectionCount, currentPage, maxPages) {
        var caption = void 0;
        if (maxPages === 0) {
          caption = '';
        } else {
          caption = 'Showing page ' + (currentPage + 1) + ' of ' + maxPages + '.';
        }
        if (filteredItems.length !== entries.length) {
          caption = caption.concat(' Filtered ' + filteredItems.length + ' of ' + entries.length + '.');
        }
        if (selectionCount !== 0) {
          caption = caption.concat(selectionCount + ' selected for PDP calculations.');
        }
        return caption;
      });

      var _hasFilteredItems = Flow.Dataflow.lift(_columns, function (entries) {
        return entries.length > 0;
      });
      // this is too tightly coupled
      // defer for now
      var filterItems = function filterItems() {
        var entry = void 0;
        var hide = void 0;
        var i = void 0;
        var j = void 0;
        var len = void 0;
        var searchTerm = _searchTerm().trim();
        var filteredItems = [];
        var ref = _columns();
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          entry = ref[i];
          hide = false;
          if (searchTerm !== '' && entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
            hide = true;
          }
          if (!hide) {
            filteredItems.push(entry);
          }
        }
        _filteredItems(filteredItems);
        var start = _currentPage() * maxItemsPerPage;
        return _visibleItems(_filteredItems().slice(start, start + maxItemsPerPage));
      };
      Flow.Dataflow.react(_searchTerm, lodash.throttle(filterItems, 500));
      var _selectFiltered = function _selectFiltered() {
        var entries = _filteredItems();
        blockSelectionUpdates(function () {
          return changeSelection(entries, true);
        });
        return _selectionCount(entries.length);
      };
      var _deselectFiltered = function _deselectFiltered() {
        blockSelectionUpdates(function () {
          return changeSelection(_columns(), false);
        });
        return _selectionCount(0);
      };
      var _goToPreviousPage = function _goToPreviousPage() {
        if (_canGoToPreviousPage()) {
          _currentPage(_currentPage() - 1);
          filterItems();
        }
      };
      var _goToNextPage = function _goToNextPage() {
        if (_canGoToNextPage()) {
          _currentPage(_currentPage() + 1);
          filterItems();
        }
      };

      //  a conditional check that makes sure that
      //  all fields in the form are filled in
      //  before the button is shown as active
      var _canCompute = Flow.Dataflow.lift(_destinationKey, _selectedFrame, _selectedModel, _nbins, function (dk, sf, sm, nb) {
        return dk && sf && sm && nb;
      });
      var _compute = function _compute() {
        if (!_canCompute()) {
          return;
        }

        // parameters are selections from Flow UI
        // form dropdown menus, text boxes, etc
        var col = void 0;
        var cols = void 0;
        var i = void 0;
        var len = void 0;

        cols = '';

        var ref = _columns();
        for (i = 0, len = ref.length; i < len; i++) {
          col = ref[i];
          if (col.isSelected()) {
            cols = cols + '"' + col.value + '",';
          }
        }

        if (cols !== '') {
          cols = '[' + cols + ']';
        }

        var opts = {
          destination_key: _destinationKey(),
          model_id: _selectedModel(),
          frame_id: _selectedFrame(),
          cols: cols,
          nbins: _nbins()
        };

        // assemble a string
        // this contains the function to call
        // along with the options to pass in
        var cs = 'buildPartialDependence ' + flowPrelude$56.stringify(opts);

        // insert a cell with the expression `cs`
        // into the current Flow notebook
        // and run the cell
        return _.insertAndExecuteCell('cs', cs);
      };

      var _updateColumns = function _updateColumns() {
        var frameKey = _selectedFrame();
        if (frameKey) {
          return _.requestFrameSummaryWithoutData(_, frameKey, function (error, frame) {
            var columnLabels = void 0;
            var columnValues = void 0;
            if (!error) {
              columnValues = frame.columns.map(function (column) {
                return column.label;
              });
              columnLabels = frame.columns.map(function (column) {
                var missingPercent = 100 * column.missing_count / frame.rows;
                var isSelected = Flow.Dataflow.signal(false);
                Flow.Dataflow.react(isSelected, function (isSelected) {
                  if (!_isUpdatingSelectionCount) {
                    if (isSelected) {
                      incrementSelectionCount(1, _selectionCount);
                    } else {
                      incrementSelectionCount(-1, _selectionCount);
                    }
                  }
                });
                return {
                  isSelected: isSelected,
                  type: column.type === 'enum' ? 'enum(' + column.domain_cardinality + ')' : column.type,
                  value: column.label,
                  missingPercent: missingPercent,
                  missingLabel: missingPercent === 0 ? '' : Math.round(missingPercent) + '% NA'
                };
              });
              _columns(columnLabels);
              _currentPage(0);
              _searchTerm('');
              return filterItems();
            }
          });
        }
      };

      _.requestFrames(_, function (error, frames) {
        var frame = void 0;
        if (error) {
          return _exception(new Flow.Error('Error fetching frame list.', error));
        }
        return _frames(function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = frames.length; _i < _len; _i++) {
            frame = frames[_i];
            if (!frame.is_text) {
              _results.push(frame.frame_id.name);
            }
          }
          return _results;
        }());
      });
      getModelsRequest(_, function (error, models) {
        var model = void 0;
        if (error) {
          return _exception(new Flow.Error('Error fetching model list.', error));
        }
        return _models(function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          // TODO use models directly
          for (_i = 0, _len = models.length; _i < _len; _i++) {
            model = models[_i];
            _results.push(model.model_id.name);
          }
          return _results;
        }());
      });
      lodash.defer(_go);
      return {
        exception: _exception,
        destinationKey: _destinationKey,
        frames: _frames,
        models: _models,
        selectedModel: _selectedModel,
        selectedFrame: _selectedFrame,
        columns: _columns,
        visibleItems: _visibleItems,
        useCustomColumns: _useCustomColumns,
        nbins: _nbins,
        compute: _compute,
        updateColumns: _updateColumns,
        canCompute: _canCompute,
        // values for the search and filter functionality
        // of the column selection control
        hasFilteredItems: _hasFilteredItems,
        selectFiltered: _selectFiltered,
        deselectFiltered: _deselectFiltered,
        goToPreviousPage: _goToPreviousPage,
        goToNextPage: _goToNextPage,
        canGoToPreviousPage: _canGoToPreviousPage,
        canGoToNextPage: _canGoToNextPage,
        searchTerm: _searchTerm,
        searchCaption: _searchCaption,
        template: 'flow-partial-dependence-input'
      };
    }

    var flowPrelude$57 = flowPreludeFunction();

    function h2oExportFrameInput(_, _go, frameKey, path, opt) {
      var lodash = window._;
      var Flow = window.Flow;
      var _frames = Flow.Dataflow.signal([]);
      var _selectedFrame = Flow.Dataflow.signal(frameKey);
      var _path = Flow.Dataflow.signal(null);
      var _overwrite = Flow.Dataflow.signal(true);
      var _canExportFrame = Flow.Dataflow.lift(_selectedFrame, _path, function (frame, path) {
        return frame && path;
      });
      var exportFrame = function exportFrame() {
        return _.insertAndExecuteCell('cs', 'exportFrame ' + flowPrelude$57.stringify(_selectedFrame()) + ', ' + flowPrelude$57.stringify(_path()) + ', overwrite: ' + (_overwrite() ? 'true' : 'false'));
      };
      _.requestFrames(_, function (error, frames) {
        var frame = void 0;
        if (error) {
          // empty
        } else {
          _frames(function () {
            var _i = void 0;
            var _len = void 0;
            var _results = [];
            for (_i = 0, _len = frames.length; _i < _len; _i++) {
              frame = frames[_i];
              _results.push(frame.frame_id.name);
            }
            return _results;
          }());
          return _selectedFrame(frameKey);
        }
      });
      lodash.defer(_go);
      return {
        frames: _frames,
        selectedFrame: _selectedFrame,
        path: _path,
        overwrite: _overwrite,
        canExportFrame: _canExportFrame,
        exportFrame: exportFrame,
        template: 'flow-export-frame-input'
      };
    }

    var flowPrelude$58 = flowPreludeFunction();

    function h2oImportModelInput(_, _go, path, opt) {
      var lodash = window._;
      var Flow = window.Flow;
      if (opt == null) {
        opt = {};
      }
      var _path = Flow.Dataflow.signal(path);
      var _overwrite = Flow.Dataflow.signal(opt.overwrite);
      var _canImportModel = Flow.Dataflow.lift(_path, function (path) {
        return path && path.length;
      });
      var importModel = function importModel() {
        return _.insertAndExecuteCell('cs', 'importModel ' + flowPrelude$58.stringify(_path()) + ', overwrite: ' + (_overwrite() ? 'true' : 'false'));
      };
      lodash.defer(_go);
      return {
        path: _path,
        overwrite: _overwrite,
        canImportModel: _canImportModel,
        importModel: importModel,
        template: 'flow-import-model-input'
      };
    }

    var flowPrelude$59 = flowPreludeFunction();

    function h2oExportModelInput(_, _go, modelKey, path, opt) {
      var lodash = window._;
      var Flow = window.Flow;
      if (opt == null) {
        opt = {};
      }
      var _models = Flow.Dataflow.signal([]);
      var _selectedModelKey = Flow.Dataflow.signal(null);
      var _path = Flow.Dataflow.signal(null);
      var _overwrite = Flow.Dataflow.signal(opt.overwrite);
      var _canExportModel = Flow.Dataflow.lift(_selectedModelKey, _path, function (modelKey, path) {
        return modelKey && path;
      });
      var exportModel = function exportModel() {
        return _.insertAndExecuteCell('cs', 'exportModel ' + flowPrelude$59.stringify(_selectedModelKey()) + ', ' + flowPrelude$59.stringify(_path()) + ', overwrite: ' + (_overwrite() ? 'true' : 'false'));
      };
      getModelsRequest(_, function (error, models) {
        var model = void 0;
        if (error) {
          // empty
          // TODO handle properly
        } else {
          _models(function () {
            var _i = void 0;
            var _len = void 0;
            var _results = [];
            for (_i = 0, _len = models.length; _i < _len; _i++) {
              model = models[_i];
              _results.push(model.model_id.name);
            }
            return _results;
          }());
          return _selectedModelKey(modelKey);
        }
      });
      lodash.defer(_go);
      return {
        models: _models,
        selectedModelKey: _selectedModelKey,
        path: _path,
        overwrite: _overwrite,
        canExportModel: _canExportModel,
        exportModel: exportModel,
        template: 'flow-export-model-input'
      };
    }

    function h2oNoAssist(_, _go) {
      var lodash = window._;
      lodash.defer(_go);
      return {
        showAssist: function showAssist() {
          return _.insertAndExecuteCell('cs', 'assist');
        },

        template: 'flow-no-assist'
      };
    }

    function populateFramesAndColumns(_, frameKey, algorithm, parameters, go) {
      var lodash = window._;
      var Flow = window.Flow;
      var destinationKeyParameter = lodash.find(parameters, function (parameter) {
        return parameter.name === 'model_id';
      });
      if (destinationKeyParameter && !destinationKeyParameter.actual_value) {
        destinationKeyParameter.actual_value = algorithm + '-' + uuid();
      }

      //
      // Force classification.
      //
      var classificationParameter = lodash.find(parameters, function (parameter) {
        return parameter.name === 'do_classification';
      });
      if (classificationParameter) {
        classificationParameter.actual_value = true;
      }
      return _.requestFrames(_, function (error, frames) {
        var frame = void 0;
        var frameKeys = void 0;
        var frameParameters = void 0;
        var parameter = void 0;
        var _i = void 0;
        var _len = void 0;
        if (error) {
          // empty
          // TODO handle properly
        } else {
          frameKeys = function () {
            var _i = void 0;
            var _len = void 0;
            var _results = [];
            for (_i = 0, _len = frames.length; _i < _len; _i++) {
              frame = frames[_i];
              _results.push(frame.frame_id.name);
            }
            return _results;
          }();
          frameParameters = lodash.filter(parameters, function (parameter) {
            return parameter.type === 'Key<Frame>';
          });
          for (_i = 0, _len = frameParameters.length; _i < _len; _i++) {
            parameter = frameParameters[_i];
            parameter.values = frameKeys;

            // TODO HACK
            if (parameter.name === 'training_frame') {
              if (frameKey) {
                parameter.actual_value = frameKey;
              } else {
                frameKey = parameter.actual_value;
              }
            }
          }
          return go();
        }
      });
    }

    function parameterTemplateOf(control) {
      return "flow-" + control.kind + "-model-parameter";
    }

    function collectParameters(includeUnchangedParameters, _controlGroups, control, _gridId, _gridStrategy, _gridMaxModels, _gridMaxRuntime, _gridStoppingRounds, _gridStoppingTolerance, _gridStoppingMetric) {
      var lodash = window._;
      var controls = void 0;
      var entry = void 0;
      var gridStoppingRounds = void 0;
      var isGrided = void 0;
      var item = void 0;
      var maxModels = void 0;
      var maxRuntime = void 0;
      var searchCriteria = void 0;
      var selectedValues = void 0;
      var stoppingTolerance = void 0;
      var value = void 0;
      var _l = void 0;
      var _len3 = void 0;
      var _len4 = void 0;
      var _len5 = void 0;
      var _m = void 0;
      var _n = void 0;
      var _ref = void 0;
      if (includeUnchangedParameters == null) {
        includeUnchangedParameters = false;
      }
      isGrided = false;
      var parameters = {};
      var hyperParameters = {};
      for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
        controls = _controlGroups[_l];
        for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
          control = controls[_m];
          if (control.isGrided()) {
            isGrided = true;
            switch (control.kind) {
              case 'textbox':
                hyperParameters[control.name] = control.valueGrided();
                break;
              case 'dropdown':
                hyperParameters[control.name] = selectedValues = [];
                _ref = control.gridedValues();
                for (_n = 0, _len5 = _ref.length; _n < _len5; _n++) {
                  item = _ref[_n];
                  if (item.value()) {
                    selectedValues.push(item.label);
                  }
                }
                break;
              default:
                // checkbox
                hyperParameters[control.name] = [true, false];
            }
          } else {
            value = control.value();
            if (control.isVisible() && (includeUnchangedParameters || control.isRequired || control.defaultValue !== value)) {
              switch (control.kind) {
                case 'dropdown':
                  if (value) {
                    parameters[control.name] = value;
                  }
                  break;
                case 'list':
                  if (value.length) {
                    selectedValues = function () {
                      var _len6 = void 0;
                      var _o = void 0;
                      var _results = [];
                      for (_o = 0, _len6 = value.length; _o < _len6; _o++) {
                        entry = value[_o];
                        if (entry.isSelected()) {
                          _results.push(entry.value);
                        }
                      }
                      return _results;
                    }();
                    parameters[control.name] = selectedValues;
                  }
                  break;
                default:
                  parameters[control.name] = value;
              }
            }
          }
        }
      }
      if (isGrided) {
        parameters.grid_id = _gridId();
        parameters.hyper_parameters = hyperParameters;
        // { 'strategy': "RandomDiscrete/Cartesian", 'max_models': 3, 'max_runtime_secs': 20 }
        searchCriteria = { strategy: _gridStrategy() };
        switch (searchCriteria.strategy) {
          case 'RandomDiscrete':
            maxModels = parseInt(_gridMaxModels(), 10);
            if (!lodash.isNaN(maxModels)) {
              searchCriteria.max_models = maxModels;
            }
            maxRuntime = parseInt(_gridMaxRuntime(), 10);
            if (!lodash.isNaN(maxRuntime)) {
              searchCriteria.max_runtime_secs = maxRuntime;
            }
            gridStoppingRounds = parseInt(_gridStoppingRounds(), 10);
            if (!lodash.isNaN(gridStoppingRounds)) {
              searchCriteria.stopping_rounds = gridStoppingRounds;
            }
            stoppingTolerance = parseFloat(_gridStoppingTolerance());
            if (!lodash.isNaN(stoppingTolerance)) {
              searchCriteria.stopping_tolerance = stoppingTolerance;
            }
            searchCriteria.stopping_metric = _gridStoppingMetric();
            break;
          default:
          // do nothing
        }
        parameters.search_criteria = searchCriteria;
      }
      return parameters;
    }

    function postModelInputValidationRequest(_, algo, parameters, go) {
      return doPost(_, _.__.modelBuilderEndpoints[algo] + '/parameters', encodeObjectForPost(parameters), go);
    }

    function performValidations(_, checkForErrors, go, _exception, collectParameters, _controlGroups, control, _gridId, _gridStrategy, _gridMaxModels, _gridMaxRuntime, _gridStoppingRounds, _gridStoppingTolerance, _gridStoppingMetric, _validationFailureMessage, _algorithm) {
      var lodash = window._;
      var Flow = window.Flow;
      _exception(null);
      var parameters = collectParameters(true, _controlGroups, control, _gridId, _gridStrategy, _gridMaxModels, _gridMaxRuntime, _gridStoppingRounds, _gridStoppingTolerance, _gridStoppingMetric);
      if (parameters.hyper_parameters) {
        // parameter validation fails with hyper_parameters, so skip.
        return go();
      }
      _validationFailureMessage('');
      return postModelInputValidationRequest(_, _algorithm, parameters, function (error, modelBuilder) {
        var controls = void 0;
        var hasErrors = void 0;
        var validation = void 0;
        var validations = void 0;
        var validationsByControlName = void 0;
        var _l = void 0;
        var _len3 = void 0;
        var _len4 = void 0;
        var _len5 = void 0;
        var _m = void 0;
        var _n = void 0;
        if (error) {
          return _exception(Flow.failure(_, new Flow.Error('Error fetching initial model builder state', error)));
        }
        hasErrors = false;
        if (modelBuilder.messages.length) {
          validationsByControlName = lodash.groupBy(modelBuilder.messages, function (validation) {
            return validation.field_name;
          });
          for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
            controls = _controlGroups[_l];
            for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
              control = controls[_m];
              validations = validationsByControlName[control.name];
              if (validations) {
                for (_n = 0, _len5 = validations.length; _n < _len5; _n++) {
                  validation = validations[_n];
                  if (validation.message_type === 'TRACE') {
                    control.isVisible(false);
                  } else {
                    control.isVisible(true);
                    if (checkForErrors) {
                      switch (validation.message_type) {
                        case 'INFO':
                          control.hasInfo(true);
                          control.message(validation.message);
                          break;
                        case 'WARN':
                          control.hasWarning(true);
                          control.message(validation.message);
                          break;
                        case 'ERRR':
                          control.hasError(true);
                          control.message(validation.message);
                          hasErrors = true;
                          break;
                        default:
                        // do nothing
                      }
                    }
                  }
                }
              } else {
                control.isVisible(true);
                control.hasInfo(false);
                control.hasWarning(false);
                control.hasError(false);
                control.message('');
              }
            }
          }
        }
        if (hasErrors) {
          // Do not pass go(). Do not collect $200.
          return _validationFailureMessage('Your model parameters have one or more errors. Please fix them and try again.');
        }
        // Proceed with form submission
        _validationFailureMessage('');
        return go();
      });
    }

    function createControl(kind, parameter) {
      var Flow = window.Flow;
      var _hasError = Flow.Dataflow.signal(false);
      var _hasWarning = Flow.Dataflow.signal(false);
      var _hasInfo = Flow.Dataflow.signal(false);
      var _message = Flow.Dataflow.signal('');
      var _hasMessage = Flow.Dataflow.lift(_message, function (message) {
        if (message) {
          return true;
        }
        return false;
      });
      var _isVisible = Flow.Dataflow.signal(true);
      var _isGrided = Flow.Dataflow.signal(false);
      var _isNotGrided = Flow.Dataflow.lift(_isGrided, function (value) {
        return !value;
      });
      return {
        kind: kind,
        name: parameter.name,
        label: parameter.label,
        description: parameter.help,
        isRequired: parameter.required,
        hasError: _hasError,
        hasWarning: _hasWarning,
        hasInfo: _hasInfo,
        message: _message,
        hasMessage: _hasMessage,
        isVisible: _isVisible,
        isGridable: parameter.gridable,
        isGrided: _isGrided,
        isNotGrided: _isNotGrided
      };
    }

    function createTextboxControl(parameter, type) {
      var lodash = window._;
      var Flow = window.Flow;
      var isArrayValued = void 0;
      var isInt = void 0;
      var isReal = void 0;
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
      var _ref = parameter.actual_value;
      var _ref1 = parameter.actual_value;
      var _text = Flow.Dataflow.signal(isArrayValued ? (_ref != null ? _ref : []).join(', ') : _ref1 != null ? _ref1 : '');
      var _textGrided = Flow.Dataflow.signal(_text() + ';');
      var textToValues = function textToValues(text) {
        var parsed = void 0;
        var vals = void 0;
        var value = void 0;
        var _i = void 0;
        var _len = void 0;
        var _ref2 = void 0;
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
      var _value = Flow.Dataflow.lift(_text, textToValues);
      var _valueGrided = Flow.Dataflow.lift(_textGrided, function (text) {
        var part = void 0;
        var token = void 0;
        var _i = void 0;
        var _len = void 0;
        lodash.values = [];
        var _ref2 = ('' + text).split(/\s*;\s*/g);
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          part = _ref2[_i];
          token = part.trim();
          if (token) {
            lodash.values.push(textToValues(token));
          }
        }
        return lodash.values;
      });
      var control = createControl('textbox', parameter);
      control.text = _text;
      control.textGrided = _textGrided;
      control.value = _value;
      control.valueGrided = _valueGrided;
      control.isArrayValued = isArrayValued;
      return control;
    }

    function createGridableValues(values, defaultValue) {
      var lodash = window._;
      var Flow = window.Flow;
      return lodash.map(values, function (value) {
        return {
          label: value,
          value: Flow.Dataflow.signal(true)
        };
      });
    }

    function createDropdownControl(parameter) {
      var Flow = window.Flow;
      var _value = Flow.Dataflow.signal(parameter.actual_value);
      var control = createControl('dropdown', parameter);
      control.values = Flow.Dataflow.signals(parameter.values);
      control.value = _value;
      control.gridedValues = Flow.Dataflow.lift(control.values, function (values) {
        return createGridableValues(values);
      });
      return control;
    }

    function createEntry(value, _selectionCount, _isUpdatingSelectionCount) {
      var Flow = window.Flow;
      var isSelected = Flow.Dataflow.signal(false);
      Flow.Dataflow.react(isSelected, function (isSelected) {
        if (!_isUpdatingSelectionCount) {
          if (isSelected) {
            incrementSelectionCount(1, _selectionCount);
          } else {
            incrementSelectionCount(-1, _selectionCount);
          }
        }
      });
      return {
        isSelected: isSelected,
        value: value.value,
        type: value.type,
        missingLabel: value.missingLabel,
        missingPercent: value.missingPercent
      };
    }

    function createListControl(parameter) {
      var lodash = window._;
      var Flow = window.Flow;
      var _lastUsedIgnoreNaTerm = void 0;
      var _lastUsedSearchTerm = void 0;
      var MaxItemsPerPage = 100;
      var _searchTerm = Flow.Dataflow.signal('');
      var _ignoreNATerm = Flow.Dataflow.signal('');
      var _values = Flow.Dataflow.signal([]);
      var _selectionCount = Flow.Dataflow.signal(0);
      var _isUpdatingSelectionCount = false;
      var _entries = Flow.Dataflow.lift(_values, function (values) {
        // eslint-disable-line arrow-body-style
        return values.map(function (value) {
          // eslint-disable-line arrow-body-style
          return createEntry(value, _selectionCount, _isUpdatingSelectionCount);
        });
      });
      var _filteredItems = Flow.Dataflow.signal([]);
      var _visibleItems = Flow.Dataflow.signal([]);
      var _hasFilteredItems = Flow.Dataflow.lift(_filteredItems, function (entries) {
        return entries.length > 0;
      });
      var _currentPage = Flow.Dataflow.signal(0);
      var _maxPages = Flow.Dataflow.lift(_filteredItems, function (entries) {
        return Math.ceil(entries.length / MaxItemsPerPage);
      });
      var _canGoToPreviousPage = Flow.Dataflow.lift(_currentPage, function (index) {
        return index > 0;
      });
      var _canGoToNextPage = Flow.Dataflow.lift(_maxPages, _currentPage, function (maxPages, index) {
        return index < maxPages - 1;
      });
      var _searchCaption = Flow.Dataflow.lift(_entries, _filteredItems, _selectionCount, _currentPage, _maxPages, function (entries, filteredItems, selectionCount, currentPage, maxPages) {
        var caption = void 0;
        caption = maxPages === 0 ? '' : 'Showing page ' + (currentPage + 1) + ' of ' + maxPages + '.';
        if (filteredItems.length !== entries.length) {
          caption += ' Filtered ' + filteredItems.length + ' of ' + entries.length + '.';
        }
        if (selectionCount !== 0) {
          caption += ' ' + selectionCount + ' ignored.';
        }
        return caption;
      });
      Flow.Dataflow.react(_entries, function () {
        return filterItems(true);
      });
      _lastUsedSearchTerm = null;
      _lastUsedIgnoreNaTerm = null;
      // abstracting this out produces errors
      // this is too tightly coupled
      // defer for now
      var filterItems = function filterItems(force) {
        var entry = void 0;
        var filteredItems = void 0;
        var hide = void 0;
        var i = void 0;
        var missingPercent = void 0;
        var _i = void 0;
        var _len = void 0;
        var _ref = void 0;
        if (force == null) {
          force = false;
        }
        var searchTerm = _searchTerm().trim();
        var ignoreNATerm = _ignoreNATerm().trim();
        if (force || searchTerm !== _lastUsedSearchTerm || ignoreNATerm !== _lastUsedIgnoreNaTerm) {
          filteredItems = [];
          _ref = _entries();
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            entry = _ref[i];
            missingPercent = parseFloat(ignoreNATerm);
            hide = false;
            if (searchTerm !== '' && entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
              hide = true;
            } else if (!lodash.isNaN(missingPercent) && missingPercent !== 0 && entry.missingPercent <= missingPercent) {
              hide = true;
            }
            if (!hide) {
              filteredItems.push(entry);
            }
          }
          _lastUsedSearchTerm = searchTerm;
          _lastUsedIgnoreNaTerm = ignoreNATerm;
          _currentPage(0);
          _filteredItems(filteredItems);
        }
        var start = _currentPage() * MaxItemsPerPage;
        _visibleItems(_filteredItems().slice(start, start + MaxItemsPerPage));
      };
      var selectFiltered = function selectFiltered() {
        var entries = _filteredItems();
        blockSelectionUpdates(function () {
          return changeSelection(entries, true);
        });
        return _selectionCount(entries.length);
      };
      var deselectFiltered = function deselectFiltered() {
        blockSelectionUpdates(function () {
          return changeSelection(_filteredItems(), false);
        });
        return _selectionCount(0);
      };
      // depends on `filterItems()`
      var goToPreviousPage = function goToPreviousPage() {
        if (_canGoToPreviousPage()) {
          _currentPage(_currentPage() - 1);
          filterItems();
        }
      };
      // depends on `filterItems()`
      var goToNextPage = function goToNextPage() {
        if (_canGoToNextPage()) {
          _currentPage(_currentPage() + 1);
          filterItems();
        }
      };
      Flow.Dataflow.react(_searchTerm, lodash.throttle(filterItems, 500));
      Flow.Dataflow.react(_ignoreNATerm, lodash.throttle(filterItems, 500));
      var control = createControl('list', parameter);
      control.values = _values;
      control.entries = _visibleItems;
      control.hasFilteredItems = _hasFilteredItems;
      control.searchCaption = _searchCaption;
      control.searchTerm = _searchTerm;
      control.ignoreNATerm = _ignoreNATerm;
      control.value = _entries;
      control.selectFiltered = selectFiltered;
      control.deselectFiltered = deselectFiltered;
      control.goToPreviousPage = goToPreviousPage;
      control.goToNextPage = goToNextPage;
      control.canGoToPreviousPage = _canGoToPreviousPage;
      control.canGoToNextPage = _canGoToNextPage;
      return control;
    }

    function createCheckboxControl(parameter) {
      var lodash = window._;
      var Flow = window.Flow;
      var _value = Flow.Dataflow.signal(parameter.actual_value);
      var control = createControl('checkbox', parameter);
      control.clientId = lodash.uniqueId();
      control.value = _value;
      return control;
    }

    function createControlFromParameter(parameter) {
      switch (parameter.type) {
        case 'enum':
        case 'Key<Frame>':
        case 'VecSpecifier':
          return createDropdownControl(parameter);
        case 'string[]':
        case 'Key<Frame>[]':
        case 'Key<Model>[]':
          return createListControl(parameter);
        case 'boolean':
          return createCheckboxControl(parameter);
        case 'Key<Model>':
        case 'string':
        case 'byte':
        case 'short':
        case 'int':
        case 'long':
        case 'float':
        case 'double':
        case 'byte[]':
        case 'short[]':
        case 'int[]':
        case 'long[]':
        case 'float[]':
        case 'double[]':
          return createTextboxControl(parameter, parameter.type);
        default:
          console.error('Invalid field', JSON.stringify(parameter, null, 2));
          return null;
      }
    }

    var flowPrelude$61 = flowPreludeFunction();

    function h2oModelBuilderForm(_, _algorithm, _parameters) {
      var lodash = window._;
      var Flow = window.Flow;
      var control = void 0;
      var _i = void 0;
      var _j = void 0;
      var _k = void 0;
      var _len = void 0;
      var _len1 = void 0;
      var _len2 = void 0;
      var _exception = Flow.Dataflow.signal(null);
      var _validationFailureMessage = Flow.Dataflow.signal('');
      var _hasValidationFailures = Flow.Dataflow.lift(_validationFailureMessage, flowPrelude$61.isTruthy);
      var _gridStrategies = ['Cartesian', 'RandomDiscrete'];
      var _isGrided = Flow.Dataflow.signal(false);
      var _gridId = Flow.Dataflow.signal('grid-' + uuid());
      var _gridStrategy = Flow.Dataflow.signal('Cartesian');
      var _isGridRandomDiscrete = Flow.Dataflow.lift(_gridStrategy, function (strategy) {
        return strategy !== _gridStrategies[0];
      });
      var _gridMaxModels = Flow.Dataflow.signal(1000);
      var _gridMaxRuntime = Flow.Dataflow.signal(28800);
      var _gridStoppingRounds = Flow.Dataflow.signal(0);
      var _gridStoppingMetrics = ['AUTO', 'deviance', 'logloss', 'MSE', 'AUC', 'lift_top_group', 'r2', 'misclassification'];
      var _gridStoppingMetric = Flow.Dataflow.signal(_gridStoppingMetrics[0]);
      var _gridStoppingTolerance = Flow.Dataflow.signal(0.001);
      var _parametersByLevel = lodash.groupBy(_parameters, function (parameter) {
        return parameter.level;
      });
      var _controlGroups = lodash.map(['critical', 'secondary', 'expert'], function (type) {
        var controls = lodash.filter(lodash.map(_parametersByLevel[type], createControlFromParameter), function (a) {
          if (a) {
            return true;
          }
          return false;
        });
        // Show/hide grid settings if any controls are grid-ified.
        lodash.forEach(controls, function (control) {
          return Flow.Dataflow.react(control.isGrided, function () {
            var isGrided = void 0;
            var _i = void 0;
            var _len = void 0;
            isGrided = false;
            for (_i = 0, _len = controls.length; _i < _len; _i++) {
              control = controls[_i];
              if (control.isGrided()) {
                _isGrided(isGrided = true);
                break;
              }
            }
            if (!isGrided) {
              return _isGrided(false);
            }
          });
        });
        return controls;
      });
      var criticalControls = _controlGroups[0];
      var secondaryControls = _controlGroups[1];
      var expertControls = _controlGroups[2];
      var _form = [];
      if (criticalControls.length) {
        _form.push({
          kind: 'group',
          title: 'Parameters'
        });
        for (_i = 0, _len = criticalControls.length; _i < _len; _i++) {
          control = criticalControls[_i];
          _form.push(control);
        }
      }
      if (secondaryControls.length) {
        _form.push({
          kind: 'group',
          title: 'Advanced'
        });
        for (_j = 0, _len1 = secondaryControls.length; _j < _len1; _j++) {
          control = secondaryControls[_j];
          _form.push(control);
        }
      }
      if (expertControls.length) {
        _form.push({
          kind: 'group',
          title: 'Expert'
        });
        for (_k = 0, _len2 = expertControls.length; _k < _len2; _k++) {
          control = expertControls[_k];
          _form.push(control);
        }
      }
      // looks tightly coupled
      var findFormField = function findFormField(name) {
        return lodash.find(_form, function (field) {
          return field.name === name;
        });
      };
      (function () {
        var _ref = lodash.map(['training_frame', 'validation_frame', 'response_column', 'ignored_columns', 'offset_column', 'weights_column', 'fold_column'], findFormField);
        var trainingFrameParameter = _ref[0];
        var validationFrameParameter = _ref[1];
        var responseColumnParameter = _ref[2];
        var ignoredColumnsParameter = _ref[3];
        var offsetColumnsParameter = _ref[4];
        var weightsColumnParameter = _ref[5];
        var foldColumnParameter = _ref[6];
        if (trainingFrameParameter) {
          if (responseColumnParameter || ignoredColumnsParameter) {
            return Flow.Dataflow.act(trainingFrameParameter.value, function (frameKey) {
              if (frameKey) {
                _.requestFrameSummaryWithoutData(_, frameKey, function (error, frame) {
                  var columnLabels = void 0;
                  var columnValues = void 0;
                  if (!error) {
                    columnValues = lodash.map(frame.columns, function (column) {
                      return column.label;
                    });
                    columnLabels = lodash.map(frame.columns, function (column) {
                      var missingPercent = 100 * column.missing_count / frame.rows;
                      return {
                        type: column.type === 'enum' ? 'enum(' + column.domain_cardinality + ')' : column.type,
                        value: column.label,
                        missingPercent: missingPercent,
                        missingLabel: missingPercent === 0 ? '' : Math.round(missingPercent) + '% NA'
                      };
                    });
                    if (responseColumnParameter) {
                      responseColumnParameter.values(columnValues);
                    }
                    if (ignoredColumnsParameter) {
                      ignoredColumnsParameter.values(columnLabels);
                    }
                    if (weightsColumnParameter) {
                      weightsColumnParameter.values(columnValues);
                    }
                    if (foldColumnParameter) {
                      foldColumnParameter.values(columnValues);
                    }
                    if (offsetColumnsParameter) {
                      offsetColumnsParameter.values(columnValues);
                    }
                    if (responseColumnParameter && ignoredColumnsParameter) {
                      // Mark response column as 'unavailable' in ignored column list.
                      return Flow.Dataflow.lift(responseColumnParameter.value, function (responseVariableName) {
                        // FIXME
                        // ignoredColumnsParameter.unavailableValues [ responseVariableName ]
                      });
                    }
                  }
                });
              }
            });
          }
        }
      })();
      //
      // The 'checkForErrors' parameter exists so that we can conditionally choose
      // to ignore validation errors. This is because we need the show/hide states
      // for each field the first time around, but not the errors/warnings/info
      // messages.
      //
      // Thus, when this function is called during form init, checkForErrors is
      //  passed in as 'false', and during form submission, checkForErrors is
      //  passsed in as 'true'.
      //
      // looks tightly coupled
      var createModel = function createModel() {
        _exception(null);
        var createModelContinuationFunction = function createModelContinuationFunction() {
          var parameters = collectParameters(false, _controlGroups, control, _gridId, _gridStrategy, _gridMaxModels, _gridMaxRuntime, _gridStoppingRounds, _gridStoppingTolerance, _gridStoppingMetric);
          return _.insertAndExecuteCell('cs', 'buildModel \'' + _algorithm + '\', ' + flowPrelude$61.stringify(parameters));
        };
        return performValidations(_, true, createModelContinuationFunction, _exception, collectParameters, _controlGroups, control, _gridId, _gridStrategy, _gridMaxModels, _gridMaxRuntime, _gridStoppingRounds, _gridStoppingTolerance, _gridStoppingMetric, _validationFailureMessage, _algorithm);
      };
      var _revalidate = function _revalidate(value) {
        // HACK: ko seems to be raising change notifications when dropdown boxes are initialized.
        if (value !== void 0) {
          return performValidations(_, false, function () {}, _exception, collectParameters, _controlGroups, control, _gridId, _gridStrategy, _gridMaxModels, _gridMaxRuntime, _gridStoppingRounds, _gridStoppingTolerance, _gridStoppingMetric, _validationFailureMessage, _algorithm);
        }
      };
      var revalidate = lodash.throttle(_revalidate, 100, { leading: false });

      // Kick off validations (minus error checking) to get hidden parameters
      var validationContinuationFunction = function validationContinuationFunction() {
        var controls = void 0;
        var _l = void 0;
        var _len3 = void 0;
        var _len4 = void 0;
        var _m = void 0;
        for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
          controls = _controlGroups[_l];
          for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
            control = controls[_m];
            Flow.Dataflow.react(control.value, revalidate);
          }
        }
      };
      performValidations(_, false, validationContinuationFunction, _exception, collectParameters, _controlGroups, control, _gridId, _gridStrategy, _gridMaxModels, _gridMaxRuntime, _gridStoppingRounds, _gridStoppingTolerance, _gridStoppingMetric, _validationFailureMessage, _algorithm);
      return {
        form: _form,
        isGrided: _isGrided,
        gridId: _gridId,
        gridStrategy: _gridStrategy,
        gridStrategies: _gridStrategies,
        isGridRandomDiscrete: _isGridRandomDiscrete,
        gridMaxModels: _gridMaxModels,
        gridMaxRuntime: _gridMaxRuntime,
        gridStoppingRounds: _gridStoppingRounds,
        gridStoppingMetrics: _gridStoppingMetrics,
        gridStoppingMetric: _gridStoppingMetric,
        gridStoppingTolerance: _gridStoppingTolerance,
        exception: _exception,
        parameterTemplateOf: parameterTemplateOf,
        createModel: createModel,
        hasValidationFailures: _hasValidationFailures,
        validationFailureMessage: _validationFailureMessage
      };
    }

    function cacheModelBuilders(_, modelBuilders) {
      var modelBuilder = void 0;
      var _i = void 0;
      var _len = void 0;
      var modelBuilderEndpoints = {};
      var gridModelBuilderEndpoints = {};
      for (_i = 0, _len = modelBuilders.length; _i < _len; _i++) {
        modelBuilder = modelBuilders[_i];
        modelBuilderEndpoints[modelBuilder.algo] = "/" + modelBuilder.__meta.schema_version + "/ModelBuilders/" + modelBuilder.algo;
        gridModelBuilderEndpoints[modelBuilder.algo] = "/99/Grid/" + modelBuilder.algo;
      }
      _.__.modelBuilderEndpoints = modelBuilderEndpoints;
      _.__.gridModelBuilderEndpoints = gridModelBuilderEndpoints;
      _.__.modelBuilders = modelBuilders;
      return _.__.modelBuilders;
    }

    function requestModelBuilders(_, go) {
      var modelBuilders = _.__.modelBuilders;
      if (modelBuilders) {
        return go(null, modelBuilders);
      }
      var visibility = 'Stable';
      return doGet(_, '/3/ModelBuilders', unwrap(go, function (result) {
        var algo = void 0;
        var builder = void 0;
        var builders = function () {
          var _ref = result.model_builders;
          var _results = [];
          for (algo in _ref) {
            if ({}.hasOwnProperty.call(_ref, algo)) {
              builder = _ref[algo];
              _results.push(builder);
            }
          }
          return _results;
        }();
        var availableBuilders = function () {
          var _i = void 0;
          var _j = void 0;
          var _len = void 0;
          var _len1 = void 0;
          var _results = void 0;
          var _results1 = void 0;
          switch (visibility) {
            case 'Stable':
              _results = [];
              for (_i = 0, _len = builders.length; _i < _len; _i++) {
                builder = builders[_i];
                if (builder.visibility === visibility) {
                  _results.push(builder);
                }
              }
              return _results;
            // break; // no-unreachable
            case 'Beta':
              _results1 = [];
              for (_j = 0, _len1 = builders.length; _j < _len1; _j++) {
                builder = builders[_j];
                if (builder.visibility === visibility || builder.visibility === 'Stable') {
                  _results1.push(builder);
                }
              }
              return _results1;
            // break; // no-unreachable
            default:
              return builders;
          }
        }();
        return cacheModelBuilders(_, availableBuilders);
      }));
    }

    var flowPrelude$60 = flowPreludeFunction();

    function h2oModelInput(_, _go, _algo, _opts) {
      var lodash = window._;
      var Flow = window.Flow;
      var H2O = window.H2O;
      var _exception = Flow.Dataflow.signal(null);
      var _algorithms = Flow.Dataflow.signal([]);
      var _algorithm = Flow.Dataflow.signal(null);
      var _canCreateModel = Flow.Dataflow.lift(_algorithm, function (algorithm) {
        if (algorithm) {
          return true;
        }
        return false;
      });
      var _modelForm = Flow.Dataflow.signal(null);
      (function () {
        return requestModelBuilders(_, function (error, modelBuilders) {
          _algorithms(modelBuilders);
          _algorithm(_algo ? lodash.find(modelBuilders, function (builder) {
            return builder.algo === _algo;
          }) : void 0);
          var frameKey = _opts != null ? _opts.training_frame : void 0;
          return Flow.Dataflow.act(_algorithm, function (builder) {
            var algorithm = void 0;
            var parameters = void 0;
            if (builder) {
              algorithm = builder.algo;
              parameters = flowPrelude$60.deepClone(builder.parameters);
              return populateFramesAndColumns(_, frameKey, algorithm, parameters, function () {
                return _modelForm(h2oModelBuilderForm(_, algorithm, parameters));
              });
            }
            return _modelForm(null);
          });
        });
      })();
      var createModel = function createModel() {
        return _modelForm().createModel();
      };
      lodash.defer(_go);
      return {
        parentException: _exception, // XXX hacky
        algorithms: _algorithms,
        algorithm: _algorithm,
        modelForm: _modelForm,
        canCreateModel: _canCreateModel,
        createModel: createModel,
        template: 'flow-model-input'
      };
    }

    function createOptions(options) {
      var option = void 0;
      var _i = void 0;
      var _len = void 0;
      var _results = [];
      for (_i = 0, _len = options.length; _i < _len; _i++) {
        option = options[_i];
        _results.push({
          caption: option,
          value: option.toLowerCase()
        });
      }
      return _results;
    }

    function h2oImputeInput(_, _go, opts) {
      var lodash = window._;
      var Flow = window.Flow;
      var H2O = window.H2O;
      var _allMethods = createOptions(['Mean', 'Median', 'Mode']);
      var _allCombineMethods = createOptions(['Interpolate', 'Average', 'Low', 'High']);
      if (opts == null) {
        opts = {};
      }
      var _frames = Flow.Dataflow.signal([]);
      var _frame = Flow.Dataflow.signal(null);
      var _hasFrame = Flow.Dataflow.lift(_frame, function (frame) {
        if (frame) {
          return true;
        }
        return false;
      });
      var _columns = Flow.Dataflow.signal([]);
      var _column = Flow.Dataflow.signal(null);
      var _methods = _allMethods;
      var _method = Flow.Dataflow.signal(_allMethods[0]);
      var _canUseCombineMethod = Flow.Dataflow.lift(_method, function (method) {
        return method.value === 'median';
      });
      var _combineMethods = _allCombineMethods;
      var _combineMethod = Flow.Dataflow.signal(_allCombineMethods[0]);
      var _canGroupByColumns = Flow.Dataflow.lift(_method, function (method) {
        return method.value !== 'median';
      });
      var _groupByColumns = Flow.Dataflow.signals([]);
      var _canImpute = Flow.Dataflow.lift(_frame, _column, function (frame, column) {
        return frame && column;
      });
      var impute = function impute() {
        var combineMethod = _combineMethod();
        var groupByColumns = void 0;
        var method = _method();
        var arg = {
          frame: _frame(),
          column: _column(),
          method: method.value
        };
        if (method.value === 'median') {
          if (combineMethod) {
            arg.combineMethod = combineMethod.value;
          }
        } else {
          groupByColumns = _groupByColumns();
          if (groupByColumns.length) {
            arg.groupByColumns = groupByColumns;
          }
        }
        return _.insertAndExecuteCell('cs', 'imputeColumn ' + JSON.stringify(arg));
      };
      _.requestFrames(_, function (error, frames) {
        var frame = void 0;
        if (error) {
          // empty
          // TODO handle properly
        } else {
          _frames(function () {
            var _i = void 0;
            var _len = void 0;
            var _results = [];
            for (_i = 0, _len = frames.length; _i < _len; _i++) {
              frame = frames[_i];
              if (!frame.is_text) {
                _results.push(frame.frame_id.name);
              }
            }
            return _results;
          }());
          if (opts.frame) {
            _frame(opts.frame);
          }
        }
      });
      Flow.Dataflow.react(_frame, function (frame) {
        if (frame) {
          return _.requestFrameSummaryWithoutData(_, frame, function (error, frame) {
            var column = void 0;
            if (error) {
              // empty
              // TODO handle properly
            } else {
              _columns(function () {
                var _i = void 0;
                var _len = void 0;
                var _ref = frame.columns;
                var _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  column = _ref[_i];
                  _results.push(column.label);
                }
                return _results;
              }());
              if (opts.column) {
                _column(opts.column);
                return delete opts.column; // HACK
              }
            }
          });
        }
        return _columns([]);
      });
      lodash.defer(_go);
      return {
        frames: _frames,
        frame: _frame,
        hasFrame: _hasFrame,
        columns: _columns,
        column: _column,
        methods: _methods,
        method: _method,
        canUseCombineMethod: _canUseCombineMethod,
        combineMethods: _combineMethods,
        combineMethod: _combineMethod,
        canGroupByColumns: _canGroupByColumns,
        groupByColumns: _groupByColumns,
        canImpute: _canImpute,
        impute: impute,
        template: 'flow-impute-input'
      };
    }

    function getGridRequest(_, key, opts, go) {
      var params = void 0;
      params = void 0;
      if (opts) {
        params = {};
        if (opts.sort_by) {
          params.sort_by = encodeURIComponent(opts.sort_by);
        }
        if (opts.decreasing === true || opts.decreasing === false) {
          params.decreasing = opts.decreasing;
        }
      }
      return doGet(_, composePath('/99/Grids/' + encodeURIComponent(key), params), go);
    }

    function getPredictionsRequest(_, modelKey, frameKey, _go) {
      var go = function go(error, result) {
        var prediction = void 0;
        if (error) {
          return _go(error);
        }
        //
        // TODO workaround for a filtering bug in the API
        //
        var predictions = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref = result.model_metrics;
          var _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            prediction = _ref[_i];
            if (modelKey && prediction.model.name !== modelKey) {
              _results.push(null);
            } else if (frameKey && prediction.frame.name !== frameKey) {
              _results.push(null);
            } else {
              _results.push(prediction);
            }
          }
          return _results;
        }();
        return _go(null, function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = predictions.length; _i < _len; _i++) {
            prediction = predictions[_i];
            if (prediction) {
              _results.push(prediction);
            }
          }
          return _results;
        }());
      };
      if (modelKey && frameKey) {
        return doGet(_, '/3/ModelMetrics/models/' + encodeURIComponent(modelKey) + '/frames/\'' + encodeURIComponent(frameKey), go);
      } else if (modelKey) {
        return doGet(_, '/3/ModelMetrics/models/' + encodeURIComponent(modelKey), go);
      } else if (frameKey) {
        return doGet(_, '/3/ModelMetrics/frames/' + encodeURIComponent(frameKey), go);
      }
      return doGet(_, '/3/ModelMetrics', go);
    }

    function getRDDsRequest(_, go) {
      return doGet(_, '/3/RDDs', go);
    }

    function getDataFramesRequest(_, go) {
      return doGet(_, '/3/dataframes', go);
    }

    function postScalaIntpRequest(_, go) {
      return doPost(_, '/3/scalaint', {}, go);
    }

    function postScalaCodeRequest(_, sessionId, code, go) {
      return doPost(_, '/3/scalaint/' + sessionId, { code: code }, go);
    }

    function postAsH2OFrameFromRDDRequest(_, rddId, name, go) {
      if (name === void 0) {
        return doPost(_, '/3/RDDs/' + rddId + '/h2oframe', {}, go);
      }
      return doPost(_, '/3/RDDs/' + rddId + '/h2oframe', { h2oframe_id: name }, go);
    }

    function postAsH2OFrameFromDFRequest(_, dfId, name, go) {
      if (name === void 0) {
        return doPost(_, '/3/dataframes/' + dfId + '/h2oframe', {}, go);
      }
      return doPost(_, '/3/dataframes/' + dfId + '/h2oframe', { h2oframe_id: name }, go);
    }

    function postAsDataFrameRequest(_, hfId, name, go) {
      if (name === void 0) {
        return doPost(_, '/3/h2oframes/' + hfId + '/dataframe', {}, go);
      }
      return doPost(_, '/3/h2oframes/' + hfId + '/dataframe', { dataframe_id: name }, go);
    }

    var flowPrelude$2 = flowPreludeFunction();

    function routines() {
      var lodash = window._;
      var $ = window.jQuery;
      var Flow = window.Flow;
      var H2O = window.H2O;
      var __slice = [].slice;
      var lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
      if (lightning.settings) {
        lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
        lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
      }
      H2O.Routines = function (_) {
        var attrname = void 0;
        var f = void 0;
        var routinesOnSw = void 0;

        // TODO move these into Flow.Async
        var _isFuture = Flow.Async.isFuture;
        var _async = Flow.Async.async;
        var _get = Flow.Async.get;

        var render_ = function render_() {
          var raw = arguments[0];
          var render = arguments[1];
          var args = arguments.length >= 3 ? __slice.call(arguments, 2) : [];
          // Prepend current context (_) and a continuation (go)
          flow_(raw).render = function (go) {
            return render.apply(undefined, toConsumableArray([_, go].concat(args)));
          };
          return raw;
        };
        var extendPlot = function extendPlot(vis) {
          return render_(vis, h2oPlotOutput, vis.element);
        };
        var createPlot = function createPlot(f, go) {
          if (lodash.isFunction(f)) {
            return _plot(f(lightning), function (error, vis) {
              if (error) {
                return go(error);
              }
              return go(null, extendPlot(vis));
            });
          }
        };
        var inspect = function inspect(a, b) {
          if (arguments.length === 1) {
            return inspect$1(a);
          }
          return inspect$2(a, b);
        };
        var inspect$1 = function inspect$1(obj) {
          var attr = void 0;
          var inspections = void 0;
          var _ref1 = void 0;
          if (_isFuture(obj)) {
            return _async(inspect, obj);
          }
          var inspectors = void 0;
          if (obj != null) {
            _ref1 = obj._flow_;
            if (_ref1 != null) {
              inspectors = _ref1.inspect;
            }
          }
          if (inspectors) {
            inspections = [];
            for (attr in inspectors) {
              if ({}.hasOwnProperty.call(inspectors, attr)) {
                f = inspectors[attr];
                inspections.push(inspect$2(attr, obj));
              }
            }
            render_(inspections, h2oInspectsOutput, inspections);
            return inspections;
          }
          return {};
        };
        var inspect$2 = function inspect$2(attr, obj) {
          var inspection = void 0;
          if (!attr) {
            return;
          }
          if (_isFuture(obj)) {
            return _async(inspect, attr, obj);
          }
          if (!obj) {
            return;
          }
          var root = obj._flow_;
          if (!root) {
            return;
          }
          var inspectors = root.inspect;
          if (!inspectors) {
            return;
          }
          var key = 'inspect_' + attr;
          var cached = root._cache_[key];
          if (cached) {
            return cached;
          }
          f = inspectors[attr];
          if (!f) {
            return;
          }
          if (!lodash.isFunction(f)) {
            return;
          }
          root._cache_[key] = inspection = f();
          render_(inspection, h2oInspectOutput, inspection);
          return inspection;
        };
        var plot = function plot(f) {
          if (_isFuture(f)) {
            return _fork(proceed, _, h2oPlotInput, f);
          } else if (lodash.isFunction(f)) {
            return _fork(createPlot, f);
          }
          return assist(plot);
        };
        // depends on `plot`
        var grid = function grid(f) {
          return plot(function (g) {
            return g(g.select(), g.from(f));
          });
        };

        // depends on `grid`
        var extendGrid = function extendGrid(grid, opts) {
          var origin = void 0;
          origin = 'getGrid ' + flowPrelude$2.stringify(grid.grid_id.name);
          if (opts) {
            origin += ', ' + flowPrelude$2.stringify(opts);
          }
          var inspections = {
            summary: inspectTwoDimTable_(origin, 'summary', grid.summary_table),
            scoring_history: inspectTwoDimTable_(origin, 'scoring_history', grid.scoring_history)
          };
          inspect_(grid, inspections);
          return render_(grid, h2oGridOutput, grid);
        };
        // abstracting this out produces an error
        // defer for now
        // the call to the `render_` function is the problematic part
        var extendPredictions = function extendPredictions(opts, predictions) {
          render_(predictions, h2oPredictsOutput, opts, predictions);
          return predictions;
        };
        // depends on `assist`
        var createFrame = function createFrame(opts) {
          if (opts) {
            return _fork(requestCreateFrame, _, opts);
          }
          return assist(createFrame);
        };
        // depends on `assist`
        var splitFrame = function splitFrame(frameKey, splitRatios, splitKeys, seed) {
          if (seed == null) {
            seed = -1;
          }
          if (frameKey && splitRatios && splitKeys) {
            return _fork(requestSplitFrame, _, frameKey, splitRatios, splitKeys, seed);
          }
          return assist(splitFrame);
        };
        // depends on `assist`
        var mergeFrames = function mergeFrames(destinationKey, leftFrameKey, leftColumnIndex, includeAllLeftRows, rightFrameKey, rightColumnIndex, includeAllRightRows) {
          if (destinationKey && leftFrameKey && rightFrameKey) {
            return _fork(requestMergeFrames, _, destinationKey, leftFrameKey, leftColumnIndex, includeAllLeftRows, rightFrameKey, rightColumnIndex, includeAllRightRows);
          }
          return assist(mergeFrames);
        };

        // depends on `assist`
        // define the function that is called when
        // the Partial Dependence plot input form
        // is submitted
        var buildPartialDependence = function buildPartialDependence(opts) {
          if (opts) {
            return _fork(requestPartialDependence, _, opts);
          }
          // specify function to call if user
          // provides malformed input
          return assist(buildPartialDependence);
        };
        // depends on `assist`
        var getPartialDependence = function getPartialDependence(destinationKey) {
          if (destinationKey) {
            return _fork(requestPartialDependenceData, _, destinationKey);
          }
          return assist(getPartialDependence);
        };
        var buildRoomscaleScatterplot = function buildRoomscaleScatterplot(options) {
          if (options) {
            return _fork(showRoomscaleScatterplot, _, options);
          }
          return assist(buildRoomscaleScatterplot);
        };
        // depends on `assist`
        var getFrame = function getFrame(frameKey) {
          switch (flowPrelude$2.typeOf(frameKey)) {
            case 'String':
              return _fork(requestFrame, _, frameKey);
            default:
              return assist(getFrame);
          }
        };
        // blocked by CoffeeScript codecell `_` issue
        // has multiple parameters
        var bindFrames = function bindFrames(key, sourceKeys) {
          return _fork(requestBindFrames, _, key, sourceKeys);
        };
        // depends on `assist`
        var getFrameSummary = function getFrameSummary(frameKey) {
          switch (flowPrelude$2.typeOf(frameKey)) {
            case 'String':
              return _fork(requestFrameSummary, _, frameKey);
            default:
              return assist(getFrameSummary);
          }
        };
        // depends on `assist`
        var getFrameData = function getFrameData(frameKey) {
          switch (flowPrelude$2.typeOf(frameKey)) {
            case 'String':
              return _fork(requestFrameData, _, frameKey, void 0, 0, 20);
            default:
              return assist(getFrameSummary);
          }
        };
        // depends on `assist`
        var deleteFrame = function deleteFrame(frameKey) {
          if (frameKey) {
            return _fork(requestDeleteFrame, _, frameKey);
          }
          return assist(deleteFrame);
        };

        // depends on `assist`
        var exportFrame = function exportFrame(frameKey, path, opts) {
          if (opts == null) {
            opts = {};
          }
          if (frameKey && path) {
            return _fork(requestExportFrame, _, frameKey, path, opts);
          }
          return assist(exportFrame, frameKey, path, opts);
        };
        // depends on `assist`
        var deleteFrames = function deleteFrames(frameKeys) {
          switch (frameKeys.length) {
            case 0:
              return assist(deleteFrames);
            case 1:
              return deleteFrame(lodash.head(frameKeys));
            default:
              return _fork(requestDeleteFrames, _, frameKeys);
          }
        };
        // blocked by CoffeeScript codecell `_` issue - multiple parameters
        var getColumnSummary = function getColumnSummary(frameKey, columnName) {
          return _fork(requestColumnSummary, _, frameKey, columnName);
        };
        // blocked by CoffeeScript codecell `_` issue - multiple parameters
        var getModels = function getModels(modelKeys) {
          if (lodash.isArray(modelKeys)) {
            if (modelKeys.length) {
              return _fork(requestModelsByKeys, _, modelKeys);
            }
            return _fork(requestModels, _);
          }
          return _fork(requestModels, _);
        };
        // depends on `assist`
        var getModel = function getModel(modelKey) {
          switch (flowPrelude$2.typeOf(modelKey)) {
            case 'String':
              return _fork(requestModel, _, modelKey);
            default:
              return assist(getModel);
          }
        };
        // depends on `extendGrid`
        var requestGrid = function requestGrid(gridKey, opts, go) {
          return getGridRequest(_, gridKey, opts, function (error, grid) {
            if (error) {
              return go(error);
            }
            return go(null, extendGrid(grid, opts));
          });
        };
        // depends on `assist`
        var getGrid = function getGrid(gridKey, opts) {
          switch (flowPrelude$2.typeOf(gridKey)) {
            case 'String':
              return _fork(requestGrid, gridKey, opts);
            default:
              return assist(getGrid);
          }
        };
        // depends on `assist`
        var imputeColumn = function imputeColumn(opts) {
          if (opts && opts.frame && opts.column && opts.method) {
            return _fork(requestImputeColumn, _, opts);
          }
          return assist(imputeColumn, opts);
        };
        // depends on `assist`
        var changeColumnType = function changeColumnType(opts) {
          if (opts && opts.frame && opts.column && opts.type) {
            return _fork(requestChangeColumnType, _, opts);
          }
          return assist(changeColumnType, opts);
        };
        // depends on `assist`
        var deleteModel = function deleteModel(modelKey) {
          if (modelKey) {
            return _fork(requestDeleteModel, _, modelKey);
          }
          return assist(deleteModel);
        };

        // depends on `assist`
        var importModel = function importModel(path, opts) {
          if (path && path.length) {
            return _fork(requestImportModel, _, path, opts);
          }
          return assist(importModel, path, opts);
        };

        // depends on `assist`
        var exportModel = function exportModel(modelKey, path, opts) {
          if (modelKey && path) {
            return _fork(requestExportModel, _, modelKey, path, opts);
          }
          return assist(exportModel, modelKey, path, opts);
        };
        // depends on `assist`
        var deleteModels = function deleteModels(modelKeys) {
          switch (modelKeys.length) {
            case 0:
              return assist(deleteModels);
            case 1:
              return deleteModel(lodash.head(modelKeys));
            default:
              return _fork(requestDeleteModels, _, modelKeys);
          }
        };
        // depends on `assist`
        var getJob = function getJob(arg) {
          switch (flowPrelude$2.typeOf(arg)) {
            case 'String':
              return _fork(requestJob, _, arg);
            case 'Object':
              if (arg.key != null) {
                return getJob(arg.key);
              }
              return assist(getJob);
            // break; // no-unreachable
            default:
              return assist(getJob);
          }
        };
        // depends on `assist`
        var cancelJob = function cancelJob(arg) {
          switch (flowPrelude$2.typeOf(arg)) {
            case 'String':
              return _fork(requestCancelJob, _, arg);
            default:
              return assist(cancelJob);
          }
        };
        // abstracting this out causes an error
        // defer for now
        var requestImportFiles = function requestImportFiles(paths, go) {
          return _.requestImportFiles(paths, function (error, importResults) {
            if (error) {
              return go(error);
            }
            return go(null, extendImportResults(_, importResults));
          });
        };
        // depends on `assist`
        var importFiles = function importFiles(paths) {
          switch (flowPrelude$2.typeOf(paths)) {
            case 'Array':
              return _fork(requestImportFiles, paths);
            default:
              return assist(importFiles);
          }
        };
        // depends on `assist`
        var setupParse = function setupParse(args) {
          if (args.paths && lodash.isArray(args.paths)) {
            return _fork(requestImportAndParseSetup, _, args.paths);
          } else if (args.source_frames && lodash.isArray(args.source_frames)) {
            return _fork(requestParseSetup, _, args.source_frames);
          }
          return assist(setupParse);
        };
        // blocked by CoffeeScript codecell `_` issue - has arguments
        var parseFiles = function parseFiles(opts) {
          var destinationKey = opts.destination_frame;
          var parseType = opts.parse_type;
          var separator = opts.separator;
          var columnCount = opts.number_columns;
          var useSingleQuotes = opts.single_quotes;
          var columnNames = opts.column_names;
          var columnTypes = opts.column_types;
          var deleteOnDone = opts.delete_on_done;
          var checkHeader = opts.check_header;
          var chunkSize = opts.chunk_size;
          if (opts.paths) {
            return _fork(requestImportAndParseFiles, _, opts.paths, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize);
          }
          return _fork(requestParseFiles, _, opts.source_frames, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize);
        };
        // depends on `assist`
        var buildAutoModel = function buildAutoModel(opts) {
          if (opts && lodash.keys(opts).length > 1) {
            return _fork(requestAutoModelBuild, _, opts);
          }
          return assist(buildAutoModel, opts);
        };
        // depends on `assist`
        var buildModel = function buildModel(algo, opts) {
          if (algo && opts && lodash.keys(opts).length > 1) {
            return _fork(requestModelBuild, _, algo, opts);
          }
          return assist(buildModel, algo, opts);
        };
        // depends on `extendPredictions`
        var requestPredicts = function requestPredicts(opts, go) {
          var futures = lodash.map(opts, function (opt) {
            var modelKey = opt.model;
            var frameKey = opt.frame;
            var options = opt.options;
            return _fork(_.requestPredict, _, null, modelKey, frameKey, options || {});
          });
          return Flow.Async.join(futures, function (error, predictions) {
            if (error) {
              return go(error);
            }
            return go(null, extendPredictions(opts, predictions));
          });
        };
        // depends on `assist`
        var predict = function predict(opts) {
          var combos = void 0;
          var frame = void 0;
          var frames = void 0;
          var model = void 0;
          var models = void 0;
          var _i = void 0;
          var _j = void 0;
          var _len = void 0;
          var _len1 = void 0;
          if (opts == null) {
            opts = {};
          }
          // eslint-disable-next-line camelcase
          var predictions_frame = opts.predictions_frame;
          model = opts.model;
          models = opts.models;
          frame = opts.frame;
          frames = opts.frames;
          // eslint-disable-next-line camelcase
          var reconstruction_error = opts.reconstruction_error;
          // eslint-disable-next-line camelcase
          var deep_features_hidden_layer = opts.deep_features_hidden_layer;
          // eslint-disable-next-line camelcase
          var leaf_node_assignment = opts.leaf_node_assignment;
          // eslint-disable-next-line camelcase
          var exemplar_index = opts.exemplar_index;
          if (models || frames) {
            if (!models) {
              if (model) {
                models = [model];
              }
            }
            if (!frames) {
              if (frame) {
                frames = [frame];
              }
            }
            if (frames && models) {
              combos = [];
              for (_i = 0, _len = models.length; _i < _len; _i++) {
                model = models[_i];
                for (_j = 0, _len1 = frames.length; _j < _len1; _j++) {
                  frame = frames[_j];
                  combos.push({
                    model: model,
                    frame: frame
                  });
                }
              }
              return _fork(requestPredicts, combos);
            }
            return assist(predict, {
              predictions_frame: predictions_frame,
              models: models,
              frames: frames
            });
          }
          if (model && frame) {
            return _fork(requestPredict, _, predictions_frame, model, frame, {
              reconstruction_error: reconstruction_error,
              deep_features_hidden_layer: deep_features_hidden_layer,
              leaf_node_assignment: leaf_node_assignment
            });
          } else if (model && exemplar_index !== void 0) {
            // eslint-disable-line camelcase
            return _fork(requestPredict, _, predictions_frame, model, null, { exemplar_index: exemplar_index });
          }
          return assist(predict, {
            predictions_frame: predictions_frame,
            model: model,
            frame: frame
          });
        };
        // depends on `extendPredictions`
        var requestPredictions = function requestPredictions(opts, go) {
          if (lodash.isArray(opts)) {
            var futures = lodash.map(opts, function (opt) {
              var modelKey = opt.model;
              var frameKey = opt.frame;
              return _fork(getPredictionsRequest, _, modelKey, frameKey);
            });
            return Flow.Async.join(futures, function (error, predictions) {
              if (error) {
                return go(error);
              }
              var uniquePredictions = lodash.values(lodash.indexBy(lodash.flatten(predictions, true), function (prediction) {
                return prediction.model.name + prediction.frame.name;
              }));
              return go(null, extendPredictions(opts, uniquePredictions));
            });
          }
          var modelKey = opts.model;
          var frameKey = opts.frame;
          return getPredictionsRequest(_, modelKey, frameKey, function (error, predictions) {
            if (error) {
              return go(error);
            }
            return go(null, extendPredictions(opts, predictions));
          });
        };
        // blocked by CoffeeScript codecell `_` issue - has arguments
        var getPrediction = function getPrediction(opts) {
          if (opts == null) {
            opts = {};
          }
          // eslint-disable-next-line camelcase
          var predictions_frame = opts.predictions_frame;
          var model = opts.model;
          var frame = opts.frame;
          if (model && frame) {
            return _fork(requestPrediction, _, model, frame);
          }
          return assist(getPrediction, {
            predictions_frame: predictions_frame,
            model: model,
            frame: frame
          });
        };
        // blocked by CoffeeScript codecell `_` issue - has arguements
        var getPredictions = function getPredictions(opts) {
          if (opts == null) {
            opts = {};
          }
          return _fork(requestPredictions, opts);
        };
        // blocked by CoffeeScript codecell `_` issue - has arguements
        var getLogFile = function getLogFile(nodeIndex, fileType) {
          if (nodeIndex == null) {
            nodeIndex = -1;
          }
          if (fileType == null) {
            fileType = 'info';
          }
          return _fork(requestLogFile, _, nodeIndex, fileType);
        };
        //
        // start Sparkling Water Routines
        //

        // Sparkling Water Routines are hard to test
        // since we have to build h2o-3
        // then also build Sparkling Water
        // everytime we want to make a change to here that interacts
        // with Sparkling Water
        // this takes about 4 minutes each time
        // for that reason, defer abstracting these routines out
        var extendRDDs = function extendRDDs(rdds) {
          render_(rdds, h2oRDDsOutput, rdds);
          return rdds;
        };
        var requestRDDs = function requestRDDs(go) {
          return getRDDsRequest(_, function (error, result) {
            if (error) {
              return go(error);
            }
            return go(null, extendRDDs(result.rdds));
          });
        };
        var getRDDs = function getRDDs() {
          return _fork(requestRDDs);
        };
        var extendDataFrames = function extendDataFrames(dataframes) {
          render_(dataframes, h2oDataFramesOutput, dataframes);
          return dataframes;
        };
        var requestDataFrames = function requestDataFrames(go) {
          return getDataFramesRequest(_, function (error, result) {
            if (error) {
              return go(error);
            }
            return go(null, extendDataFrames(result.dataframes));
          });
        };
        var getDataFrames = function getDataFrames() {
          return _fork(requestDataFrames);
        };
        var extendAsH2OFrame = function extendAsH2OFrame(result) {
          render_(result, h2oH2OFrameOutput, result);
          return result;
        };
        // eslint-disable-next-line camelcase
        var requestAsH2OFrameFromRDD = function requestAsH2OFrameFromRDD(rddId, name, go) {
          return postAsH2OFrameFromRDDRequest(_, rddId, name, function (error, h2oframe_id) {
            if (error) {
              return go(error);
            }
            return go(null, extendAsH2OFrame(h2oframe_id));
          });
        };
        var asH2OFrameFromRDD = function asH2OFrameFromRDD(rddId, name) {
          if (name == null) {
            name = void 0;
          }
          return _fork(requestAsH2OFrameFromRDD, rddId, name);
        };
        var requestAsH2OFrameFromDF = function requestAsH2OFrameFromDF(dfId, name, go) {
          return postAsH2OFrameFromDFRequest(_, dfId, name, function (error, result) {
            if (error) {
              return go(error);
            }
            return go(null, extendAsH2OFrame(result));
          });
        };
        var asH2OFrameFromDF = function asH2OFrameFromDF(dfId, name) {
          if (name == null) {
            name = void 0;
          }
          return _fork(requestAsH2OFrameFromDF, dfId, name);
        };
        var extendAsDataFrame = function extendAsDataFrame(result) {
          render_(result, h2oDataFrameOutput, result);
          return result;
        };
        var requestAsDataFrame = function requestAsDataFrame(hfId, name, go) {
          return postAsDataFrameRequest(_, hfId, name, function (error, result) {
            if (error) {
              return go(error);
            }
            return go(null, extendAsDataFrame(result));
          });
        };
        var asDataFrame = function asDataFrame(hfId, name) {
          if (name == null) {
            name = void 0;
          }
          return _fork(requestAsDataFrame, hfId, name);
        };
        var requestScalaCode = function requestScalaCode(session_id, code, go) {
          // eslint-disable-line camelcase
          return postScalaCodeRequest(_, session_id, code, function (error, result) {
            if (error) {
              return go(error);
            }
            return go(null, extendScalaCode(result));
          });
        };
        var extendScalaCode = function extendScalaCode(result) {
          render_(result, h2oScalaCodeOutput, result);
          return result;
        };
        var runScalaCode = function runScalaCode(session_id, code) {
          // eslint-disable-line camelcase
          return _fork(requestScalaCode, session_id, code);
        };
        var requestScalaIntp = function requestScalaIntp(go) {
          return postScalaIntpRequest(_, function (error, result) {
            if (error) {
              return go(error);
            }
            return go(null, extendScalaIntp(result));
          });
        };
        var extendScalaIntp = function extendScalaIntp(result) {
          render_(result, h2oScalaIntpOutput, result);
          return result;
        };
        var getScalaIntp = function getScalaIntp() {
          return _fork(requestScalaIntp);
        };
        //
        // end Sparkling Water Routines
        //
        var getProfile = function getProfile(opts) {
          if (!opts) {
            opts = { depth: 10 };
          }
          return _fork(requestProfile, _, opts.depth);
        };
        // `loadScript` is not used anywhere else
        // but could be called from a codecell in Flow
        var loadScript = function loadScript(path, go) {
          var onDone = function onDone(script, status) {
            return go(null, {
              script: script,
              status: status
            });
          };
          var onFail = function onFail(jqxhr, settings, error) {
            return go(error);
          };
          return $.getScript(path).done(onDone).fail(onFail);
        };
        // `dumpFuture` is not used anywhere else
        // but could be called from a codecell in Flow
        var dumpFuture = function dumpFuture(result, go) {
          if (result == null) {
            result = {};
          }
          console.debug(result);
          return go(null, render_(result, Flow.objectBrowser, 'dump', result));
        };
        // `dump` is not used anywhere else
        // but could be called from a codecell in Flow
        var dump = function dump(f) {
          if (f != null ? f.isFuture : void 0) {
            return _fork(dumpFuture, f);
          }
          return Flow.Async.async(function () {
            return f;
          });
        };
        // abstracting this out produces errors
        // defer for now
        var assist = function assist() {
          var func = arguments[0];
          var args = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
          if (func === void 0) {
            return _fork(proceed, _, h2oAssist, [_assistance]);
          }
          switch (func) {
            case importFiles:
              return _fork(proceed, _, h2oImportFilesInput, []);
            case buildModel:
              return _fork(proceed, _, h2oModelInput, args);
            case buildAutoModel:
              return _fork(proceed, _, h2oAutoModelInput, args);
            case predict:
            case getPrediction:
              return _fork(proceed, _, h2oPredictInput, args);
            case createFrame:
              return _fork(proceed, _, h2oCreateFrameInput, args);
            case splitFrame:
              return _fork(proceed, _, h2oSplitFrameInput, args);
            case mergeFrames:
              return _fork(proceed, _, h2oMergeFramesInput, args);
            case buildPartialDependence:
              return _fork(proceed, _, h2oPartialDependenceInput, args);
            case exportFrame:
              return _fork(proceed, _, h2oExportFrameInput, args);
            case imputeColumn:
              return _fork(proceed, _, h2oImputeInput, args);
            case importModel:
              return _fork(proceed, _, h2oImportModelInput, args);
            case exportModel:
              return _fork(proceed, _, h2oExportModelInput, args);
            case buildRoomscaleScatterplot:
              return _fork(proceed, _, roomscaleScatterplotInput, args);
            default:
              return _fork(proceed, _, h2oNoAssist, []);
          }
        };
        Flow.Dataflow.link(_.ready, function () {
          Flow.Dataflow.link(_.ls, ls);
          Flow.Dataflow.link(_.inspect, inspect);
          Flow.Dataflow.link(_.plot, function (plot) {
            return plot(lightning);
          });
          Flow.Dataflow.link(_.grid, function (frame) {
            return lightning(lightning.select(), lightning.from(frame));
          });
          Flow.Dataflow.link(_.enumerate, function (frame) {
            return lightning(lightning.select(0), lightning.from(frame));
          });
          Flow.Dataflow.link(_.requestFrameDataE, requestFrameData);
          return Flow.Dataflow.link(_.requestFrameSummarySliceE, requestFrameSummarySlice);
        });
        var initAssistanceSparklingWater = function initAssistanceSparklingWater() {
          _assistance.getRDDs = {
            description: 'Get a list of Spark\'s RDDs',
            icon: 'table'
          };
          _assistance.getDataFrames = {
            description: 'Get a list of Spark\'s data frames',
            icon: 'table'
          };
        };
        Flow.Dataflow.link(_.initialized, function () {
          if (_.onSparklingWater) {
            return initAssistanceSparklingWater();
          }
        });
        var routines = {
          //
          // fork/join
          //
          fork: _fork,
          join: _join,
          call: _call,
          apply: _apply,
          isFuture: _isFuture,
          //
          // Dataflow
          //
          signal: Flow.Dataflow.signal,
          signals: Flow.Dataflow.signals,
          isSignal: Flow.Dataflow.isSignal,
          act: Flow.Dataflow.act,
          react: Flow.Dataflow.react,
          lift: Flow.Dataflow.lift,
          merge: Flow.Dataflow.merge,
          //
          // Generic
          //
          dump: dump,
          inspect: inspect,
          plot: plot,
          grid: grid,
          get: _get,
          //
          // Meta
          //
          assist: assist,
          //
          // GUI
          //
          gui: gui,
          //
          // Util
          //
          loadScript: loadScript,
          //
          // H2O
          //
          getJobs: getJobs,
          getJob: getJob,
          cancelJob: cancelJob,
          importFiles: importFiles,
          setupParse: setupParse,
          parseFiles: parseFiles,
          createFrame: createFrame,
          splitFrame: splitFrame,
          mergeFrames: mergeFrames,
          buildPartialDependence: buildPartialDependence,
          buildRoomscaleScatterplot: buildRoomscaleScatterplot,
          showRoomscaleScatterplot: showRoomscaleScatterplot,
          getPartialDependence: getPartialDependence,
          getFrames: getFrames,
          getFrame: getFrame,
          bindFrames: bindFrames,
          getFrameSummary: getFrameSummary,
          getFrameData: getFrameData,
          deleteFrames: deleteFrames,
          deleteFrame: deleteFrame,
          exportFrame: exportFrame,
          getColumnSummary: getColumnSummary,
          changeColumnType: changeColumnType,
          imputeColumn: imputeColumn,
          buildModel: buildModel,
          buildAutoModel: buildAutoModel,
          getGrids: getGrids,
          getModels: getModels,
          getModel: getModel,
          getGrid: getGrid,
          deleteModels: deleteModels,
          deleteModel: deleteModel,
          importModel: importModel,
          exportModel: exportModel,
          predict: predict,
          getPrediction: getPrediction,
          getPredictions: getPredictions,
          getCloud: getCloud,
          getTimeline: getTimeline,
          getProfile: getProfile,
          getStackTrace: getStackTrace,
          getLogFile: getLogFile,
          testNetwork: testNetwork,
          deleteAll: deleteAll
        };
        if (_.onSparklingWater) {
          routinesOnSw = {
            getDataFrames: getDataFrames,
            getRDDs: getRDDs,
            getScalaIntp: getScalaIntp,
            runScalaCode: runScalaCode,
            asH2OFrameFromRDD: asH2OFrameFromRDD,
            asH2OFrameFromDF: asH2OFrameFromDF,
            asDataFrame: asDataFrame
          };
          for (attrname in routinesOnSw) {
            if ({}.hasOwnProperty.call(routinesOnSw, attrname)) {
              routines[attrname] = routinesOnSw[attrname];
            }
          }
        }
        return routines;
      };
    }

    function localStorage() {
      var lodash = window._;
      var Flow = window.Flow;
      if (!(typeof window !== 'undefined' && window !== null ? window.localStorage : void 0)) {
        return;
      }
      var _ls = window.localStorage;
      var keyOf = function keyOf(type, id) {
        return type + ':' + id;
      };
      var list = function list(type) {
        var i = void 0;
        var id = void 0;
        var key = void 0;
        var t = void 0;
        var _i = void 0;
        var _ref = void 0;
        var _ref1 = void 0;
        var objs = [];
        for (i = _i = 0, _ref = _ls.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
          key = _ls.key(i);
          _ref1 = key.split(':');
          t = _ref1[0];
          id = _ref1[1];
          if (type === t) {
            objs.push([type, id, JSON.parse(_ls.getItem(key))]);
          }
        }
        return objs;
      };
      var read = function read(type, id) {
        var raw = _ls.getobj(keyOf(type, id));
        if (raw) {
          return JSON.parse(raw);
        }
        return null;
      };
      var write = function write(type, id, obj) {
        return _ls.setItem(keyOf(type, id), JSON.stringify(obj));
      };
      var purge = function purge(type, id) {
        if (id) {
          return _ls.removeItem(keyOf(type, id));
        }
        return purgeAll(type);
      };
      var purgeAll = function purgeAll(type) {
        var i = void 0;
        var key = void 0;
        var _i = void 0;
        var _len = void 0;
        var allKeys = function () {
          var _i = void 0;
          var _ref = void 0;
          var _results = [];
          for (i = _i = 0, _ref = _ls.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
            _results.push(_ls.key(i));
          }
          return _results;
        }();
        for (_i = 0, _len = allKeys.length; _i < _len; _i++) {
          key = allKeys[_i];
          if (type === lodash.head(key.split(':'))) {
            _ls.removeItem(key);
          }
        }
      };
      Flow.LocalStorage = {
        list: list,
        read: read,
        write: write,
        purge: purge
      };
    }

    //
    // Custom Knockout.js binding handlers
    //
    // init:
    //   This will be called when the binding is first applied to an element
    //   Set up any initial state, event handlers, etc. here
    //
    // update:
    //   This will be called once when the binding is first applied to an element,
    //    and again whenever the associated observable changes value.
    //   Update the DOM element based on the supplied values here.
    //
    // Registering a callback on the disposal of an element
    //
    // To register a function to run when a node is removed,
    // you can call ko.utils.domNodeDisposal.addDisposeCallback(node, callback).
    // As an example, suppose you create a custom binding to instantiate a widget.
    // When the element with the binding is removed,
    // you may want to call the destroy method of the widget:
    //
    // ko.bindingHandlers.myWidget = {
    //     init: function(element, valueAccessor) {
    //         var options = ko.unwrap(valueAccessor()),
    //             $el = $(element);
    //
    //         $el.myWidget(options);
    //
    //         ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
    //             // This will be called when the element is removed by Knockout or
    //             // if some other part of your code calls ko.removeNode(element)
    //             $el.myWidget("destroy");
    //         });
    //     }
    // };
    //

    function knockout() {
      var lodash = window._;
      var $ = window.jQuery;
      var CodeMirror = window.CodeMirror;
      var ko = window.ko;
      var marked = window.marked;
      if ((typeof window !== 'undefined' && window !== null ? window.ko : void 0) == null) {
        return;
      }
      ko.bindingHandlers.raw = {
        update: function update(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var $element = void 0;
          var arg = ko.unwrap(valueAccessor());
          if (arg) {
            $element = $(element);
            $element.empty();
            $element.append(arg);
          }
        }
      };
      ko.bindingHandlers.markdown = {
        update: function update(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var error = void 0;
          var html = void 0;
          var data = ko.unwrap(valueAccessor());
          try {
            html = marked(data || '');
          } catch (_error) {
            error = _error;
            html = error.message || 'Error rendering markdown.';
          }
          return $(element).html(html);
        }
      };
      ko.bindingHandlers.stringify = {
        update: function update(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var data = ko.unwrap(valueAccessor());
          return $(element).text(JSON.stringify(data, null, 2));
        }
      };
      ko.bindingHandlers.enterKey = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var $element = void 0;
          var action = ko.unwrap(valueAccessor());
          if (action) {
            if (lodash.isFunction(action)) {
              $element = $(element);
              $element.keydown(function (e) {
                if (e.which === 13) {
                  action(viewModel);
                }
              });
            } else {
              throw new Error('Enter key action is not a function');
            }
          }
        }
      };
      ko.bindingHandlers.typeahead = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var $element = void 0;
          var action = ko.unwrap(valueAccessor());
          if (action) {
            if (lodash.isFunction(action)) {
              $element = $(element);
              $element.typeahead(null, {
                displayKey: 'value',
                source: action
              });
            } else {
              throw new Error('Typeahead action is not a function');
            }
          }
        }
      };
      ko.bindingHandlers.cursorPosition = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var arg = ko.unwrap(valueAccessor());
          if (arg) {
            // Bit of a hack.
            // Attaches a method to the bound object that returns the cursor position.
            // Uses dwieeb/jquery-textrange.
            arg.getCursorPosition = function () {
              return $(element).textrange('get', 'position');
            };
          }
        }
      };
      ko.bindingHandlers.autoResize = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var $el = void 0;
          var arg = ko.unwrap(valueAccessor());
          var resize = void 0;
          if (arg) {
            // Bit of a hack.
            // Attaches a method to the bound object that resizes the element to fit its content.
            arg.autoResize = resize = function resize() {
              return lodash.defer(function () {
                return $el.css('height', 'auto').height(element.scrollHeight);
              });
            };
            $el = $(element).on('input', resize);
            resize();
          }
        }
      };
      ko.bindingHandlers.scrollIntoView = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var $el = void 0;
          var $viewport = void 0;
          var arg = ko.unwrap(valueAccessor());
          if (arg) {
            // Bit of a hack.
            // Attaches a method to the bound object that scrolls the cell into view
            $el = $(element);
            $viewport = $el.closest('.flow-box-notebook');
            arg.scrollIntoView = function (immediate) {
              if (immediate == null) {
                immediate = false;
              }
              var position = $viewport.scrollTop();
              var top = $el.position().top + position;
              var height = $viewport.height();
              // scroll if element is outside the viewport
              if (top - 20 < position || top + 20 > position + height) {
                if (immediate) {
                  return $viewport.scrollTop(top);
                }
                return $viewport.animate({ scrollTop: top }, 'fast');
              }
            };
          }
        }
      };
      ko.bindingHandlers.collapse = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var isCollapsed = void 0;
          var caretDown = 'fa-caret-down';
          var caretRight = 'fa-caret-right';
          isCollapsed = ko.unwrap(valueAccessor());
          var caretEl = document.createElement('i');
          caretEl.className = 'fa';
          caretEl.style.marginRight = '3px';
          element.insertBefore(caretEl, element.firstChild);
          var $el = $(element);
          var $nextEl = $el.next();
          if (!$nextEl.length) {
            throw new Error('No collapsible sibling found');
          }
          var $caretEl = $(caretEl);
          var toggle = function toggle() {
            if (isCollapsed) {
              $caretEl.removeClass(caretDown).addClass(caretRight);
              $nextEl.hide();
            } else {
              $caretEl.removeClass(caretRight).addClass(caretDown);
              $nextEl.show();
            }
            isCollapsed = !isCollapsed;
            return isCollapsed;
          };
          $el.css('cursor', 'pointer');
          $el.attr('title', 'Click to expand/collapse');
          $el.on('click', toggle);
          toggle();
          ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            return $el.off('click');
          });
        }
      };
      ko.bindingHandlers.dom = {
        update: function update(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var $element = void 0;
          var arg = ko.unwrap(valueAccessor());
          if (arg) {
            $element = $(element);
            $element.empty();
            $element.append(arg);
          }
        }
      };
      ko.bindingHandlers.dump = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var object = ko.unwrap(valueAccessor());
          return object;
        }
      };
      ko.bindingHandlers.element = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          return valueAccessor()(element);
        }
      };
      ko.bindingHandlers.file = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var $file = void 0;
          var file = valueAccessor();
          if (file) {
            $file = $(element);
            $file.change(function () {
              return file(this.files[0]);
            });
          }
        }
      };
      ko.bindingHandlers.codemirror = {
        init: function init(element, valueAccessor, allBindings, viewModel, bindingContext) {
          // get the code mirror options
          var options = ko.unwrap(valueAccessor());
          // created editor replaces the textarea on which it was created
          var editor = CodeMirror.fromTextArea(element, options);
          editor.on('change', function (cm) {
            return allBindings().value(cm.getValue());
          });
          element.editor = editor;
          if (allBindings().value()) {
            editor.setValue(allBindings().value());
          }
          var internalTextArea = $(editor.getWrapperElement()).find('div textarea');
          internalTextArea.attr('rows', '1');
          internalTextArea.attr('spellcheck', 'false');
          internalTextArea.removeAttr('wrap');
          return editor.refresh();
        },
        update: function update(element, valueAccessor) {
          if (element.editor) {
            return element.editor.refresh();
          }
        }
      };
    }

    function html() {
      var lodash = window._;
      var Flow = window.Flow;
      var diecut = window.diecut;
      if ((typeof window !== 'undefined' && window !== null ? window.diecut : void 0) == null) {
        return;
      }
      Flow.HTML = {
        template: diecut,
        render: function render(name, html) {
          var el = document.createElement(name);
          if (html) {
            if (lodash.isString(html)) {
              el.innerHTML = html;
            } else {
              el.appendChild(html);
            }
          }
          return el;
        }
      };
    }

    function format() {
      var lodash = window._;
      var Flow = window.Flow;
      var d3 = window.d3;
      var formatTime = void 0;
      var significantDigitsBeforeDecimal = function significantDigitsBeforeDecimal(value) {
        return 1 + Math.floor(Math.log(Math.abs(value)) / Math.LN10);
      };
      var Digits = function Digits(digits, value) {
        if (value === 0) {
          return 0;
        }
        var sd = significantDigitsBeforeDecimal(value);
        if (sd >= digits) {
          return value.toFixed(0);
        }
        var magnitude = Math.pow(10, digits - sd);
        return Math.round(value * magnitude) / magnitude;
      };
      if (typeof exports === 'undefined' || exports === null) {
        formatTime = d3.time.format('%Y-%m-%d %H:%M:%S');
      }
      var formatDate = function formatDate(time) {
        if (time) {
          return formatTime(new Date(time));
        }
        return '-';
      };
      var __formatReal = {};
      var formatReal = function formatReal(precision) {
        var cached = __formatReal[precision];
        //
        // will leave the nested ternary statement commented for now
        // may be useful to confirm later that the translation to an if else block
        // was an accurate translation
        //
        // const format = cached ? cached : __formatReal[precision] = precision === -1 ? lodash.identity : d3.format(`.${precision}f`);
        var format = void 0;
        if (cached) {
          format = cached;
        } else {
          __formatReal[precision] = precision;
          // __formatReal[precision] === -1 ? lodash.identity : d3.format(`.${precision}f`);
          if (__formatReal[precision] === -1) {
            format = lodash.identity;
          } else {
            format = d3.format('.' + precision + 'f');
          }
        }
        return function (value) {
          return format(value);
        };
      };
      Flow.Format = {
        Digits: Digits,
        Real: formatReal,
        Date: formatDate,
        time: formatTime
      };
    }

    function error() {
      var Flow = window.Flow;
      var printStackTrace = window.printStackTrace;
      var __hasProp = {}.hasOwnProperty;

      var __extends = function __extends(child, parent) {
        var key = void 0;
        for (key in parent) {
          if (__hasProp.call(parent, key)) {
            child[key] = parent[key];
          }
        }
        function Ctor() {
          this.constructor = child;
        }
        Ctor.prototype = parent.prototype;
        child.prototype = new Ctor();
        child.__super__ = parent.prototype;
        return child;
      };

      var FlowError = function (_super) {
        __extends(FlowError, _super);
        function FlowError(message, cause) {
          var error = void 0;
          var _ref = this.cause;
          this.message = message;
          this.cause = cause;
          this.name = 'FlowError';
          if (typeof this.cause !== 'undefined') {
            if (typeof this.cause.stack !== 'undefined') {
              this.stack = this.cause.stack;
            }
          } else {
            error = new Error();
            if (error.stack) {
              this.stack = error.stack;
            } else {
              this.stack = printStackTrace();
            }
          }
        }
        return FlowError;
      }(Error);
      Flow.Error = FlowError;
    }

    function multilineTextToHTML(text) {
      var lodash = window._;
      var EOL = '\n';
      return lodash.map(text.split(EOL), function (str) {
        return lodash.escape(str);
      }).join('<br/>');
    }

    function flowConfirmDialog(_, _message, _opts, _go) {
      var lodash = window._;
      var Flow = window.Flow;
      if (_opts == null) {
        _opts = {};
      }
      lodash.defaults(_opts, {
        title: 'Confirm',
        acceptCaption: 'Yes',
        declineCaption: 'No'
      });
      var accept = function accept() {
        return _go(true);
      };
      var decline = function decline() {
        return _go(false);
      };
      return {
        title: _opts.title,
        acceptCaption: _opts.acceptCaption,
        declineCaption: _opts.declineCaption,
        message: multilineTextToHTML(_message),
        accept: accept,
        decline: decline,
        template: 'confirm-dialog'
      };
    }

    function flowAlertDialog(_, _message, _opts, _go) {
      var lodash = window._;
      var Flow = window.Flow;
      if (_opts == null) {
        _opts = {};
      }
      lodash.defaults(_opts, {
        title: 'Alert',
        acceptCaption: 'OK'
      });
      var accept = function accept() {
        return _go(true);
      };
      return {
        title: _opts.title,
        acceptCaption: _opts.acceptCaption,
        message: multilineTextToHTML(_message),
        accept: accept,
        template: 'alert-dialog'
      };
    }

    function dialogs() {
      var Flow = window.Flow;
      var $ = window.jQuery;
      var __slice = [].slice;
      Flow.dialogs = function (_) {
        var _dialog = Flow.Dataflow.signal(null);
        var showDialog = function showDialog(ctor, args, _go) {
          var dialog = void 0;
          var responded = void 0;
          responded = false;
          _dialog(dialog = ctor.apply(undefined, toConsumableArray([_].concat(args).concat(go))));
          var $dialog = $('#' + dialog.template);
          $dialog.modal();
          $dialog.on('hidden.bs.modal', function (e) {
            if (!responded) {
              responded = true;
              _dialog(null);
              if (_go) {
                return _go(null);
              }
            }
          });
          function go(response) {
            if (!responded) {
              responded = true;
              $dialog.modal('hide');
              if (_go) {
                return _go(response);
              }
            }
          }
        };
        Flow.Dataflow.link(_.dialog, function () {
          var _i = void 0;
          var ctor = arguments[0];
          var args = arguments.length >= 3 ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []);
          var go = arguments[_i++];
          return showDialog(ctor, args, go);
        });
        Flow.Dataflow.link(_.confirm, function (message, opts, go) {
          return showDialog(flowConfirmDialog, [message, opts], go);
        });
        Flow.Dataflow.link(_.alert, function (message, opts, go) {
          return showDialog(flowAlertDialog, [message, opts], go);
        });
        return {
          dialog: _dialog,
          template: function template(dialog) {
            return 'flow-' + dialog.template;
          }
        };
      };
    }

    function createSlot() {
      var lodash = window._;
      var __slice = [].slice;
      var arrow = void 0;
      arrow = null;
      var self = function self() {
        var args = arguments.length >= 1 ? __slice.call(arguments, 0) : [];
        if (arrow) {
          return arrow.func.apply(null, args);
        }
        return void 0;
      };
      self.subscribe = function (func) {
        console.assert(lodash.isFunction(func));
        if (arrow) {
          throw new Error('Cannot re-attach slot');
        } else {
          arrow = {
            func: func,
            dispose: function dispose() {
              arrow = null;
              return arrow;
            }
          };
          return arrow;
        }
      };
      self.dispose = function () {
        if (arrow) {
          return arrow.dispose();
        }
      };
      return self;
    }

    var flowPrelude$63 = flowPreludeFunction();

    function createSlots() {
      var lodash = window._;
      var __slice = [].slice;
      var arrows = [];
      var self = function self() {
        var args = arguments.length >= 1 ? __slice.call(arguments, 0) : [];
        return lodash.map(arrows, function (arrow) {
          return arrow.func.apply(null, args);
        });
      };
      self.subscribe = function (func) {
        var arrow = void 0;
        console.assert(lodash.isFunction(func));
        arrows.push(arrow = {
          func: func,
          dispose: function dispose() {
            return flowPrelude$63.remove(arrows, arrow);
          }
        });
        return arrow;
      };
      self.dispose = function () {
        return lodash.forEach(flowPrelude$63.copy(arrows), function (arrow) {
          return arrow.dispose();
        });
      };
      return self;
    }

    function _link(source, func) {
      var lodash = window._;
      console.assert(lodash.isFunction(source, '[signal] is not a function'));
      console.assert(lodash.isFunction(source.subscribe, '[signal] does not have a [dispose] method'));
      console.assert(lodash.isFunction(func, '[func] is not a function'));
      return source.subscribe(func);
    }

    function _unlink(arrows) {
      var lodash = window._;
      var arrow = void 0;
      var _i = void 0;
      var _len = void 0;
      var _results = void 0;
      if (lodash.isArray(arrows)) {
        _results = [];
        for (_i = 0, _len = arrows.length; _i < _len; _i++) {
          arrow = arrows[_i];
          console.assert(lodash.isFunction(arrow.dispose, '[arrow] does not have a [dispose] method'));
          _results.push(arrow.dispose());
        }
        return _results;
      }
      console.assert(lodash.isFunction(arrows.dispose, '[arrow] does not have a [dispose] method'));
      return arrows.dispose();
    }

    var flowPrelude$65 = flowPreludeFunction();

    function createObservableFunction(initialValue) {
      var lodash = window._;
      var currentValue = void 0;
      var arrows = [];
      currentValue = initialValue;
      var notifySubscribers = function notifySubscribers(arrows, newValue) {
        var arrow = void 0;
        var _i = void 0;
        var _len = void 0;
        for (_i = 0, _len = arrows.length; _i < _len; _i++) {
          arrow = arrows[_i];
          arrow.func(newValue);
        }
      };
      var self = function self(newValue) {
        if (arguments.length === 0) {
          return currentValue;
        }
        var unchanged = self.equalityComparer ? self.equalityComparer(currentValue, newValue) : currentValue === newValue;
        if (!unchanged) {
          currentValue = newValue;
          return notifySubscribers(arrows, newValue);
        }
      };
      self.subscribe = function (func) {
        var arrow = void 0;
        console.assert(lodash.isFunction(func));
        arrows.push(arrow = {
          func: func,
          dispose: function dispose() {
            return flowPrelude$65.remove(arrows, arrow);
          }
        });
        return arrow;
      };
      self.__observable__ = true;
      return self;
    }

    var flowPrelude$64 = flowPreludeFunction();

    function createSignal(value, equalityComparer) {
      var lodash = window._;
      var ko = window.ko;

      // decide if we use knockout observables
      // or Flow custom observables
      var createObservable = void 0;
      if (typeof ko !== 'undefined' && ko !== null) {
        createObservable = ko.observable;
      } else {
        createObservable = createObservableFunction;
      }

      // create the signal
      if (arguments.length === 0) {
        return createSignal(void 0, flowPrelude$64.never);
      }
      var observable = createObservable(value);
      if (lodash.isFunction(equalityComparer)) {
        observable.equalityComparer = equalityComparer;
      }
      return observable;
    }

    function createSignals(array) {
      var ko = window.ko;
      var createObservableArray = void 0;
      if (typeof ko !== 'undefined' && ko !== null) {
        createObservableArray = ko.observableArray;
      } else {
        createObservableArray = createObservableFunction;
      }
      return createObservableArray(array || []);
    }

    function isObservableFunction(obj) {
      if (obj.__observable__) {
        return true;
      }
      return false;
    }

    function _isSignal() {
      var ko = window.ko;
      var isObservable = void 0;
      if (typeof ko !== 'undefined' && ko !== null) {
        isObservable = ko.isObservable;
      } else {
        isObservable = isObservableFunction;
      }
      return isObservable;
    }

    function _apply$1(sources, func) {
      var lodash = window._;
      return func.apply(undefined, toConsumableArray(lodash.map(sources, function (source) {
        return source();
      })));
    }

    function _act() {
      var lodash = window._;
      var __slice = [].slice;
      var _i = void 0;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var sources = args.length >= 2 ? __slice.call(args, 0, _i = args.length - 1) : (_i = 0, []);
      var func = args[_i++];
      _apply$1(sources, func);
      return lodash.map(sources, function (source) {
        return _link(source, function () {
          return _apply$1(sources, func);
        });
      });
    }

    function _react() {
      var lodash = window._;
      var __slice = [].slice;
      var _i = void 0;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var sources = args.length >= 2 ? __slice.call(args, 0, _i = args.length - 1) : (_i = 0, []);
      var func = args[_i++];
      return lodash.map(sources, function (source) {
        return _link(source, function () {
          return _apply$1(sources, func);
        });
      });
    }

    function _lift() {
      var lodash = window._;
      var __slice = [].slice;
      var _i = void 0;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var sources = args.length >= 2 ? __slice.call(args, 0, _i = args.length - 1) : (_i = 0, []);
      var func = args[_i++];
      var evaluate = function evaluate() {
        return _apply$1(sources, func);
      };
      var target = createSignal(evaluate());
      lodash.map(sources, function (source) {
        return _link(source, function () {
          return target(evaluate());
        });
      });
      return target;
    }

    function _merge() {
      var lodash = window._;
      var __slice = [].slice;
      var _i = void 0;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var sources = args.length >= 3 ? __slice.call(args, 0, _i = args.length - 2) : (_i = 0, []);
      var target = args[_i++];
      var func = args[_i++];
      var evaluate = function evaluate() {
        return _apply$1(sources, func);
      };
      target(evaluate());
      return lodash.map(sources, function (source) {
        return _link(source, function () {
          return target(evaluate());
        });
      });
    }

    var flowPrelude$62 = flowPreludeFunction();

    //
    // Reactive programming / Dataflow programming wrapper over knockout
    //
    function dataflow() {
      var Flow = window.Flow;
      Flow.Dataflow = function () {
        return {
          slot: createSlot,
          slots: createSlots,
          signal: createSignal,
          signals: createSignals,
          isSignal: _isSignal,
          link: _link,
          unlink: _unlink,
          act: _act,
          react: _react,
          lift: _lift,
          merge: _merge
        };
      }();
    }

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
    function data() {
      var lodash = window._;
      var Flow = window.Flow;
      var _prototypeId = void 0;
      var __slice = [].slice;
      _prototypeId = 0;
      var nextPrototypeName = function nextPrototypeName() {
        return 'Map' + ++_prototypeId;
      };
      var _prototypeCache = {};
      var createCompiledPrototype = function createCompiledPrototype(attrs) {
        // Since the prototype depends only on attribute names,
        // return a cached prototype, if any.
        var attr = void 0;
        var i = void 0;
        var proto = _prototypeCache[cacheKey];
        var cacheKey = attrs.join('\0');
        if (proto) {
          return proto;
        }
        var params = function () {
          var _i = void 0;
          var _ref = void 0;
          var _results = [];
          for (i = _i = 0, _ref = attrs.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
            _results.push('a' + i);
          }
          return _results;
        }();
        var inits = function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (i = _i = 0, _len = attrs.length; _i < _len; i = ++_i) {
            attr = attrs[i];
            _results.push('this[' + JSON.stringify(attr) + ']=a' + i + ';');
          }
          return _results;
        }();
        var prototypeName = nextPrototypeName();
        _prototypeCache[cacheKey] = new Function('function ' + prototypeName + '(' + params.join(',') + '){' + inits.join('') + '} return ' + prototypeName + ';')(); // eslint-disable-line
        return _prototypeCache[cacheKey];
      };
      var createRecordConstructor = function createRecordConstructor(variables) {
        var variable = void 0;
        return createCompiledPrototype(function () {
          var _i = void 0;
          var _len = void 0;
          var _results = [];
          for (_i = 0, _len = variables.length; _i < _len; _i++) {
            variable = variables[_i];
            _results.push(variable.label);
          }
          return _results;
        }());
      };
      var createTable = function createTable(opts) {
        var description = void 0;
        var label = void 0;
        var variable = void 0;
        var _i = void 0;
        var _len = void 0;
        label = opts.label;
        description = opts.description;
        var variables = opts.variables;
        var rows = opts.rows;
        var meta = opts.meta;
        if (!description) {
          description = 'No description available.';
        }
        var schema = {};
        for (_i = 0, _len = variables.length; _i < _len; _i++) {
          variable = variables[_i];
          schema[variable.label] = variable;
        }
        var fill = function fill(i, go) {
          _fill(i, function (error, result) {
            // eslint-disable-line
            var index = void 0;
            var value = void 0;
            var _j = void 0;
            var _len1 = void 0;
            if (error) {
              return go(error);
            }
            var startIndex = result.index;
            lodash.values = result.values;
            for (index = _j = 0, _len1 = lodash.values.length; _j < _len1; index = ++_j) {
              value = lodash.values[index];
              rows[startIndex + index] = lodash.values[index];
            }
            return go(null);
          });
        };
        var expand = function expand() {
          for (var _len2 = arguments.length, args = Array(_len2), _key = 0; _key < _len2; _key++) {
            args[_key] = arguments[_key];
          }

          var type = void 0;
          var _j = void 0;
          var _len1 = void 0;
          var types = args.length >= 1 ? __slice.call(args, 0) : [];
          var _results = [];
          for (_j = 0, _len1 = types.length; _j < _len1; _j++) {
            type = types[_j];
            // TODO attach to prototype
            label = lodash.uniqueId('__flow_variable_');
            _results.push(schema[label] = createNumericVariable(label));
          }
          return _results;
        };
        return {
          label: label,
          description: description,
          schema: schema,
          variables: variables,
          rows: rows,
          meta: meta,
          fill: fill,
          expand: expand,
          _is_table_: true
        };
      };
      var includeZeroInRange = function includeZeroInRange(range) {
        var lo = range[0];
        var hi = range[1];
        if (lo > 0 && hi > 0) {
          return [0, hi];
        } else if (lo < 0 && hi < 0) {
          return [lo, 0];
        }
        return range;
      };
      var combineRanges = function combineRanges() {
        for (var _len3 = arguments.length, args = Array(_len3), _key2 = 0; _key2 < _len3; _key2++) {
          args[_key2] = arguments[_key2];
        }

        var hi = void 0;
        var lo = void 0;
        var range = void 0;
        var value = void 0;
        var _i = void 0;
        var _len = void 0;
        var ranges = args.length >= 1 ? __slice.call(args, 0) : [];
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
        return [lo, hi];
      };
      var computeRange = function computeRange(rows, attr) {
        var hi = void 0;
        var lo = void 0;
        var row = void 0;
        var value = void 0;
        var _i = void 0;
        var _len = void 0;
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
          return [lo, hi];
        }
        return [-1, 1];
      };
      var permute = function permute(array, indices) {
        var i = void 0;
        var index = void 0;
        var _i = void 0;
        var _len = void 0;
        var permuted = new Array(array.length);
        for (i = _i = 0, _len = indices.length; _i < _len; i = ++_i) {
          index = indices[i];
          permuted[i] = array[index];
        }
        return permuted;
      };
      var createAbstractVariable = function createAbstractVariable(_label, _type, _domain, _format, _read) {
        return {
          label: _label,
          type: _type,
          domain: _domain || [],
          format: _format || lodash.identity,
          read: _read
        };
      };
      function createNumericVariable(_label, _domain, _format, _read) {
        var self = createAbstractVariable(_label, 'Number', _domain || [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY], _format, _read);
        if (!self.read) {
          self.read = function (datum) {
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
      var createVariable = function createVariable(_label, _type, _domain, _format, _read) {
        if (_type === 'Number') {
          return createNumericVariable(_label, _domain, _format, _read);
        }
        return createAbstractVariable(_label, _type, _domain, _format, _read);
      };
      var createFactor = function createFactor(_label, _domain, _format, _read) {
        var level = void 0;
        var _i = void 0;
        var _id = void 0;
        var _len = void 0;
        var _ref = void 0;
        var self = createAbstractVariable(_label, 'Factor', _domain || [], _format, _read);
        _id = 0;
        var _levels = {};
        if (self.domain.length) {
          _ref = self.domain;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            level = _ref[_i];
            _levels[level] = _id++;
          }
        }
        if (!self.read) {
          self.read = function (datum) {
            var id = void 0;
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
      var factor = function factor(array) {
        var i = void 0;
        var id = void 0;
        var level = void 0;
        var _i = void 0;
        var _id = void 0;
        var _len = void 0;
        _id = 0;
        var levels = {};
        var domain = [];
        var data = new Array(array.length);
        for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
          level = array[i];
          id = levels[level];
          if (void 0 === id) {
            levels[level] = id = _id++;
            domain.push(level);
          }
          data[i] = id;
        }
        return [domain, data];
      };
      Flow.Data = {
        Table: createTable,
        Variable: createVariable,
        Factor: createFactor,
        computeColumnInterpretation: function computeColumnInterpretation(type) {
          if (type === 'Number') {
            return 'c';
          } else if (type === 'Factor') {
            return 'd';
          }
          return 't';
        },

        Record: createRecordConstructor,
        computeRange: computeRange,
        combineRanges: combineRanges,
        includeZeroInRange: includeZeroInRange,
        factor: factor,
        permute: permute
      };
    }

    var flowPrelude$66 = flowPreludeFunction();

    function async() {
      var lodash = window._;
      var Flow = window.Flow;
      var __slice = [].slice;
      var createBuffer = function createBuffer(array) {
        var _go = void 0;
        var _array = array || [];
        _go = null;
        var buffer = function buffer(element) {
          if (element === void 0) {
            return _array;
          }
          _array.push(element);
          if (_go) {
            _go(element);
          }
          return element;
        };
        buffer.subscribe = function (go) {
          _go = go;
          return _go;
        };
        buffer.buffer = _array;
        buffer.isBuffer = true;
        return buffer;
      };
      var _noop = function _noop(go) {
        return go(null);
      };
      var _applicate = function _applicate(go) {
        return function (error, args) {
          if (lodash.isFunction(go)) {
            return go.apply(undefined, toConsumableArray([error].concat(args)));
          }
        };
      };
      var _fork = function _fork(f, args) {
        if (!lodash.isFunction(f)) {
          throw new Error('Not a function.');
        }
        var self = function self(go) {
          var canGo = lodash.isFunction(go);
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
            return _join(args, function (error, args) {
              if (error) {
                self.error = error;
                self.fulfilled = false;
                self.rejected = true;
                if (canGo) {
                  return go(error);
                }
              } else {
                return f.apply(undefined, toConsumableArray(args.concat(function (error, result) {
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
                })));
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
      var _isFuture = function _isFuture(a) {
        if (a != null ? a.isFuture : void 0) {
          return true;
        }
        return false;
      };
      function _join(args, go) {
        var arg = void 0;
        var i = void 0;
        var _actual = void 0;
        var _i = void 0;
        var _len = void 0;
        var _settled = void 0;
        if (args.length === 0) {
          return go(null, []);
        }
        var _tasks = [];
        var _results = [];
        for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
          arg = args[i];
          if (arg != null ? arg.isFuture : void 0) {
            _tasks.push({
              future: arg,
              resultIndex: i
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
        lodash.forEach(_tasks, function (task) {
          return task.future.call(null, function (error, result) {
            if (_settled) {
              return;
            }
            if (error) {
              _settled = true;
              go(new Flow.Error('Error evaluating future[' + task.resultIndex + ']', error));
            } else {
              _results[task.resultIndex] = result;
              _actual++;
              if (_actual === _tasks.length) {
                _settled = true;
                go(null, _results);
              }
            }
          });
        });
      }
      // Like _.compose, but async.
      // Equivalent to caolan/async.waterfall()
      var pipe = function pipe(tasks) {
        var _tasks = tasks.slice(0);
        var next = function next(args, go) {
          var task = _tasks.shift();
          if (task) {
            return task.apply(undefined, toConsumableArray(args.concat(function () {
              var error = arguments[0];
              var results = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
              if (error) {
                return go(error);
              }
              return next(results, go);
            })));
          }
          return go.apply(undefined, toConsumableArray([null].concat(args)));
        };
        return function () {
          var _i = void 0;
          var args = arguments.length >= 2 ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []);
          var go = arguments[_i++];
          return next(args, go);
        };
      };
      var iterate = function iterate(tasks) {
        var _tasks = tasks.slice(0);
        var _results = [];
        var next = function next(go) {
          var task = _tasks.shift();
          if (task) {
            return task(function (error, result) {
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
        return function (go) {
          return next(go);
        };
      };

      //
      // Gives a synchronous operation an asynchronous signature.
      // Used to pass synchronous functions to callers that expect
      // asynchronous signatures.
      //
      var _async = function _async() {
        var f = arguments[0];
        var args = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
        var later = function later() {
          var error = void 0;
          var result = void 0;
          var _i = void 0;
          var args = arguments.length >= 2 ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []);
          var go = arguments[_i++];
          try {
            result = f.apply(undefined, toConsumableArray(args));
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
      var _find$3 = function _find$3(attr, prop, obj) {
        var v = void 0;
        var _i = void 0;
        var _len = void 0;
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
      var _find$2 = function _find$2(attr, obj) {
        if (_isFuture(obj)) {
          return _async(_find$2, attr, obj);
        } else if (lodash.isString(attr)) {
          if (lodash.isArray(obj)) {
            return _find$3('name', attr, obj);
          }
          return obj[attr];
        }
      };
      var _find = function _find() {
        var a = void 0;
        var b = void 0;
        var c = void 0;
        var ta = void 0;
        var tb = void 0;
        var tc = void 0;
        var args = arguments.length >= 1 ? __slice.call(arguments, 0) : [];
        switch (args.length) {
          case 3:
            a = args[0];
            b = args[1];
            c = args[2];
            ta = flowPrelude$66.typeOf(a);
            tb = flowPrelude$66.typeOf(b);
            tc = flowPrelude$66.typeOf(c);
            if (ta === 'Array' && tb === 'String') {
              return _find$3(b, c, a);
            } else if (ta === 'String' && tc === 'Array') {
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
      var _get = function _get(attr, obj) {
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
        createBuffer: createBuffer, // XXX rename
        noop: _noop,
        applicate: _applicate,
        isFuture: _isFuture,
        fork: _fork,
        join: _join,
        pipe: pipe,
        iterate: iterate,
        async: _async,
        find: _find,
        get: _get
      };
    }

    var flowPrelude$67 = flowPreludeFunction();

    function objectBrowser() {
      var lodash = window._;
      var Flow = window.Flow;
      var isExpandable = function isExpandable(type) {
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
      var previewArray = function previewArray(array) {
        var element = void 0;
        var ellipsis = array.length > 5 ? ', ...' : '';
        var previews = function () {
          var _i = void 0;
          var _len = void 0;
          var _ref = lodash.head(array, 5);
          var _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            element = _ref[_i];
            _results.push(preview(element));
          }
          return _results;
        }();
        return '[' + previews.join(', ') + ellipsis + ']';
      };
      var previewObject = function previewObject(object) {
        var count = void 0;
        var key = void 0;
        var value = void 0;
        count = 0;
        var previews = [];
        var ellipsis = '';
        for (key in object) {
          if ({}.hasOwnProperty.call(object, key)) {
            value = object[key];
            if (!(key !== '_flow_')) {
              continue;
            }
            previews.push(key + ': ' + preview(value));
            if (++count === 5) {
              ellipsis = ', ...';
              break;
            }
          }
        }
        return '{' + previews.join(', ') + ellipsis + '}';
      };
      var preview = function preview(element, recurse) {
        if (recurse == null) {
          recurse = false;
        }
        var type = flowPrelude$67.typeOf(element);
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
      Flow.objectBrowserElement = function (key, object) {
        var _expansions = Flow.Dataflow.signal(null);
        var _isExpanded = Flow.Dataflow.signal(false);
        var _type = flowPrelude$67.typeOf(object);
        var _canExpand = isExpandable(_type);
        var toggle = function toggle() {
          var expansions = void 0;
          var value = void 0;
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
          key: key,
          preview: preview(object, true),
          toggle: toggle,
          expansions: _expansions,
          isExpanded: _isExpanded,
          canExpand: _canExpand
        };
      };
      Flow.objectBrowser = function (_, _go, key, object) {
        lodash.defer(_go);
        return {
          object: Flow.objectBrowserElement(key, object),
          template: 'flow-object'
        };
      };
    }

    function getEndpointsRequest(_, go) {
      return doGet(_, '/3/Metadata/endpoints', go);
    }

    function getEndpointRequest(_, index, go) {
      return doGet(_, '/3/Metadata/endpoints/' + index, go);
    }

    function getSchemasRequest(_, go) {
      return doGet(_, '/3/Metadata/schemas', go);
    }

    function getSchemaRequest(_, name, go) {
      return doGet(_, '/3/Metadata/schemas/' + encodeURIComponent(name), go);
    }

    function getLines(data) {
      var lodash = window._;
      return lodash.filter(data.split('\n'), function (line) {
        if (line.trim()) {
          return true;
        }
        return false;
      });
    }

    function requestPacks(go) {
      return download$1('text', '/flow/packs/index.list', unwrap(go, getLines));
    }

    function requestPack(packName, go) {
      return download$1('text', '/flow/packs/' + encodeURIComponent(packName) + '/index.list', unwrap(go, getLines));
    }

    function requestFlow(packName, flowName, go) {
      return download$1('json', '/flow/packs/' + encodeURIComponent(packName) + '/' + encodeURIComponent(flowName), go);
    }

    function requestHelpIndex(go) {
      return download$1('json', '/flow/help/catalog.json', go);
    }

    function requestHelpContent(name, go) {
      return download$1('text', '/flow/help/' + name + '.html', go);
    }

    function validateFileExtension(filename, extension) {
      return filename.indexOf(extension, filename.length - extension.length) !== -1;
    }

    function sanitizeName(name) {
      return name.replace(/[^a-z0-9_ \(\)-]/gi, '-').trim();
    }

    function getFileBaseName(filename, extension) {
      return sanitizeName(filename.substr(0, filename.length - extension.length));
    }

    function help() {
      var lodash = window._;
      var Flow = window.Flow;
      var H2O = window.H2O;
      var marked = window.marked;
      var $ = window.jQuery;
      var _catalog = void 0;
      var _homeContent = void 0;
      _catalog = null;
      var _index = {};
      _homeContent = null;
      var _homeMarkdown = '<blockquote>\nUsing Flow for the first time?\n<br/>\n<div style=\'margin-top:10px\'>\n  <button type=\'button\' data-action=\'get-flow\' data-pack-name=\'examples\' data-flow-name=\'QuickStartVideos.flow\' class=\'flow-button\'><i class=\'fa fa-file-movie-o\'></i><span>Quickstart Videos</span>\n  </button>\n</div>\n</blockquote>\n\nOr, <a href=\'#\' data-action=\'get-pack\' data-pack-name=\'examples\'>view example Flows</a> to explore and learn H<sub>2</sub>O.\n\n###### Star H2O on Github!\n\n<iframe src="https://ghbtns.com/github-btn.html?user=h2oai&repo=h2o-3&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>\n\n###### General\n\n%HELP_TOPICS%\n\n###### Examples\n\nFlow packs are a great way to explore and learn H<sub>2</sub>O. Try out these Flows and run them in your browser.<br/><a href=\'#\' data-action=\'get-packs\'>Browse installed packs...</a>\n\n###### H<sub>2</sub>O REST API\n\n- <a href=\'#\' data-action=\'endpoints\'>Routes</a>\n- <a href=\'#\' data-action=\'schemas\'>Schemas</a>\n';
      Flow.help = function (_) {
        var _historyIndex = void 0;
        var _content = Flow.Dataflow.signal(null);
        var _history = [];
        _historyIndex = -1;
        var _canGoBack = Flow.Dataflow.signal(false);
        var _canGoForward = Flow.Dataflow.signal(false);
        var goTo = function goTo(index) {
          var content = _history[_historyIndex = index];
          $('a, button', $(content)).each(function (i) {
            var $a = $(this);
            var action = $a.attr('data-action');
            if (action) {
              return $a.click(function () {
                return performAction(action, $a);
              });
            }
          });
          _content(content);
          _canGoForward(_historyIndex < _history.length - 1);
          _canGoBack(_historyIndex > 0);
        };
        var goBack = function goBack() {
          if (_historyIndex > 0) {
            return goTo(_historyIndex - 1);
          }
        };
        var goForward = function goForward() {
          if (_historyIndex < _history.length - 1) {
            return goTo(_historyIndex + 1);
          }
        };
        var displayHtml = function displayHtml(content) {
          if (_historyIndex < _history.length - 1) {
            _history.splice(_historyIndex + 1, _history.length - (_historyIndex + 1), content);
          } else {
            _history.push(content);
          }
          return goTo(_history.length - 1);
        };
        var fixImageSources = function fixImageSources(html) {
          return html.replace(/\s+src\s*=\s*"images\//g, ' src="help/images/');
        };
        function performAction(action, $el) {
          var packName = void 0;
          var routeIndex = void 0;
          var schemaName = void 0;
          var topic = void 0;
          switch (action) {
            case 'help':
              topic = _index[$el.attr('data-topic')];
              requestHelpContent(topic.name, function (error, html) {
                var _ref = Flow.HTML.template('div', 'mark', 'h5', 'h6');
                var div = _ref[0];
                var mark = _ref[1];
                var h5 = _ref[2];
                var h6 = _ref[3];
                var contents = [mark('Help'), h5(topic.title), fixImageSources(div(html))];
                if (topic.children.length) {
                  contents.push(h6('Topics'));
                  contents.push(buildToc(topic.children));
                }
                return displayHtml(Flow.HTML.render('div', div(contents)));
              });
              break;
            case 'assist':
              _.insertAndExecuteCell('cs', 'assist');
              break;
            case 'get-packs':
              requestPacks(function (error, packNames) {
                if (!error) {
                  return displayPacks(lodash.filter(packNames, function (packName) {
                    return packName !== 'test';
                  }));
                }
              });
              break;
            case 'get-pack':
              packName = $el.attr('data-pack-name');
              requestPack(packName, function (error, flowNames) {
                if (!error) {
                  return displayFlows(packName, flowNames);
                }
              });
              break;
            case 'get-flow':
              _.confirm('This action will replace your active notebook.\nAre you sure you want to continue?', {
                acceptCaption: 'Load Notebook',
                declineCaption: 'Cancel'
              }, function (accept) {
                var flowName = void 0;
                if (accept) {
                  packName = $el.attr('data-pack-name');
                  flowName = $el.attr('data-flow-name');
                  if (validateFileExtension(flowName, '.flow')) {
                    return requestFlow(packName, flowName, function (error, flow) {
                      if (!error) {
                        return _.open(getFileBaseName(flowName, '.flow'), flow);
                      }
                    });
                  }
                }
              });
              break;
            case 'endpoints':
              getEndpointsRequest(_, function (error, response) {
                if (!error) {
                  return displayEndpoints(response.routes);
                }
              });
              break;
            case 'endpoint':
              routeIndex = $el.attr('data-index');
              getEndpointRequest(_, routeIndex, function (error, response) {
                if (!error) {
                  return displayEndpoint(lodash.head(response.routes));
                }
              });
              break;
            case 'schemas':
              getSchemasRequest(_, function (error, response) {
                if (!error) {
                  return displaySchemas(lodash.sortBy(response.schemas, function (schema) {
                    return schema.name;
                  }));
                }
              });
              break;
            case 'schema':
              schemaName = $el.attr('data-schema');
              getSchemaRequest(_, schemaName, function (error, response) {
                if (!error) {
                  return displaySchema(lodash.head(response.schemas));
                }
              });
              break;
            default:
            // do nothing
          }
        }
        function buildToc(nodes) {
          var _ref = Flow.HTML.template('ul', 'li', 'a href=\'#\' data-action=\'help\' data-topic=\'$1\'');
          var ul = _ref[0];
          var li = _ref[1];
          var a = _ref[2];
          return ul(lodash.map(nodes, function (node) {
            return li(a(node.title, node.name));
          }));
        }
        var buildTopics = function buildTopics(index, topics) {
          var topic = void 0;
          var _i = void 0;
          var _len = void 0;
          for (_i = 0, _len = topics.length; _i < _len; _i++) {
            topic = topics[_i];
            index[topic.name] = topic;
            if (topic.children.length) {
              buildTopics(index, topic.children);
            }
          }
        };
        function displayPacks(packNames) {
          var _ref = Flow.HTML.template('div', 'mark', 'h5', 'p', 'i.fa.fa-folder-o', 'a href=\'#\' data-action=\'get-pack\' data-pack-name=\'$1\'');
          var div = _ref[0];
          var mark = _ref[1];
          var h5 = _ref[2];
          var p = _ref[3];
          var i = _ref[4];
          var a = _ref[5];
          displayHtml(Flow.HTML.render('div', div([mark('Packs'), h5('Installed Packs'), div(lodash.map(packNames, function (packName) {
            return p([i(), a(packName, packName)]);
          }))])));
        }
        function displayFlows(packName, flowNames) {
          var _ref = Flow.HTML.template('div', 'mark', 'h5', 'p', 'i.fa.fa-file-text-o', 'a href=\'#\' data-action=\'get-flow\' data-pack-name=\'' + packName + '\' data-flow-name=\'$1\'');
          var div = _ref[0];
          var mark = _ref[1];
          var h5 = _ref[2];
          var p = _ref[3];
          var i = _ref[4];
          var a = _ref[5];
          displayHtml(Flow.HTML.render('div', div([mark('Pack'), h5(packName), div(lodash.map(flowNames, function (flowName) {
            return p([i(), a(flowName, flowName)]);
          }))])));
        }
        function displayEndpoints(routes) {
          var route = void 0;
          var routeIndex = void 0;
          var _i = void 0;
          var _len = void 0;
          var _ref = Flow.HTML.template('div', 'mark', 'h5', 'p', 'a href=\'#\' data-action=\'endpoint\' data-index=\'$1\'', 'code');
          var div = _ref[0];
          var mark = _ref[1];
          var h5 = _ref[2];
          var p = _ref[3];
          var action = _ref[4];
          var code = _ref[5];
          var els = [mark('API'), h5('List of Routes')];
          for (routeIndex = _i = 0, _len = routes.length; _i < _len; routeIndex = ++_i) {
            route = routes[routeIndex];
            els.push(p(action(code(route.http_method + ' ' + route.url_pattern), routeIndex) + '<br/>' + route.summary));
          }
          displayHtml(Flow.HTML.render('div', div(els)));
        }
        var goHome = function goHome() {
          return displayHtml(Flow.HTML.render('div', _homeContent));
        };
        function displayEndpoint(route) {
          var _ref1 = route.path_params;
          var _ref = Flow.HTML.template('div', 'mark', 'h5', 'h6', 'p', 'a href=\'#\' data-action=\'schema\' data-schema=\'$1\'', 'code');
          var div = _ref[0];
          var mark = _ref[1];
          var h5 = _ref[2];
          var h6 = _ref[3];
          var p = _ref[4];
          var action = _ref[5];
          var code = _ref[6];
          return displayHtml(Flow.HTML.render('div', div([mark('Route'), h5(route.url_pattern), h6('Method'), p(code(route.http_method)), h6('Summary'), p(route.summary), h6('Parameters'), p((_ref1 != null ? _ref1.length : void 0) ? route.path_params.join(', ') : '-'), h6('Input Schema'), p(action(code(route.input_schema), route.input_schema)), h6('Output Schema'), p(action(code(route.output_schema), route.output_schema))])));
        }
        function displaySchemas(schemas) {
          var schema = void 0;
          var _ref = Flow.HTML.template('div', 'h5', 'ul', 'li', 'var', 'mark', 'code', 'a href=\'#\' data-action=\'schema\' data-schema=\'$1\'');
          var div = _ref[0];
          var h5 = _ref[1];
          var ul = _ref[2];
          var li = _ref[3];
          var variable = _ref[4];
          var mark = _ref[5];
          var code = _ref[6];
          var action = _ref[7];
          var els = [mark('API'), h5('List of Schemas'), ul(function () {
            var _i = void 0;
            var _len = void 0;
            var _results = [];
            for (_i = 0, _len = schemas.length; _i < _len; _i++) {
              schema = schemas[_i];
              _results.push(li(action(code(schema.name), schema.name) + ' ' + variable(lodash.escape(schema.type))));
            }
            return _results;
          }())];
          return displayHtml(Flow.HTML.render('div', div(els)));
        }
        function displaySchema(schema) {
          var field = void 0;
          var _i = void 0;
          var _len = void 0;
          var _ref = Flow.HTML.template('div', 'mark', 'h5', 'h6', 'p', 'code', 'var', 'small');
          var div = _ref[0];
          var mark = _ref[1];
          var h5 = _ref[2];
          var h6 = _ref[3];
          var p = _ref[4];
          var code = _ref[5];
          var variable = _ref[6];
          var small = _ref[7];
          var content = [mark('Schema'), h5(schema.name + ' (' + lodash.escape(schema.type) + ')'), h6('Fields')];
          var _ref1 = schema.fields;
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            field = _ref1[_i];
            if (field.name !== '__meta') {
              content.push(p('' + variable(field.name) + (field.required ? '*' : '') + ' ' + code(lodash.escape(field.type)) + '<br/>' + small(field.help)));
            }
          }
          return displayHtml(Flow.HTML.render('div', div(content)));
        }
        var initialize = function initialize(catalog) {
          _catalog = catalog;
          buildTopics(_index, _catalog);
          _homeContent = marked(_homeMarkdown).replace('%HELP_TOPICS%', buildToc(_catalog));
          return goHome();
        };
        Flow.Dataflow.link(_.ready, function () {
          return requestHelpIndex(function (error, catalog) {
            if (!error) {
              return initialize(catalog);
            }
          });
        });
        return {
          content: _content,
          goHome: goHome,
          goBack: goBack,
          canGoBack: _canGoBack,
          goForward: goForward,
          canGoForward: _canGoForward
        };
      };
    }

    function failure() {
      var Flow = window.Flow;
      var traceCauses = function traceCauses(error, causes) {
        causes.push(error.message);
        if (error.cause) {
          traceCauses(error.cause, causes);
        }
        return causes;
      };
      Flow.failure = function (_, error) {
        var causes = traceCauses(error, []);
        var message = causes.shift();
        var _isStackVisible = Flow.Dataflow.signal(false);
        var toggleStack = function toggleStack() {
          return _isStackVisible(!_isStackVisible());
        };
        _.trackException(message + '; ' + causes.join('; '));
        return {
          message: message,
          stack: error.stack,
          causes: causes,
          isStackVisible: _isStackVisible,
          toggleStack: toggleStack,
          template: 'flow-failure'
        };
      };
    }

    function getObjectExistsRequest(_, type, name, go) {
      var urlString = '/3/NodePersistentStorage/categories/' + encodeURIComponent(type) + '/names/' + encodeURIComponent(name) + '/exists';
      return doGet(_, urlString, function (error, result) {
        return go(null, error ? false : result.exists);
      });
    }

    function getObjectRequest(_, type, name, go) {
      var urlString = '/3/NodePersistentStorage/' + encodeURIComponent(type) + '/' + encodeURIComponent(name);
      return doGet(_, urlString, unwrap(go, function (result) {
        return JSON.parse(result.value);
      }));
    }

    function postPutObjectRequest(_, type, name, value, go) {
      var uri = void 0;
      uri = '/3/NodePersistentStorage/' + encodeURIComponent(type);
      if (name) {
        uri += '/' + encodeURIComponent(name);
      }
      return doPost(_, uri, { value: JSON.stringify(value, null, 2) }, unwrap(go, function (result) {
        return result.name;
      }));
    }

    var flowPrelude$68 = flowPreludeFunction();

    function clipboard() {
      var lodash = window._;
      var Flow = window.Flow;
      var SystemClips = ['assist', 'importFiles', 'getFrames', 'getModels', 'getPredictions', 'getJobs', 'buildModel', 'predict'];
      Flow.clipboard = function (_) {
        var lengthOf = function lengthOf(array) {
          if (array.length) {
            return '(' + array.length + ')';
          }
          return '';
        };
        var _systemClips = Flow.Dataflow.signals([]);
        var _systemClipCount = Flow.Dataflow.lift(_systemClips, lengthOf);
        var _userClips = Flow.Dataflow.signals([]);
        var _userClipCount = Flow.Dataflow.lift(_userClips, lengthOf);
        var _hasUserClips = Flow.Dataflow.lift(_userClips, function (clips) {
          return clips.length > 0;
        });
        var _trashClips = Flow.Dataflow.signals([]);
        var _trashClipCount = Flow.Dataflow.lift(_trashClips, lengthOf);
        var _hasTrashClips = Flow.Dataflow.lift(_trashClips, function (clips) {
          return clips.length > 0;
        });
        var createClip = function createClip(_list, _type, _input, _canRemove) {
          if (_canRemove == null) {
            _canRemove = true;
          }
          var execute = function execute() {
            return _.insertAndExecuteCell(_type, _input);
          };
          var insert = function insert() {
            return _.insertCell(_type, _input);
          };
          flowPrelude$68.remove = function () {
            if (_canRemove) {
              return removeClip(_list, self);
            }
          };
          var self = {
            type: _type,
            input: _input,
            execute: execute,
            insert: insert,
            remove: flowPrelude$68.remove,
            canRemove: _canRemove
          };
          return self;
        };
        var addClip = function addClip(list, type, input) {
          return list.push(createClip(list, type, input));
        };
        function removeClip(list, clip) {
          if (list === _userClips) {
            _userClips.remove(clip);
            saveUserClips();
            return _trashClips.push(createClip(_trashClips, clip.type, clip.input));
          }
          return _trashClips.remove(clip);
        }
        var emptyTrash = function emptyTrash() {
          return _trashClips.removeAll();
        };
        var loadUserClips = function loadUserClips() {
          return getObjectExistsRequest(_, 'environment', 'clips', function (error, exists) {
            if (exists) {
              return getObjectRequest(_, 'environment', 'clips', function (error, doc) {
                if (!error) {
                  return _userClips(lodash.map(doc.clips, function (clip) {
                    return createClip(_userClips, clip.type, clip.input);
                  }));
                }
              });
            }
          });
        };
        var serializeUserClips = function serializeUserClips() {
          return {
            version: '1.0.0',

            clips: lodash.map(_userClips(), function (clip) {
              return {
                type: clip.type,
                input: clip.input
              };
            })
          };
        };
        function saveUserClips() {
          return postPutObjectRequest(_, 'environment', 'clips', serializeUserClips(), function (error) {
            if (error) {
              _.alert('Error saving clips: ' + error.message);
            }
          });
        }
        var initialize = function initialize() {
          _systemClips(lodash.map(SystemClips, function (input) {
            return createClip(_systemClips, 'cs', input, false);
          }));
          return Flow.Dataflow.link(_.ready, function () {
            loadUserClips();
            return Flow.Dataflow.link(_.saveClip, function (category, type, input) {
              input = input.trim();
              if (input) {
                if (category === 'user') {
                  addClip(_userClips, type, input);
                  return saveUserClips();
                }
                return addClip(_trashClips, type, input);
              }
            });
          });
        };
        initialize();
        return {
          systemClips: _systemClips,
          systemClipCount: _systemClipCount,
          userClips: _userClips,
          hasUserClips: _hasUserClips,
          userClipCount: _userClipCount,
          trashClips: _trashClips,
          trashClipCount: _trashClipCount,
          hasTrashClips: _hasTrashClips,
          emptyTrash: emptyTrash
        };
      };
    }

    function getAboutRequest(_, go) {
      return doGet(_, '/3/About', go);
    }

    function about() {
      var Flow = window.Flow;
      Flow.Version = '0.6.1';
      Flow.about = function (_) {
        var _properties = Flow.Dataflow.signals([]);
        Flow.Dataflow.link(_.ready, function () {
          if (Flow.BuildProperties) {
            return _properties(Flow.BuildProperties);
          }
          return getAboutRequest(_, function (error, response) {
            var name = void 0;
            var value = void 0;
            var _i = void 0;
            var _len = void 0;
            var _ref = void 0;
            var _ref1 = void 0;
            var properties = [];
            if (!error) {
              _ref = response.entries;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                _ref1 = _ref[_i];
                name = _ref1.name;
                value = _ref1.value;
                properties.push({
                  caption: 'H2O ' + name,
                  value: value
                });
              }
            }
            properties.push({
              caption: 'Flow version',
              value: Flow.Version
            });
            Flow.BuildProperties = properties;
            return _properties(Flow.BuildProperties);
          });
        });
        return { properties: _properties };
      };
    }

    function gui$1() {
      var lodash = window._;
      var Flow = window.Flow;
      var wrapValue = function wrapValue(value, init) {
        if (value === void 0) {
          return Flow.Dataflow.signal(init);
        }
        if (Flow.Dataflow.isSignal(value)) {
          return value;
        }
        return Flow.Dataflow.signal(value);
      };
      var wrapArray = function wrapArray(elements) {
        var element = void 0;
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
      var control = function control(type, opts) {
        if (!opts) {
          opts = {};
        }
        var guid = 'gui_' + lodash.uniqueId();
        return {
          type: type,
          id: opts.id || guid,
          label: Flow.Dataflow.signal(opts.label || ' '),
          description: Flow.Dataflow.signal(opts.description || ' '),
          visible: Flow.Dataflow.signal(opts.visible !== false),
          disable: Flow.Dataflow.signal(opts.disable === true),
          template: 'flow-form-' + type,
          templateOf: function templateOf(control) {
            return control.template;
          }
        };
      };
      var content = function content(type, opts) {
        var self = control(type, opts);
        self.value = wrapValue(opts.value, '');
        return self;
      };
      var text = function text(opts) {
        return content('text', opts);
      };
      var html = function html(opts) {
        return content('html', opts);
      };
      var markdown = function markdown(opts) {
        return content('markdown', opts);
      };
      var checkbox = function checkbox(opts) {
        var self = control('checkbox', opts);
        self.value = wrapValue(opts.value, opts.value);
        return self;
      };

      // TODO ko supports array valued args for 'checked' - can provide a checkboxes function
      var dropdown = function dropdown(opts) {
        var self = control('dropdown', opts);
        self.options = opts.options || [];
        self.value = wrapValue(opts.value);
        self.caption = opts.caption || 'Choose...';
        return self;
      };
      var listbox = function listbox(opts) {
        var self = control('listbox', opts);
        self.options = opts.options || [];
        self.values = wrapArray(opts.values);
        return self;
      };
      var textbox = function textbox(opts) {
        var self = control('textbox', opts);
        self.value = wrapValue(opts.value, '');
        self.event = lodash.isString(opts.event) ? opts.event : null;
        return self;
      };
      var textarea = function textarea(opts) {
        var self = control('textarea', opts);
        self.value = wrapValue(opts.value, '');
        self.event = lodash.isString(opts.event) ? opts.event : null;
        self.rows = lodash.isNumber(opts.rows) ? opts.rows : 5;
        return self;
      };
      var button = function button(opts) {
        var self = control('button', opts);
        self.click = lodash.isFunction(opts.click) ? opts.click : lodash.noop;
        return self;
      };
      Flow.Gui = {
        text: text,
        html: html,
        markdown: markdown,
        checkbox: checkbox,
        dropdown: dropdown,
        listbox: listbox,
        textbox: textbox,
        textarea: textarea,
        button: button
      };
    }

    function h2oApplicationContext(_) {
      var Flow = window.Flow;
      _.requestFileGlob = Flow.Dataflow.slot();
      _.requestSplitFrame = Flow.Dataflow.slot();
      _.requestImportFile = Flow.Dataflow.slot();
      _.requestImportFiles = Flow.Dataflow.slot();
      _.requestFrames = Flow.Dataflow.slot();
      _.requestFrameSlice = Flow.Dataflow.slot();
      _.requestFrameSummary = Flow.Dataflow.slot();
      _.requestFrameDataE = Flow.Dataflow.slot();
      _.requestFrameSummarySliceE = Flow.Dataflow.slot();
      _.requestFrameSummaryWithoutData = Flow.Dataflow.slot();
      _.requestDeleteFrame = Flow.Dataflow.slot();
      _.ls = Flow.Dataflow.slot();
      _.inspect = Flow.Dataflow.slot();
      _.plot = Flow.Dataflow.slot();
      _.grid = Flow.Dataflow.slot();
      _.enumerate = Flow.Dataflow.slot();
      //
      // Sparkling-Water
      //
      _.scalaIntpId = Flow.Dataflow.signal(-1);
    }

    function doUpload(_, path, formData, go) {
      return http(_, 'UPLOAD', path, formData, go);
    }

    function requestSplitFrame$1(_, frameKey, splitRatios, splitKeys, go) {
      var opts = {
        dataset: frameKey,
        ratios: encodeArrayForPost(splitRatios),
        dest_keys: encodeArrayForPost(splitKeys)
      };
      return doPost(_, '/3/SplitFrame', opts, go);
    }

    function requestFrames$1(_, go) {
      return doGet(_, '/3/Frames', function (error, result) {
        if (error) {
          return go(error);
        }
        return go(null, result.frames);
      });
    }

    function requestFrameSummary$1(_, key, go) {
      var lodash = window._;
      doGet(_, '/3/Frames/' + encodeURIComponent(key) + '/summary', unwrap(go, function (result) {
        return lodash.head(result.frames);
      }));
    }

    function requestDeleteFrame$1(_, key, go) {
      doDelete(_, '/3/Frames/' + encodeURIComponent(key), go);
    }

    function requestFileGlob(_, path, limit, go) {
      var opts = {
        src: encodeURIComponent(path),
        limit: limit
      };
      return requestWithOpts(_, '/3/Typeahead/files', opts, go);
    }

    var flowPrelude$69 = flowPreludeFunction();

    function h2oProxy(_) {
      var lodash = window._;
      var Flow = window.Flow;
      var $ = window.jQuery;
      var _storageConfigurations = void 0;

      // abstracting out these two functions
      // produces an error
      // defer for now
      var requestImportFiles = function requestImportFiles(paths, go) {
        var tasks = lodash.map(paths, function (path) {
          return function (go) {
            return requestImportFile(path, go);
          };
        });
        return Flow.Async.iterate(tasks)(go);
      };
      var requestImportFile = function requestImportFile(path, go) {
        var opts = { path: encodeURIComponent(path) };
        return requestWithOpts(_, '/3/ImportFiles', opts, go);
      };

      // setup a __ namespace for our modelBuilders cache
      _.__ = {};
      _.__.modelBuilders = null;
      _.__.modelBuilderEndpoints = null;
      _.__.gridModelBuilderEndpoints = null;
      Flow.Dataflow.link(_.requestSplitFrame, requestSplitFrame$1);
      Flow.Dataflow.link(_.requestFrames, requestFrames$1);
      Flow.Dataflow.link(_.requestFrameSlice, requestFrameSlice);
      Flow.Dataflow.link(_.requestFrameSummary, requestFrameSummary$1);
      Flow.Dataflow.link(_.requestFrameSummaryWithoutData, requestFrameSummaryWithoutData);
      Flow.Dataflow.link(_.requestDeleteFrame, requestDeleteFrame$1);
      Flow.Dataflow.link(_.requestFileGlob, requestFileGlob);
      Flow.Dataflow.link(_.requestImportFiles, requestImportFiles);
      Flow.Dataflow.link(_.requestImportFile, requestImportFile);
    }

    function h2oApplication(_) {
      h2oApplicationContext(_);
      return h2oProxy(_);
    }

    function flowApplicationContext(_) {
      var Flow = window.Flow;
      _.ready = Flow.Dataflow.slots();
      _.initialized = Flow.Dataflow.slots();
      _.open = Flow.Dataflow.slot();
      _.load = Flow.Dataflow.slot();
      _.saved = Flow.Dataflow.slots();
      _.loaded = Flow.Dataflow.slots();
      _.setDirty = Flow.Dataflow.slots();
      _.setPristine = Flow.Dataflow.slots();
      _.status = Flow.Dataflow.slot();
      _.trackEvent = Flow.Dataflow.slot();
      _.trackException = Flow.Dataflow.slot();
      _.selectCell = Flow.Dataflow.slot();
      _.insertCell = Flow.Dataflow.slot();
      _.insertAndExecuteCell = Flow.Dataflow.slot();
      _.executeAllCells = Flow.Dataflow.slot();
      _.showHelp = Flow.Dataflow.slot();
      _.showOutline = Flow.Dataflow.slot();
      _.showBrowser = Flow.Dataflow.slot();
      _.showClipboard = Flow.Dataflow.slot();
      _.saveClip = Flow.Dataflow.slot();
      _.growl = Flow.Dataflow.slot();
      _.confirm = Flow.Dataflow.slot();
      _.alert = Flow.Dataflow.slot();
      _.dialog = Flow.Dataflow.slot();
      return _.dialog;
    }

    function flowSandbox(_, routines) {
      return {
        routines: routines,
        context: {},
        results: {}
      };
    }

    function postEchoRequest(_, message, go) {
      return doPost(_, '/3/LogAndEcho', { message: message }, go);
    }

    function flowAnalytics(_) {
      var lodash = window._;
      var Flow = window.Flow;
      if (typeof window.ga !== 'undefined') {
        Flow.Dataflow.link(_.trackEvent, function (category, action, label, value) {
          return lodash.defer(function () {
            return window.ga('send', 'event', category, action, label, value);
          });
        });
        return Flow.Dataflow.link(_.trackException, function (description) {
          return lodash.defer(function () {
            postEchoRequest(_, 'FLOW: ' + description, function () {});
            return window.ga('send', 'exception', {
              exDescription: description,
              exFatal: false,
              appName: 'Flow',
              appVersion: Flow.Version
            });
          });
        });
      }
    }

    function flowGrowl(_) {
      var Flow = window.Flow;
      var $ = window.jQuery;
      // Type should be one of:
      // undefined = info (blue)
      // success (green)
      // warning (orange)
      // danger (red)
      return Flow.Dataflow.link(_.growl, function (message, type) {
        if (type) {
          return $.bootstrapGrowl(message, { type: type });
        }
        return $.bootstrapGrowl(message);
      });
    }

    function flowAutosave(_) {
      var Flow = window.Flow;
      var warnOnExit = function warnOnExit(e) {
        // message = 'You have unsaved changes to this notebook.'
        var message = 'Warning: you are about to exit Flow.';

        // < IE8 and < FF4
        e = e != null ? e : window.event;
        if (e) {
          e.returnValue = message;
        }
        return message;
      };
      var setDirty = function setDirty() {
        window.onbeforeunload = warnOnExit;
        return window.onbeforeunload;
      };
      var setPristine = function setPristine() {
        window.onbeforeunload = null;
        return window.onbeforeunload;
      };
      return Flow.Dataflow.link(_.ready, function () {
        Flow.Dataflow.link(_.setDirty, setDirty);
        return Flow.Dataflow.link(_.setPristine, setPristine);
      });
    }

    function flowHeading(_, level) {
      var render = function render(input, output) {
        output.data({
          text: input.trim() || '(Untitled)',
          template: 'flow-' + level
        });
        return output.end();
      };
      render.isCode = false;
      return render;
    }

    function flowMarkdown(_) {
      var marked = window.marked;
      var render = function render(input, output) {
        var error = void 0;
        try {
          return output.data({
            html: marked(input.trim() || '(No content)'),
            template: 'flow-html'
          });
        } catch (_error) {
          error = _error;
          return output.error(error);
        } finally {
          output.end();
        }
      };
      render.isCode = false;
      return render;
    }

    function print(arg, guid, sandbox) {
      if (arg !== print) {
        sandbox.results[guid].outputs(arg);
      }
      return print;
    }

    function isRoutine(f, sandbox) {
      var name = void 0;
      var routine = void 0;
      var _ref = sandbox.routines;
      for (name in _ref) {
        if ({}.hasOwnProperty.call(_ref, name)) {
          routine = _ref[name];
          if (f === routine) {
            return true;
          }
        }
      }
      return false;
    }

    function safetyWrapCoffeescript(guid) {
      var lodash = window._;
      return function (cs, go) {
        var lines = cs.replace(/[\n\r]/g, '\n') // normalize CR/LF
        .split('\n'); // split into lines

        // indent once
        var block = lodash.map(lines, function (line) {
          return '  ' + line;
        });

        // enclose in execute-immediate closure
        block.unshift('_h2o_results_[\'' + guid + '\'].result do ->');

        // join and proceed
        return go(null, block.join('\n'));
      };
    }

    function compileCoffeescript(cs, go) {
      var Flow = window.Flow;
      var CoffeeScript = window.CoffeeScript;
      var error = void 0;
      try {
        return go(null, CoffeeScript.compile(cs, { bare: true }));
      } catch (_error) {
        error = _error;
        return go(new Flow.Error('Error compiling coffee-script', error));
      }
    }

    function parseJavascript(js, go) {
      var Flow = window.Flow;
      var esprima = window.esprima;
      var error = void 0;
      try {
        return go(null, esprima.parse(js));
      } catch (_error) {
        error = _error;
        return go(new Flow.Error('Error parsing javascript expression', error));
      }
    }

    function identifyDeclarations(node) {
      var declaration = void 0;
      if (!node) {
        return null;
      }
      switch (node.type) {
        case 'VariableDeclaration':
          return function () {
            var _i = void 0;
            var _len = void 0;
            var _ref = node.declarations;
            var _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              declaration = _ref[_i];
              if (declaration.type === 'VariableDeclarator' && declaration.id.type === 'Identifier') {
                _results.push({
                  name: declaration.id.name,
                  object: '_h2o_context_'
                });
              }
            }
            return _results;
          }();
        case 'FunctionDeclaration':
          //
          // XXX Not sure about the semantics here.
          //
          if (node.id.type === 'Identifier') {
            return [{
              name: node.id.name,
              object: '_h2o_context_'
            }];
          }
          break;
        case 'ForStatement':
          return identifyDeclarations(node.init);
        case 'ForInStatement':
        case 'ForOfStatement':
          return identifyDeclarations(node.left);
        default:
        // do nothing
      }
      return null;
    }

    function parseDeclarations(block) {
      var lodash = window._;
      var declaration = void 0;
      var declarations = void 0;
      var node = void 0;
      var _i = void 0;
      var _j = void 0;
      var _len = void 0;
      var _len1 = void 0;
      var identifiers = [];
      var _ref = block.body;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        declarations = identifyDeclarations(node);
        if (declarations) {
          for (_j = 0, _len1 = declarations.length; _j < _len1; _j++) {
            declaration = declarations[_j];
            identifiers.push(declaration);
          }
        }
      }
      return lodash.indexBy(identifiers, function (identifier) {
        return identifier.name;
      });
    }

    function createRootScope(sandbox) {
      var Flow = window.Flow;
      return function (program, go) {
        var error = void 0;
        var name = void 0;
        var rootScope = void 0;
        try {
          rootScope = parseDeclarations(program.body[0].expression.arguments[0].callee.body);
          for (name in sandbox.context) {
            if ({}.hasOwnProperty.call(sandbox.context, name)) {
              rootScope[name] = {
                name: name,
                object: '_h2o_context_'
              };
            }
          }
          return go(null, rootScope, program);
        } catch (_error) {
          error = _error;
          return go(new Flow.Error('Error parsing root scope', error));
        }
      };
    }

    function traverseJavascript(parent, key, node, f) {
      var lodash = window._;
      var child = void 0;
      var i = void 0;
      if (lodash.isArray(node)) {
        i = node.length;
        // walk backwards to allow callers to delete nodes
        while (i--) {
          child = node[i];
          if (lodash.isObject(child)) {
            traverseJavascript(node, i, child, f);
            f(node, i, child);
          }
        }
      } else {
        for (i in node) {
          if ({}.hasOwnProperty.call(node, i)) {
            child = node[i];
            if (lodash.isObject(child)) {
              traverseJavascript(node, i, child, f);
              f(node, i, child);
            }
          }
        }
      }
    }

    function deleteAstNode(parent, i) {
      var lodash = window._;
      if (lodash.isArray(parent)) {
        return parent.splice(i, 1);
      } else if (lodash.isObject(parent)) {
        return delete parent[i];
      }
    }

    // TODO DO NOT call this for raw javascript:
    // Require alternate strategy:
    //  Declarations with 'var' need to be local to the cell.
    //  Undeclared identifiers are assumed to be global.
    //  'use strict' should be unsupported.
    function removeHoistedDeclarations(rootScope, program, go) {
      var Flow = window.Flow;
      var error = void 0;
      try {
        traverseJavascript(null, null, program, function (parent, key, node) {
          var declarations = void 0;
          if (node.type === 'VariableDeclaration') {
            declarations = node.declarations.filter(function (declaration) {
              return declaration.type === 'VariableDeclarator' && declaration.id.type === 'Identifier' && !rootScope[declaration.id.name];
            });
            if (declarations.length === 0) {
              // purge this node so that escodegen doesn't fail
              return deleteAstNode(parent, key);
            }
            // replace with cleaned-up declarations
            node.declarations = declarations;
            return node.declarations;
          }
        });
        return go(null, rootScope, program);
      } catch (_error) {
        error = _error;
        return go(new Flow.Error('Error rewriting javascript', error));
      }
    }

    function createGlobalScope(rootScope, routines) {
      var identifier = void 0;
      var name = void 0;
      var globalScope = {};
      for (name in rootScope) {
        if ({}.hasOwnProperty.call(rootScope, name)) {
          identifier = rootScope[name];
          globalScope[name] = identifier;
        }
      }
      for (name in routines) {
        if ({}.hasOwnProperty.call(routines, name)) {
          globalScope[name] = {
            name: name,
            object: 'h2o'
          };
        }
      }
      return globalScope;
    }

    function createLocalScope(node) {
      var param = void 0;
      var _i = void 0;
      var _len = void 0;
      // parse all declarations in this scope
      var localScope = parseDeclarations(node.body);

      // include formal parameters
      var _ref = node.params;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        param = _ref[_i];
        if (param.type === 'Identifier') {
          localScope[param.name] = {
            name: param.name,
            object: 'local'
          };
        }
      }
      return localScope;
    }

    // redefine scope by coalescing down to non-local identifiers
    function coalesceScopes(scopes) {
      var i = void 0;
      var identifier = void 0;
      var name = void 0;
      var scope = void 0;
      var _i = void 0;
      var _len = void 0;
      var currentScope = {};
      for (i = _i = 0, _len = scopes.length; _i < _len; i = ++_i) {
        scope = scopes[i];
        if (i === 0) {
          for (name in scope) {
            if ({}.hasOwnProperty.call(scope, name)) {
              identifier = scope[name];
              currentScope[name] = identifier;
            }
          }
        } else {
          for (name in scope) {
            if ({}.hasOwnProperty.call(scope, name)) {
              identifier = scope[name];
              currentScope[name] = null;
            }
          }
        }
      }
      return currentScope;
    }

    function traverseJavascriptScoped(scopes, parentScope, parent, key, node, f) {
      var lodash = window._;
      var child = void 0;
      var currentScope = void 0;
      var isNewScope = node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
      if (isNewScope) {
        // create and push a new local scope onto scope stack
        scopes.push(createLocalScope(node));
        currentScope = coalesceScopes(scopes);
      } else {
        currentScope = parentScope;
      }
      for (key in node) {
        if ({}.hasOwnProperty.call(node, key)) {
          child = node[key];
          if (lodash.isObject(child)) {
            traverseJavascriptScoped(scopes, currentScope, node, key, child, f);
            f(currentScope, node, key, child);
          }
        }
      }
      if (isNewScope) {
        // discard local scope
        scopes.pop();
      }
    }

    function rewriteJavascript(sandbox) {
      var Flow = window.Flow;
      return function (rootScope, program, go) {
        var error = void 0;
        var globalScope = createGlobalScope(rootScope, sandbox.routines);
        try {
          traverseJavascriptScoped([globalScope], globalScope, null, null, program, function (globalScope, parent, key, node) {
            var identifier = void 0;
            if (node.type === 'Identifier') {
              // ignore var declarations
              if (parent.type === 'VariableDeclarator' && key === 'id') {
                return;
              }
              // ignore members
              if (key === 'property') {
                return;
              }
              identifier = globalScope[node.name];
              if (!identifier) {
                return;
              }

              // qualify identifier with '_h2o_context_'
              parent[key] = {
                type: 'MemberExpression',
                computed: false,
                object: {
                  type: 'Identifier',
                  name: identifier.object
                },
                property: {
                  type: 'Identifier',
                  name: identifier.name
                }
              };
              return parent[key];
            }
          });
          return go(null, program);
        } catch (_error) {
          error = _error;
          return go(new Flow.Error('Error rewriting javascript', error));
        }
      };
    }

    function generateJavascript(program, go) {
      var Flow = window.Flow;
      var escodegen = window.escodegen;
      var error = void 0;
      try {
        return go(null, escodegen.generate(program));
      } catch (_error) {
        error = _error;
        return go(new Flow.Error('Error generating javascript', error));
      }
    }

    function compileJavascript(js, go) {
      var Flow = window.Flow;
      var closure = void 0;
      var error = void 0;
      try {
        closure = new Function('h2o', '_h2o_context_', '_h2o_results_', 'print', js); // eslint-disable-line
        return go(null, closure);
      } catch (_error) {
        error = _error;
        return go(new Flow.Error('Error compiling javascript', error));
      }
    }

    function executeJavascript(sandbox, print) {
      var Flow = window.Flow;
      return function (closure, go) {
        var error = void 0;
        try {
          return go(null, closure(sandbox.routines, sandbox.context, sandbox.results, print));
        } catch (_error) {
          error = _error;
          return go(new Flow.Error('Error executing javascript', error));
        }
      };
    }

    function evaluate(_, output, ft) {
      var Flow = window.Flow;
      if (ft != null ? ft.isFuture : void 0) {
        return ft(function (error, result) {
          if (error) {
            output.error(new Flow.Error('Error evaluating cell', error));
            return output.end();
          }
          if (typeof result !== 'undefined') {
            if (typeof result._flow_ !== 'undefined') {
              if (typeof result._flow_.render !== 'undefined') {
                var returnValue = output.data(result._flow_.render(function () {
                  return output.end();
                }));
                return returnValue;
              }
            }
          }
          return output.data(Flow.objectBrowser(_, function () {
            return output.end();
          }('output', result)));
        });
      }
      return output.data(Flow.objectBrowser(_, function () {
        return output.end();
      }, 'output', ft));
    }

    var routinesThatAcceptUnderbarParameter = ['testNetwork', 'getFrames', 'getGrids', 'getCloud', 'getTimeline', 'getStackTrace', 'deleteAll', 'getJobs'];

    function flowCoffeescript(_, guid, sandbox) {
      var _arguments = arguments,
          _this = this;
      var lodash = window._;
      var Flow = window.Flow;
      // abstracting out `render` results in the output code cells
      // not being rendered
      // TODO refactor notebook and then revisit this
      //
      // XXX special-case functions so that bodies are not printed with the raw renderer.
      var render = function render(input, output) {
        var cellResult = void 0;
        var outputBuffer = void 0;
        sandbox.results[guid] = cellResult = {
          result: Flow.Dataflow.signal(null),
          outputs: outputBuffer = Flow.Async.createBuffer([])
        };
        outputBuffer.subscribe(evaluate.bind(_this, _, output));
        var tasks = [safetyWrapCoffeescript(guid), compileCoffeescript, parseJavascript, createRootScope(sandbox), removeHoistedDeclarations, rewriteJavascript(sandbox), generateJavascript, compileJavascript, executeJavascript(sandbox, print)];
        return Flow.Async.pipe(tasks)(input, function (error) {
          if (error) {
            output.error(error);
          }
          var result = cellResult.result();
          // console.log('result.name from tasks pipe', result.name);
          // console.log('result from tasks pipe', result);
          if (lodash.isFunction(result)) {
            if (isRoutine(result, sandbox)) {
              // a hack to gradually migrate routines to accept _ as a parameter
              // rather than expect _ to be a global variable
              if (typeof result !== 'undefined' && routinesThatAcceptUnderbarParameter.indexOf(result.name) > -1) {
                return print(result(_), guid, sandbox);
              }
              return print(result(), guid, sandbox);
            }
            return evaluate(_, output, result);
          }
          return output.close(Flow.objectBrowser(_, function () {
            return output.end();
          }, 'result', result));
        });
      };
      render.isCode = true;
      return render;
    }

    function flowRaw(_) {
      var render = function render(input, output) {
        output.data({
          text: input,
          template: 'flow-raw'
        });
        return output.end();
      };
      render.isCode = false;
      return render;
    }

    function flowRenderers(_, _sandbox) {
      return {
        h1: function h1() {
          return flowHeading(_, 'h1');
        },
        h2: function h2() {
          return flowHeading(_, 'h2');
        },
        h3: function h3() {
          return flowHeading(_, 'h3');
        },
        h4: function h4() {
          return flowHeading(_, 'h4');
        },
        h5: function h5() {
          return flowHeading(_, 'h5');
        },
        h6: function h6() {
          return flowHeading(_, 'h6');
        },
        md: function md() {
          return flowMarkdown(_);
        },
        cs: function cs(guid) {
          return flowCoffeescript(_, guid, _sandbox);
        },
        sca: function sca(guid) {
          return flowCoffeescript(_, guid, _sandbox);
        },
        raw: function raw() {
          return flowRaw(_);
        }
      };
    }

    function serialize(_) {
      var cell = void 0;
      var cells = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = _.cells();
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cell = _ref[_i];
          _results.push({
            type: cell.type(),
            input: cell.input()
          });
        }
        return _results;
      }();
      return {
        version: '1.0.0',
        cells: cells
      };
    }

    function templateOf(view) {
      return view.template;
    }

    function scrollIntoView(_actions, immediate) {
      return _actions.scrollIntoView(immediate);
    }

    function autoResize(_actions) {
      return _actions.autoResize();
    }

    function getCursorPosition(_actions) {
      return _actions.getCursorPosition();
    }

    function formatClockTime(date) {
      var moment = window.moment;
      return moment(date).format('h:mm:ss a');
    }

    function dataFunction(_outputs, result) {
      return _outputs.push(result);
    }

    function closeFunction(_result, result) {
      // XXX push to cell output
      return _result(result);
    }

    function errorFunction(_, _hasError, _outputs, _errors, error) {
      var Flow = window.Flow;
      _hasError(true);
      if (error.name === 'FlowError') {
        // XXX review
        _outputs.push(Flow.failure(_, error));
      } else {
        _outputs.push({
          text: JSON.stringify(error, null, 2),
          template: 'flow-raw'
        });
      }
      // Only for headless use
      return _errors.push(error);
    }

    function format1d0(n) {
      return Math.round(n * 10) / 10;
    }

    function formatElapsedTime(s) {
      var _ref = splitTime(s);
      var hrs = _ref[0];
      var mins = _ref[1];
      var secs = _ref[2];
      var ms = _ref[3];
      if (hrs !== 0) {
        return format1d0((hrs * 60 + mins) / 60) + 'h';
      } else if (mins !== 0) {
        return format1d0((mins * 60 + secs) / 60) + 'm';
      } else if (secs !== 0) {
        return format1d0((secs * 1000 + ms) / 1000) + 's';
      }
      return ms + 'ms';
    }

    function endFunction(_hasInput, _isCode, _isBusy, _time, _hasError, _errors, startTime, go) {
      _hasInput(_isCode());
      _isBusy(false);
      _time(formatElapsedTime(Date.now() - startTime));
      if (go) {
        go(_hasError() ? _errors.slice(0) : null);
      }
    }

    function execute(_, _time, input, _input, _render, _isBusy, clear, _type, _outputs, _result, _hasError, _errors, _hasInput, _isActive, _isCode, go) {
      var startTime = Date.now();
      _time('Started at ' + formatClockTime(startTime));
      input = _input().trim();
      if (!input) {
        if (go) {
          return go(null);
        }
        return void 0;
      }
      var render = _render();
      _isBusy(true);
      clear();
      if (_type() === 'sca') {
        // escape backslashes
        input = input.replace(/\\/g, '\\\\');
        // escape quotes
        input = input.replace(/'/g, '\\\'');
        // escape new-lines
        input = input.replace(/\n/g, '\\n');
        // pass the cell body as an argument, representing the scala code, to the appropriate function
        input = 'runScalaCode ' + _.scalaIntpId() + ', \'' + input + '\'';
      }
      var outputObject = {
        data: dataFunction.bind(this, _outputs),
        close: closeFunction.bind(this, _result),
        error: errorFunction.bind(this, _, _hasError, _outputs, _errors),
        end: endFunction.bind(this, _hasInput, _isCode, _isBusy, _time, _hasError, _errors, startTime, go)
      };
      render(input, outputObject);
      return _isActive(false);
    }

    function clear(_result, _outputs, _errors, _hasError, _isCode, _hasInput) {
      // console.log('arguments from flowCell clear', arguments);
      _result(null);
      _outputs([]);
      // Only for headless use
      _errors.length = 0;
      _hasError(false);
      if (!_isCode()) {
        return _hasInput(true);
      }
    }

    function toggleOutput(_isOutputHidden) {
      return _isOutputHidden(!_isOutputHidden());
    }

    function toggleInput(_isInputVisible) {
      return _isInputVisible(!_isInputVisible());
    }

    function clip(_, _type, _input) {
      return _.saveClip('user', _type(), _input());
    }

    function activate(_isActive) {
      // tied to mouse-double-clicks on html content
      // TODO
      _isActive(true);
    }

    function navigate(_, self) {
      // tied to mouse-clicks in the outline view
      _.selectCell(self);

      // Explicitly return true, otherwise ko will prevent the mouseclick event from bubbling up
      return true;
    }

    function select(_, self) {
      // tied to mouse-clicks on the cell

      // pass scrollIntoView=false,
      // otherwise mouse actions like clicking on a form field will cause scrolling.
      _.selectCell(self, false);
      // Explicitly return true, otherwise ko will prevent the mouseclick event from bubbling up
      return true;
    }

    function flowCell(_, type, input) {
      var lodash = window._;
      var Flow = window.Flow;
      if (type == null) {
        type = 'cs';
      }
      if (input == null) {
        input = '';
      }
      var _guid = lodash.uniqueId();
      var _type = Flow.Dataflow.signal(type);
      var _render = Flow.Dataflow.lift(_type, function (type) {
        return _.renderers[type](_guid);
      });
      var _isCode = Flow.Dataflow.lift(_render, function (render) {
        return render.isCode;
      });
      var _isSelected = Flow.Dataflow.signal(false);
      var _isActive = Flow.Dataflow.signal(false);
      var _hasError = Flow.Dataflow.signal(false);
      var _isBusy = Flow.Dataflow.signal(false);
      var _isReady = Flow.Dataflow.lift(_isBusy, function (isBusy) {
        return !isBusy;
      });
      var _time = Flow.Dataflow.signal('');
      var _hasInput = Flow.Dataflow.signal(true);
      var _input = Flow.Dataflow.signal(input);
      var _outputs = Flow.Dataflow.signals([]);
      // Only for headless use.
      var _errors = [];
      var _result = Flow.Dataflow.signal(null);
      var _hasOutput = Flow.Dataflow.lift(_outputs, function (outputs) {
        return outputs.length > 0;
      });
      var _isInputVisible = Flow.Dataflow.signal(true);
      var _isOutputHidden = Flow.Dataflow.signal(false);

      // This is a shim for ko binding handlers to attach methods to
      // The ko 'cursorPosition' custom binding attaches a getCursorPosition() method to this.
      // The ko 'autoResize' custom binding attaches an autoResize() method to this.
      var _actions = {};

      // select and display input when activated
      Flow.Dataflow.act(_isActive, function (isActive) {
        if (isActive) {
          _.selectCell(self);
          _hasInput(true);
          if (!_isCode()) {
            _outputs([]);
          }
        }
      });

      // deactivate when deselected
      Flow.Dataflow.act(_isSelected, function (isSelected) {
        if (!isSelected) {
          return _isActive(false);
        }
      });

      var self = {
        guid: _guid,
        type: _type,
        isCode: _isCode,
        isSelected: _isSelected,
        isActive: _isActive,
        hasError: _hasError,
        isBusy: _isBusy,
        isReady: _isReady,
        time: _time,
        input: _input,
        hasInput: _hasInput,
        outputs: _outputs,
        result: _result,
        hasOutput: _hasOutput,
        isInputVisible: _isInputVisible,
        toggleInput: toggleInput.bind(this, _isInputVisible),
        isOutputHidden: _isOutputHidden,
        toggleOutput: toggleOutput.bind(this, _isOutputHidden),
        activate: activate.bind(this, _isActive),
        execute: execute.bind(this, _, _time, input, _input, _render, _isBusy, clear.bind(this, _result, _outputs, _errors, _hasError, _isCode, _hasInput), _type, _outputs, _result, _hasError, _errors, _hasInput, _isActive, _isCode),
        clear: clear.bind(this, _result, _outputs, _errors, _hasError, _isCode, _hasInput),
        clip: clip.bind(this, _, _type, _input),
        _actions: _actions,
        getCursorPosition: getCursorPosition.bind(this, _actions),
        autoResize: autoResize.bind(this, _actions),
        scrollIntoView: scrollIntoView.bind(this, _actions),
        templateOf: templateOf,
        template: 'flow-cell'
      };
      var boundSelect = select.bind(this, _, self);
      self.select = boundSelect;
      var boundNavigate = navigate.bind(this, _, self);
      self.navigate = boundNavigate;
      return self;
    }

    function createCell(_, type, input) {
      if (type == null) {
        type = 'cs';
      }
      if (input == null) {
        input = '';
      }
      return flowCell(_, type, input);
    }

    function checkConsistency(_cells) {
      var cell = void 0;
      var i = void 0;
      var selectionCount = void 0;
      var _i = void 0;
      var _len = void 0;
      selectionCount = 0;
      var _ref = _cells();
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        cell = _ref[i];
        if (!cell) {
          console.error("index " + i + " is empty");
        } else {
          if (cell.isSelected()) {
            selectionCount++;
          }
        }
      }
      if (selectionCount !== 1) {
        console.error("selected cell count = " + selectionCount);
      }
    }

    function selectCell(_, target, scrollIntoView, scrollImmediately) {
      var lodash = window._;
      if (scrollIntoView == null) {
        scrollIntoView = true;
      }
      if (scrollImmediately == null) {
        scrollImmediately = false;
      }
      if (_.selectedCell === target) {
        return;
      }
      if (_.selectedCell) {
        _.selectedCell.isSelected(false);
      }
      _.selectedCell = target;
      // TODO also set focus so that tabs don't jump to the first cell
      _.selectedCell.isSelected(true);
      _.selectedCellIndex = _.cells.indexOf(_.selectedCell);
      checkConsistency(_.cells);
      if (scrollIntoView) {
        lodash.defer(function () {
          return _.selectedCell.scrollIntoView(scrollImmediately);
        });
      }
    }

    function deserialize(_, localName, remoteName, doc) {
      var lodash = window._;
      var cell = void 0;
      var _i = void 0;
      var _len = void 0;
      _.localName(localName);
      _.remoteName(remoteName);
      var cells = function () {
        var _i = void 0;
        var _len = void 0;
        var _ref = doc.cells;
        var _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cell = _ref[_i];
          _results.push(createCell(_, cell.type, cell.input));
        }
        return _results;
      }();
      _.cells(cells);
      selectCell(_, lodash.head(cells));

      // Execute all non-code cells (headings, markdown, etc.)
      var _ref = _.cells();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cell = _ref[_i];
        if (!cell.isCode()) {
          cell.execute();
        }
      }
    }

    function insertCell(_, index, cell) {
      _.cells.splice(index, 0, cell);
      selectCell(_, cell);
      return cell;
    }

    function insertAbove(_, cell) {
      return insertCell(_, _.selectedCellIndex, cell);
    }

    function insertBelow(_, cell) {
      return insertCell(_, _.selectedCellIndex + 1, cell);
    }

    function appendCell(_, cell) {
      return insertCell(_, _.cells().length, cell);
    }

    function removeCell(_) {
      var lodash = window._;
      var removedCell = void 0;
      var cells = _.cells();
      if (cells.length > 1) {
        if (_.selectedCellIndex === cells.length - 1) {
          // TODO call dispose() on this cell
          removedCell = lodash.head(_.cells.splice(_.selectedCellIndex, 1));
          selectCell(_, cells[_.selectedCellIndex - 1]);
        } else {
          // TODO call dispose() on this cell
          removedCell = lodash.head(_.cells.splice(_.selectedCellIndex, 1));
          selectCell(_, cells[_.selectedCellIndex]);
        }
        if (removedCell) {
          _.saveClip('trash', removedCell.type(), removedCell.input());
        }
      }
    }

    function mergeCellBelow(_) {
      var nextCell = void 0;
      var cells = _.cells();
      if (_.selectedCellIndex !== cells.length - 1) {
        nextCell = cells[_.selectedCellIndex + 1];
        if (_.selectedCell.type() === nextCell.type()) {
          nextCell.input(_.selectedCell.input() + '\n' + nextCell.input());
          removeCell(_);
        }
      }
    }

    function splitCell(_) {
      var cursorPosition = void 0;
      var input = void 0;
      var left = void 0;
      var right = void 0;
      if (_.selectedCell.isActive()) {
        input = _.selectedCell.input();
        if (input.length > 1) {
          cursorPosition = _.selectedCell.getCursorPosition();
          if (cursorPosition > 0 && cursorPosition < input.length - 1) {
            left = input.substr(0, cursorPosition);
            right = input.substr(cursorPosition);
            _.selectedCell.input(left);
            insertCell(_, _.selectedCellIndex + 1, createCell(_, 'cs', right));
            _.selectedCell.isActive(true);
          }
        }
      }
    }

    function cloneCell(_, cell) {
      return createCell(_, cell.type(), cell.input());
    }

    function pasteCellAbove(_) {
      if (_.clipboardCell) {
        return insertCell(_, _.selectedCellIndex, cloneCell(_, _.clipboardCell));
      }
    }

    function editName(_) {
      return _.isEditingName(true);
    }

    function saveName(_) {
      return _.isEditingName(false);
    }

    function toggleSidebar(_) {
      return _.isSidebarHidden(!_.isSidebarHidden());
    }

    function stopRunningAll(_) {
      return _.isRunningAll(false);
    }

    // noop
    function notImplemented() {
      return {};
    }

    function createMenu(label, items) {
      return {
        label: label,
        items: items
      };
    }

    function toKeyboardHelp(shortcut) {
      var lodash = window._;
      var seq = shortcut[0];
      var caption = shortcut[1];
      var keystrokes = lodash.map(seq.split(/\+/g), function (key) {
        return '<kbd>' + key + '</kbd>';
      }).join(' ');
      return {
        keystrokes: keystrokes,
        caption: caption
      };
    }

    function switchToEditMode(_) {
      _.selectedCell.isActive(true);
      return false;
    }

    function convertCellToCode(_) {
      return _.selectedCell.type('cs');
    }

    function convertCellToMarkdown(_) {
      _.selectedCell.type('md');
      return _.selectedCell.execute();
    }

    function convertCellToRaw(_) {
      _.selectedCell.type('raw');
      return _.selectedCell.execute();
    }

    function convertCellToHeading(_, level) {
      return function () {
        _.selectedCell.type("h" + level);
        return _.selectedCell.execute();
      };
    }

    function selectPreviousCell(_) {
      var cells = void 0;
      if (_.selectedCellIndex !== 0) {
        cells = _.cells();
        selectCell(_, cells[_.selectedCellIndex - 1]);
      }
      // prevent arrow keys from scrolling the page
      return false;
    }

    function selectNextCell(_) {
      var cells = _.cells();
      if (_.selectedCellIndex !== cells.length - 1) {
        selectCell(_, cells[_.selectedCellIndex + 1]);
      }
      // prevent arrow keys from scrolling the page
      return false;
    }

    function moveCellUp(_) {
      var cells = void 0;
      if (_.selectedCellIndex !== 0) {
        cells = _.cells();
        _.cells.splice(_.selectedCellIndex, 1);
        _.selectedCellIndex--;
        _.cells.splice(_.selectedCellIndex, 0, _.selectedCell);
      }
    }

    function moveCellDown(_) {
      var cells = _.cells();
      if (_.selectedCellIndex !== cells.length - 1) {
        _.cells.splice(_.selectedCellIndex, 1);
        _.selectedCellIndex++;
        _.cells.splice(_.selectedCellIndex, 0, _.selectedCell);
      }
    }

    function insertNewCellAbove(_) {
      return insertAbove(_, createCell(_, 'cs'));
    }

    function insertNewCellBelow(_) {
      return insertBelow(_, createCell(_, 'cs'));
    }

    function copyCell(_) {
      _.clipboardCell = _.selectedCell;
      return _.clipboardCell;
    }

    function cutCell(_) {
      copyCell(_);
      return removeCell(_);
    }

    function pasteCellBelow(_) {
      if (_.clipboardCell) {
        return insertCell(_, _.selectedCellIndex + 1, cloneCell(_, _.clipboardCell));
      }
    }

    function undoLastDelete(_) {
      if (_.lastDeletedCell) {
        insertCell(_, _.selectedCellIndex + 1, _.lastDeletedCell);
      }
      _.lastDeletedCell = null;
      return _.lastDeletedCell;
    }

    function deleteCell(_) {
      _.lastDeletedCell = _.selectedCell;
      return removeCell(_);
    }

    function checkIfNameIsInUse(_, name, go) {
      return getObjectExistsRequest(_, 'notebook', name, function (error, exists) {
        return go(exists);
      });
    }

    function deleteObjectRequest(_, type, name, go) {
      return doDelete(_, '/3/NodePersistentStorage/' + encodeURIComponent(type) + '/' + encodeURIComponent(name), go);
    }

    function storeNotebook(_, localName, remoteName) {
      return postPutObjectRequest(_, 'notebook', localName, serialize(_), function (error) {
        if (error) {
          return _.alert('Error saving notebook: ' + error.message);
        }
        _.remoteName(localName);
        _.localName(localName);

        // renamed document
        if (remoteName !== localName) {
          return deleteObjectRequest(_, 'notebook', remoteName, function (error) {
            if (error) {
              _.alert('Error deleting remote notebook [' + remoteName + ']: ' + error.message);
            }
            return _.saved();
          });
        }
        return _.saved();
      });
    }

    function saveNotebook(_) {
      var localName = sanitizeName(_.localName());
      if (localName === '') {
        return _.alert('Invalid notebook name.');
      }

      // saved document
      var remoteName = _.remoteName();
      if (remoteName) {
        storeNotebook(_, localName, remoteName);
      }
      // unsaved document
      checkIfNameIsInUse(_, localName, function (isNameInUse) {
        if (isNameInUse) {
          return _.confirm('A notebook with that name already exists.\nDo you want to replace it with the one you\'re saving?', {
            acceptCaption: 'Replace',
            declineCaption: 'Cancel'
          }, function (accept) {
            if (accept) {
              return storeNotebook(_, localName, remoteName);
            }
          });
        }
        return storeNotebook(_, localName, remoteName);
      });
    }

    function toggleOutput$1(_) {
      return _.selectedCell.toggleOutput();
    }

    function displayKeyboardShortcuts() {
      var $ = window.jQuery;
      return $('#keyboardHelpDialog').modal();
    }

    function convertCellToScala(_) {
      return _.selectedCell.type('sca');
    }

    // (From IPython Notebook keyboard shortcuts dialog)
    //
    // The IPython Notebook has two different keyboard input modes.
    // Edit mode allows you to type code/text into a cell
    // and is indicated by a green cell border.
    // Command mode binds the keyboard to notebook level
    // actions and is indicated by a grey cell border.
    //
    // Command Mode (press Esc to enable)
    //
    function createNormalModeKeyboardShortcuts(_) {
      var normalModeKeyboardShortcuts = [['enter', 'edit mode', switchToEditMode],
      // [ 'shift+enter', 'run cell, select below', runCellAndSelectBelow ]
      // [ 'ctrl+enter', 'run cell', runCell ]
      // [ 'alt+enter', 'run cell, insert below', runCellAndInsertBelow ]
      ['y', 'to code', convertCellToCode], ['m', 'to markdown', convertCellToMarkdown], ['r', 'to raw', convertCellToRaw], ['1', 'to heading 1', convertCellToHeading(_, 1)], ['2', 'to heading 2', convertCellToHeading(_, 2)], ['3', 'to heading 3', convertCellToHeading(_, 3)], ['4', 'to heading 4', convertCellToHeading(_, 4)], ['5', 'to heading 5', convertCellToHeading(_, 5)], ['6', 'to heading 6', convertCellToHeading(_, 6)], ['up', 'select previous cell', selectPreviousCell], ['down', 'select next cell', selectNextCell], ['k', 'select previous cell', selectPreviousCell], ['j', 'select next cell', selectNextCell], ['ctrl+k', 'move cell up', moveCellUp], ['ctrl+j', 'move cell down', moveCellDown], ['a', 'insert cell above', insertNewCellAbove], ['b', 'insert cell below', insertNewCellBelow], ['x', 'cut cell', cutCell], ['c', 'copy cell', copyCell], ['shift+v', 'paste cell above', pasteCellAbove], ['v', 'paste cell below', pasteCellBelow], ['z', 'undo last delete', undoLastDelete], ['d d', 'delete cell (press twice)', deleteCell], ['shift+m', 'merge cell below', mergeCellBelow], ['s', 'save notebook', saveNotebook],
      // [ 'mod+s', 'save notebook', saveNotebook ]
      // [ 'l', 'toggle line numbers' ]
      ['o', 'toggle output', toggleOutput$1],
      // [ 'shift+o', 'toggle output scrolling' ]
      ['h', 'keyboard shortcuts', displayKeyboardShortcuts]];

      if (_.onSparklingWater) {
        normalModeKeyboardShortcuts.push(['q', 'to Scala', convertCellToScala]);
      }

      return normalModeKeyboardShortcuts;
    }

    function switchToCommandMode(_) {
      return _.selectedCell.isActive(false);
    }

    // ipython has inconsistent behavior here.
    // seems to be doing runCellAndInsertBelow if executed on the lowermost cell.
    function runCellAndSelectBelow(_) {
      _.selectedCell.execute(function () {
        return selectNextCell(_);
      });
      return false;
    }

    function runCell(_) {
      _.selectedCell.execute();
      return false;
    }

    function runCellAndInsertBelow(_) {
      _.selectedCell.execute(function () {
        return insertNewCellBelow(_);
      });
      return false;
    }

    function createEditModeKeyboardShortcuts() {
      //
      // Edit Mode (press Enter to enable)
      //
      var editModeKeyboardShortcuts = [
      // Tab : code completion or indent
      // Shift-Tab : tooltip
      // Cmd-] : indent
      // Cmd-[ : dedent
      // Cmd-a : select all
      // Cmd-z : undo
      // Cmd-Shift-z : redo
      // Cmd-y : redo
      // Cmd-Up : go to cell start
      // Cmd-Down : go to cell end
      // Opt-Left : go one word left
      // Opt-Right : go one word right
      // Opt-Backspace : del word before
      // Opt-Delete : del word after
      ['esc', 'command mode', switchToCommandMode], ['ctrl+m', 'command mode', switchToCommandMode], ['shift+enter', 'run cell, select below', runCellAndSelectBelow], ['ctrl+enter', 'run cell', runCell], ['alt+enter', 'run cell, insert below', runCellAndInsertBelow], ['ctrl+shift+-', 'split cell', splitCell], ['mod+s', 'save notebook', saveNotebook]];
      return editModeKeyboardShortcuts;
    }

    function setupKeyboardHandling(_, mode) {
      var Mousetrap = window.Mousetrap;
      var normalModeKeyboardShortcuts = createNormalModeKeyboardShortcuts(_);
      var editModeKeyboardShortcuts = createEditModeKeyboardShortcuts();
      var caption = void 0;
      var f = void 0;
      var shortcut = void 0;
      var _i = void 0;
      var _j = void 0;
      var _len = void 0;
      var _len1 = void 0;
      var _ref = void 0;
      var _ref1 = void 0;
      for (_i = 0, _len = normalModeKeyboardShortcuts.length; _i < _len; _i++) {
        _ref = normalModeKeyboardShortcuts[_i];
        shortcut = _ref[0];
        caption = _ref[1];
        f = _ref[2].bind(this, _);
        Mousetrap.bind(shortcut, f);
      }
      for (_j = 0, _len1 = editModeKeyboardShortcuts.length; _j < _len1; _j++) {
        _ref1 = editModeKeyboardShortcuts[_j];
        shortcut = _ref1[0];
        caption = _ref1[1];
        f = _ref1[2].bind(this, _);
        Mousetrap.bindGlobal(shortcut, f);
      }
    }

    function createShortcutHint(shortcut) {
      var lodash = window._;
      return '<span style=\'float:right\'>' + lodash.map(shortcut, function (key) {
        return '<kbd>' + key + '</kbd>';
      }).join(' ') + '</span>';
    }

    function createMenuItem(label, action, shortcut) {
      var lodash = window._;
      var kbds = shortcut ? createShortcutHint(shortcut) : '';
      return {
        label: '' + lodash.escape(label) + kbds,
        action: action
      };
    }

    function executeCommand(_, command) {
      return function () {
        return _.insertAndExecuteCell('cs', command);
      };
    }

    function createNotebook(_) {
      return _.confirm('This action will replace your active notebook.\nAre you sure you want to continue?', {
        acceptCaption: 'Create New Notebook',
        declineCaption: 'Cancel'
      }, function (accept) {
        var currentTime = void 0;
        if (accept) {
          currentTime = new Date().getTime();

          var acceptLocalName = 'Untitled Flow';
          var acceptRemoteName = null;
          var acceptDoc = {
            cells: [{
              type: 'cs',
              input: ''
            }]
          };

          return deserialize(_, acceptLocalName, acceptRemoteName, acceptDoc);
        }
      });
    }

    function postUploadObjectRequest(_, type, name, formData, go) {
      var uri = void 0;
      uri = '/3/NodePersistentStorage.bin/' + encodeURIComponent(type);
      if (name) {
        uri += '/' + encodeURIComponent(name);
      }
      return doUpload(_, uri, formData, unwrap(go, function (result) {
        return result.name;
      }));
    }

    function flowFileOpenDialog(_, _go) {
      var Flow = window.Flow;
      var H2O = window.H2O;
      var _overwrite = Flow.Dataflow.signal(false);
      var _form = Flow.Dataflow.signal(null);
      var _file = Flow.Dataflow.signal(null);
      var _canAccept = Flow.Dataflow.lift(_file, function (file) {
        if (file != null ? file.name : void 0) {
          return validateFileExtension(file.name, '.flow');
        }
        return false;
      });
      var checkIfNameIsInUse = function checkIfNameIsInUse(name, go) {
        return getObjectExistsRequest(_, 'notebook', name, function (error, exists) {
          return go(exists);
        });
      };
      var uploadFile = function uploadFile(basename) {
        return postUploadObjectRequest(_, 'notebook', basename, new FormData(_form()), function (error, filename) {
          return _go({
            error: error,
            filename: filename
          });
        });
      };
      var accept = function accept() {
        var basename = void 0;
        var file = _file();
        if (file) {
          basename = getFileBaseName(file.name, '.flow');
          if (_overwrite()) {
            return uploadFile(basename);
          }
          return checkIfNameIsInUse(basename, function (isNameInUse) {
            if (isNameInUse) {
              return _overwrite(true);
            }
            return uploadFile(basename);
          });
        }
      };
      var decline = function decline() {
        return _go(null);
      };
      return {
        form: _form,
        file: _file,
        overwrite: _overwrite,
        canAccept: _canAccept,
        accept: accept,
        decline: decline,
        template: 'file-open-dialog'
      };
    }

    function loadNotebook(_, name) {
      return getObjectRequest(_, 'notebook', name, function (error, doc) {
        var _ref = void 0;
        if (error) {
          _ref = error.message;
          return _.alert(_ref != null ? _ref : error);
        }
        var loadNotebookLocalName = name;
        var loadNotebookRemoteName = name;
        var loadNotebookDoc = doc;
        return deserialize(_, loadNotebookLocalName, loadNotebookRemoteName, loadNotebookDoc);
      });
    }

    function promptForNotebook(_) {
      return _.dialog(flowFileOpenDialog, function (result) {
        var error = void 0;
        var filename = void 0;
        var _ref = void 0;
        if (result) {
          error = result.error;
          filename = result.filename;
          if (error) {
            _ref = error.message;
            return _.growl(_ref != null ? _ref : error);
          }
          loadNotebook(_, filename);
          return _.loaded();
        }
      });
    }

    function duplicateNotebook(_) {
      var duplicateNotebookLocalName = 'Copy of ' + _.localName();
      var duplicateNotebookRemoteName = null;
      var duplicateNotebookDoc = serialize(_);
      return deserialize(_, duplicateNotebookLocalName, duplicateNotebookRemoteName, duplicateNotebookDoc);
    }

    function executeNextCell(_, cells, cellIndex, cellCount, go) {
      var cell = void 0;
      // will be false if user-aborted
      if (_.isRunningAll()) {
        cell = cells.shift();
        if (cell) {
          // Scroll immediately without affecting selection state.
          cell.scrollIntoView(true);
          cellIndex++;
          _.runningCaption('Running cell ' + cellIndex + ' of ' + cellCount);
          _.runningPercent(Math.floor(100 * cellIndex / cellCount) + '%');
          _.runningCellInput(cell.input());
          // TODO Continuation should be EFC, and passing an error should abort 'run all'
          return cell.execute(function (errors) {
            if (errors) {
              return go('failed', errors);
            }
            return executeNextCell(_, cells, cellIndex, cellCount, go);
          });
        }
        return go('done');
      }
      return go('aborted');
    }

    function executeAllCells(_, fromBeginning, go) {
      var cellIndex = void 0;
      var cells = void 0;
      _.isRunningAll(true);
      cells = _.cells().slice(0);
      var cellCount = cells.length;
      cellIndex = 0;
      if (!fromBeginning) {
        cells = cells.slice(_.selectedCellIndex);
        cellIndex = _.selectedCellIndex;
      }
      return executeNextCell(_, cells, cellIndex, cellCount, go);
    }

    function runAllCells(_, fromBeginning) {
      if (fromBeginning == null) {
        fromBeginning = true;
      }
      return executeAllCells(_, fromBeginning, function (status) {
        _.isRunningAll(false);
        switch (status) {
          case 'aborted':
            return _.growl('Stopped running your flow.', 'warning');
          case 'failed':
            return _.growl('Failed running your flow.', 'danger');
          default:
            // 'done'
            return _.growl('Finished running your flow!', 'success');
        }
      });
    }

    function continueRunningAllCells(_) {
      return runAllCells(_, false);
    }

    function toggleAllInputs(_) {
      var cell = void 0;
      var _i = void 0;
      var _len = void 0;
      var _ref = void 0;
      var wereHidden = _.areInputsHidden();
      _.areInputsHidden(!wereHidden);
      //
      // If cells are generated while inputs are hidden, the input boxes
      //   do not resize to fit contents. So explicitly ask all cells
      //   to resize themselves.
      //
      if (wereHidden) {
        _ref = _.cells();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cell = _ref[_i];
          cell.autoResize();
        }
      }
    }

    function toggleAllOutputs(_) {
      return _.areOutputsHidden(!_.areOutputsHidden());
    }

    function clearAllCells(_) {
      var cell = void 0;
      var _i = void 0;
      var _len = void 0;
      var _ref = _.cells();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cell = _ref[_i];
        cell.clear();
        cell.autoResize();
      }
    }

    function exportNotebook(_) {
      var remoteName = _.remoteName();
      if (remoteName) {
        return window.open('/3/NodePersistentStorage.bin/notebook/' + remoteName, '_blank');
      }
      return _.alert('Please save this notebook before exporting.');
    }

    function postUploadFileRequest(_, key, formData, go) {
      return doUpload(_, '/3/PostFile?destination_frame=' + encodeURIComponent(key), formData, go);
    }

    function flowFileUploadDialog(_, _go) {
      var Flow = window.Flow;
      var _form = Flow.Dataflow.signal(null);
      var _file = Flow.Dataflow.signal(null);
      var uploadFile = function uploadFile(key) {
        return postUploadFileRequest(_, key, new FormData(_form()), function (error, result) {
          return _go({
            error: error,
            result: result
          });
        });
      };
      var accept = function accept() {
        var file = _file();
        if (file) {
          return uploadFile(file.name);
        }
      };
      var decline = function decline() {
        return _go(null);
      };
      return {
        form: _form,
        file: _file,
        accept: accept,
        decline: decline,
        template: 'file-upload-dialog'
      };
    }

    var flowPrelude$72 = flowPreludeFunction();

    function uploadFile(_) {
      return _.dialog(flowFileUploadDialog, function (result) {
        var error = void 0;
        var _ref = void 0;
        if (result) {
          error = result.error;
          if (error) {
            _ref = error.message;
            return _.growl(_ref != null ? _ref : error);
          }
          _.growl('File uploaded successfully!');
          return _.insertAndExecuteCell('cs', 'setupParse source_frames: [ ' + flowPrelude$72.stringify(result.result.destination_frame) + ']');
        }
      });
    }

    function goToH2OUrl(url) {
      return function () {
        return window.open(window.Flow.ContextPath + url, '_blank');
      };
    }

    function createMenuHeader(label) {
      return {
        label: label,
        action: null
      };
    }

    function postShutdownRequest(_, go) {
      return doPost(_, '/3/Shutdown', {}, go);
    }

    function shutdown(_) {
      return postShutdownRequest(_, function (error, result) {
        if (error) {
          return _.growl('Shutdown failed: ' + error.message, 'danger');
        }
        return _.growl('Shutdown complete!', 'warning');
      });
    }

    function showHelp(_) {
      _.isSidebarHidden(false);
      return _.showHelp();
    }

    function findBuildProperty(caption) {
      var lodash = window._;
      var Flow = window.Flow;
      var entry = void 0;
      if (Flow.BuildProperties) {
        entry = lodash.find(Flow.BuildProperties, function (entry) {
          return entry.caption === caption;
        });
        if (entry) {
          return entry.value;
        }
        return void 0;
      }
      return void 0;
    }

    function getBuildProperties() {
      var lodash = window._;
      var projectVersion = findBuildProperty('H2O Build project version');
      return [findBuildProperty('H2O Build git branch'), projectVersion, projectVersion ? lodash.last(projectVersion.split('.')) : void 0, findBuildProperty('H2O Build git hash') || 'master'];
    }

    function displayDocumentation() {
      var _ref = getBuildProperties();
      var gitBranch = _ref[0];
      var projectVersion = _ref[1];
      var buildVersion = _ref[2];
      var gitHash = _ref[3];
      if (buildVersion && buildVersion !== '99999') {
        return window.open('http://h2o-release.s3.amazonaws.com/h2o/' + gitBranch + '/' + buildVersion + '/docs-website/h2o-docs/index.html', '_blank');
      }
      return window.open('https://github.com/h2oai/h2o-3/blob/' + gitHash + '/h2o-docs/src/product/flow/README.md', '_blank');
    }

    function displayFAQ() {
      var _ref = getBuildProperties();
      var gitBranch = _ref[0];
      var projectVersion = _ref[1];
      var buildVersion = _ref[2];
      var gitHash = _ref[3];
      if (buildVersion && buildVersion !== '99999') {
        return window.open('http://h2o-release.s3.amazonaws.com/h2o/' + gitBranch + '/' + buildVersion + '/docs-website/h2o-docs/index.html', '_blank');
      }
      return window.open('https://github.com/h2oai/h2o-3/blob/' + gitHash + '/h2o-docs/src/product/howto/FAQ.md', '_blank');
    }

    function displayAbout() {
      var $ = window.jQuery;
      return $('#aboutDialog').modal();
    }

    var menuDivider = {
      label: null,
      action: null
    };

    var flowPrelude$71 = flowPreludeFunction();

    function initializeMenus(_, menuCell, builder) {
      var lodash = window._;
      var modelMenuItems = lodash.map(builder, function (builder) {
        return createMenuItem(builder.algo_full_name + '...', executeCommand(_, 'buildModel ' + flowPrelude$71.stringify(builder.algo)));
      }).concat([menuDivider, createMenuItem('List All Models', executeCommand(_, 'getModels')), createMenuItem('List Grid Search Results', executeCommand(_, 'getGrids')), createMenuItem('Import Model...', executeCommand(_, 'importModel')), createMenuItem('Export Model...', executeCommand(_, 'exportModel'))]);
      return [createMenu('Flow', [createMenuItem('New Flow', createNotebook.bind(this, _)), createMenuItem('Open Flow...', promptForNotebook.bind(this, _)), createMenuItem('Save Flow', saveNotebook.bind(this, _), ['s']), createMenuItem('Make a Copy...', duplicateNotebook.bind(this, _)), menuDivider, createMenuItem('Run All Cells', runAllCells.bind(this, _)), createMenuItem('Run All Cells Below', continueRunningAllCells.bind(this, _)), menuDivider, createMenuItem('Toggle All Cell Inputs', toggleAllInputs.bind(this, _)), createMenuItem('Toggle All Cell Outputs', toggleAllOutputs.bind(this, _)), createMenuItem('Clear All Cell Outputs', clearAllCells.bind(this, _)), menuDivider, createMenuItem('Download this Flow...', exportNotebook.bind(this, _))]), createMenu('Cell', menuCell), createMenu('Data', [createMenuItem('Import Files...', executeCommand(_, 'importFiles')), createMenuItem('Upload File...', uploadFile.bind(this, _)), createMenuItem('Split Frame...', executeCommand(_, 'splitFrame')), createMenuItem('Merge Frames...', executeCommand(_, 'mergeFrames')), menuDivider, createMenuItem('List All Frames', executeCommand(_, 'getFrames')), menuDivider, createMenuItem('Impute...', executeCommand(_, 'imputeColumn'))]), createMenu('Model', modelMenuItems), createMenu('Score', [createMenuItem('Predict...', executeCommand(_, 'predict')), createMenuItem('Partial Dependence Plots...', executeCommand(_, 'buildPartialDependence')), menuDivider, createMenuItem('List All Predictions', executeCommand(_, 'getPredictions'))]), createMenu('Plot', [createMenuItem('Partial Dependence Plots...', executeCommand(_, 'buildPartialDependence')), createMenuItem('Roomscale Scatterplot...', executeCommand(_, 'buildRoomscaleScatterplot'))]), createMenu('Admin', [createMenuItem('Jobs', executeCommand(_, 'getJobs')), createMenuItem('Cluster Status', executeCommand(_, 'getCloud')), createMenuItem('Water Meter (CPU meter)', goToH2OUrl('perfbar.html')), menuDivider, createMenuHeader('Inspect Log'), createMenuItem('View Log', executeCommand(_, 'getLogFile')), createMenuItem('Download Logs', goToH2OUrl('3/Logs/download')), menuDivider, createMenuHeader('Advanced'), createMenuItem('Create Synthetic Frame...', executeCommand(_, 'createFrame')), createMenuItem('Stack Trace', executeCommand(_, 'getStackTrace')), createMenuItem('Network Test', executeCommand(_, 'testNetwork')),
      // TODO Cluster I/O
      createMenuItem('Profiler', executeCommand(_, 'getProfile depth: 10')), createMenuItem('Timeline', executeCommand(_, 'getTimeline')),
      // TODO UDP Drop Test
      // TODO Task Status
      createMenuItem('Shut Down', shutdown.bind(this, _))]), createMenu('Help', [
      // TODO createMenuItem('Tour', startTour, true),
      createMenuItem('Assist Me', executeCommand(_, 'assist')), menuDivider, createMenuItem('Contents', showHelp.bind(this, _)), createMenuItem('Keyboard Shortcuts', displayKeyboardShortcuts, ['h']), menuDivider, createMenuItem('Documentation', displayDocumentation), createMenuItem('FAQ', displayFAQ), createMenuItem('H2O.ai', goToUrl('http://h2o.ai/')), createMenuItem('H2O on Github', goToUrl('https://github.com/h2oai/h2o-3')), createMenuItem('Report an issue', goToUrl('http://jira.h2o.ai')), createMenuItem('Forum / Ask a question', goToUrl('https://groups.google.com/d/forum/h2ostream')), menuDivider,
      // TODO Tutorial Flows
      createMenuItem('About', displayAbout)])];
    }

    function setupMenus(_, menuCell) {
        return requestModelBuilders(_, function (error, builders) {
            return _.menus(initializeMenus(_, menuCell, error ? [] : builders));
        });
    }

    function toggleInput$1(_) {
      return _.selectedCell.toggleInput();
    }

    function clearCell(_) {
      _.selectedCell.clear();
      return _.selectedCell.autoResize();
    }

    function insertNewScalaCellAbove(_) {
      return insertAbove(_, createCell(_, 'sca'));
    }

    function insertNewScalaCellBelow(_) {
      return insertBelow(_, createCell(_, 'sca'));
    }

    function createMenuCell(_) {
      var __slice = [].slice;
      var menuCell = [createMenuItem('Run Cell', runCell.bind(this, _), ['ctrl', 'enter']), menuDivider, createMenuItem('Cut Cell', cutCell.bind(this, _), ['x']), createMenuItem('Copy Cell', copyCell.bind(this, _), ['c']), createMenuItem('Paste Cell Above', pasteCellAbove.bind(this, _), ['shift', 'v']), createMenuItem('Paste Cell Below', pasteCellBelow.bind(this, _), ['v']),
      // TODO createMenuItem('Paste Cell and Replace', pasteCellandReplace, true),
      createMenuItem('Delete Cell', deleteCell.bind(this, _), ['d', 'd']), createMenuItem('Undo Delete Cell', undoLastDelete.bind(this, _), ['z']), menuDivider, createMenuItem('Move Cell Up', moveCellUp.bind(this, _), ['ctrl', 'k']), createMenuItem('Move Cell Down', moveCellDown.bind(this, _), ['ctrl', 'j']), menuDivider, createMenuItem('Insert Cell Above', insertNewCellAbove.bind(this, _), ['a']), createMenuItem('Insert Cell Below', insertNewCellBelow.bind(this, _), ['b']),
      // TODO createMenuItem('Split Cell', splitCell),
      // TODO createMenuItem('Merge Cell Above', mergeCellAbove, true),
      // TODO createMenuItem('Merge Cell Below', mergeCellBelow),
      menuDivider, createMenuItem('Toggle Cell Input', toggleInput$1.bind(this, _)), createMenuItem('Toggle Cell Output', toggleOutput$1.bind(this, _), ['o']), createMenuItem('Clear Cell Output', clearCell.bind(this, _))];
      var menuCellSW = [menuDivider, createMenuItem('Insert Scala Cell Above', insertNewScalaCellAbove.bind(this, _)), createMenuItem('Insert Scala Cell Below', insertNewScalaCellBelow.bind(this, _))];
      if (_.onSparklingWater) {
        menuCell = __slice.call(menuCell).concat(__slice.call(menuCellSW));
      }
      return menuCell;
    }

    function openNotebook(_, name, doc) {
      var openNotebookLocalName = name;
      var openNotebookRemoteName = null;
      var openNotebookDoc = doc;
      return deserialize(_, openNotebookLocalName, openNotebookRemoteName, openNotebookDoc);
    }

    function appendCellAndRun(_, type, input) {
      var cell = appendCell(_, createCell(_, type, input));
      cell.execute();
      return cell;
    }

    function insertCellBelow(_, type, input) {
      return insertBelow(_, createCell(_, type, input));
    }

    // initialize the interpreter when the notebook is created
    // one interpreter is shared by all scala cells
    function _initializeInterpreter(_) {
      return postScalaIntpRequest(_, function (error, response) {
        if (error) {
          // Handle the error
          return _.scalaIntpId(-1);
        }
        return _.scalaIntpId(response.session_id);
      });
    }

    function initialize$1(_) {
      var lodash = window._;
      var Flow = window.Flow;
      var menuCell = createMenuCell(_);
      setupKeyboardHandling(_, 'normal');
      setupMenus(_, menuCell);
      Flow.Dataflow.link(_.load, loadNotebook.bind(this, _));
      Flow.Dataflow.link(_.open, openNotebook.bind(this, _));
      Flow.Dataflow.link(_.selectCell, selectCell.bind(this, _));
      Flow.Dataflow.link(_.executeAllCells, executeAllCells.bind(this, _));
      Flow.Dataflow.link(_.insertAndExecuteCell, function (type, input) {
        return lodash.defer(appendCellAndRun, _, type, input);
      });
      Flow.Dataflow.link(_.insertCell, function (type, input) {
        return lodash.defer(insertCellBelow, _, type, input);
      });
      Flow.Dataflow.link(_.saved, function () {
        return _.growl('Notebook saved.');
      });
      Flow.Dataflow.link(_.loaded, function () {
        return _.growl('Notebook loaded.');
      });
      executeCommand(_, 'assist')();
      // TODO setPristine() when autosave is implemented.
      _.setDirty();
      if (_.onSparklingWater) {
        return _initializeInterpreter(_);
      }
    }

    function createTool(icon, label, action, isDisabled) {
      if (isDisabled == null) {
        isDisabled = false;
      }
      return {
        label: label,
        action: action,
        isDisabled: isDisabled,
        icon: "fa fa-" + icon
      };
    }

    function createToolbar(_) {
      var toolbar = [[createTool('file-o', 'New', createNotebook.bind(this, _)), createTool('folder-open-o', 'Open', promptForNotebook.bind(this, _)), createTool('save', 'Save (s)', saveNotebook.bind(this, _))], [createTool('plus', 'Insert Cell Below (b)', insertNewCellBelow.bind(this, _)), createTool('arrow-up', 'Move Cell Up (ctrl+k)', moveCellUp.bind(this, _)), createTool('arrow-down', 'Move Cell Down (ctrl+j)', moveCellDown.bind(this, _))], [createTool('cut', 'Cut Cell (x)', cutCell.bind(this, _)), createTool('copy', 'Copy Cell (c)', copyCell.bind(this, _)), createTool('paste', 'Paste Cell Below (v)', pasteCellBelow.bind(this, _)), createTool('eraser', 'Clear Cell', clearCell.bind(this, _)), createTool('trash-o', 'Delete Cell (d d)', deleteCell.bind(this, _))], [createTool('step-forward', 'Run and Select Below', runCellAndSelectBelow.bind(this, _)), createTool('play', 'Run (ctrl+enter)', runCell.bind(this, _)), createTool('forward', 'Run All', runAllCells.bind(this, _))], [createTool('question-circle', 'Assist Me', executeCommand(_, 'assist'))]];
      return toolbar;
    }

    function flowStatus(_) {
      var lodash = window._;
      var Flow = window.Flow;
      var defaultMessage = 'Ready';
      var _message = Flow.Dataflow.signal(defaultMessage);
      var _connections = Flow.Dataflow.signal(0);
      var _isBusy = Flow.Dataflow.lift(_connections, function (connections) {
        return connections > 0;
      });
      var onStatus = function onStatus(category, type, data) {
        var connections = void 0;
        console.debug('Status:', category, type, data);
        switch (category) {
          case 'server':
            switch (type) {
              case 'request':
                _connections(_connections() + 1);
                return lodash.defer(_message, 'Requesting ' + data);
              case 'response':
              case 'error':
                _connections(connections = _connections() - 1);
                if (connections) {
                  return lodash.defer(_message, 'Waiting for ' + connections + ' responses...');
                }
                return lodash.defer(_message, defaultMessage);
              default:
              // do nothing
            }
            break;
          default:
          // do nothing
        }
      };
      Flow.Dataflow.link(_.ready, function () {
        return Flow.Dataflow.link(_.status, onStatus);
      });
      return {
        message: _message,
        connections: _connections,
        isBusy: _isBusy
      };
    }

    function flowOutline(_) {
      return { cells: _.cells };
    }

    function getObjectsRequest(_, type, go) {
      doGet(_, '/3/NodePersistentStorage/' + encodeURIComponent(type), unwrap(go, function (result) {
        return result.entries;
      }));
    }

    function flowBrowser(_) {
      var lodash = window._;
      var Flow = window.Flow;
      var _docs = Flow.Dataflow.signals([]);
      var _sortedDocs = Flow.Dataflow.lift(_docs, function (docs) {
        return lodash.sortBy(docs, function (doc) {
          return -doc.date().getTime();
        });
      });
      var _hasDocs = Flow.Dataflow.lift(_docs, function (docs) {
        return docs.length > 0;
      });
      var createNotebookView = function createNotebookView(notebook) {
        var _name = notebook.name;
        var _date = Flow.Dataflow.signal(new Date(notebook.timestamp_millis));
        var _fromNow = Flow.Dataflow.lift(_date, fromNow);
        var load = function load() {
          return _.confirm('This action will replace your active notebook.\nAre you sure you want to continue?', {
            acceptCaption: 'Load Notebook',
            declineCaption: 'Cancel'
          }, function (accept) {
            if (accept) {
              return _.load(_name);
            }
          });
        };
        var purge = function purge() {
          return _.confirm('Are you sure you want to delete this notebook?\n"' + _name + '"', {
            acceptCaption: 'Delete',
            declineCaption: 'Keep'
          }, function (accept) {
            if (accept) {
              return deleteObjectRequest(_, 'notebook', _name, function (error) {
                var _ref = void 0;
                if (error) {
                  _ref = error.message;
                  return _.alert(_ref != null ? _ref : error);
                }
                _docs.remove(self);
                return _.growl('Notebook deleted.');
              });
            }
          });
        };
        var self = {
          name: _name,
          date: _date,
          fromNow: _fromNow,
          load: load,
          purge: purge
        };
        return self;
      };
      var loadNotebooks = function loadNotebooks() {
        return getObjectsRequest(_, 'notebook', function (error, notebooks) {
          if (error) {
            return console.debug(error);
          }
          // XXX sort
          return _docs(lodash.map(notebooks, function (notebook) {
            return createNotebookView(notebook);
          }));
        });
      };
      Flow.Dataflow.link(_.ready, function () {
        loadNotebooks();
        Flow.Dataflow.link(_.saved, function () {
          return loadNotebooks();
        });
        return Flow.Dataflow.link(_.loaded, function () {
          return loadNotebooks();
        });
      });
      return {
        docs: _sortedDocs,
        hasDocs: _hasDocs,
        loadNotebooks: loadNotebooks
      };
    }

    function flowSidebar(_) {
      var Flow = window.Flow;
      var _mode = Flow.Dataflow.signal('help');
      var _outline = flowOutline(_);
      var _isOutlineMode = Flow.Dataflow.lift(_mode, function (mode) {
        return mode === 'outline';
      });
      var switchToOutline = function switchToOutline() {
        return _mode('outline');
      };
      var _browser = flowBrowser(_);
      var _isBrowserMode = Flow.Dataflow.lift(_mode, function (mode) {
        return mode === 'browser';
      });
      var switchToBrowser = function switchToBrowser() {
        return _mode('browser');
      };
      var _clipboard = Flow.clipboard(_);
      var _isClipboardMode = Flow.Dataflow.lift(_mode, function (mode) {
        return mode === 'clipboard';
      });
      var switchToClipboard = function switchToClipboard() {
        return _mode('clipboard');
      };
      var _help = Flow.help(_);
      var _isHelpMode = Flow.Dataflow.lift(_mode, function (mode) {
        return mode === 'help';
      });
      var switchToHelp = function switchToHelp() {
        return _mode('help');
      };
      Flow.Dataflow.link(_.ready, function () {
        Flow.Dataflow.link(_.showHelp, function () {
          return switchToHelp();
        });
        Flow.Dataflow.link(_.showClipboard, function () {
          return switchToClipboard();
        });
        Flow.Dataflow.link(_.showBrowser, function () {
          return switchToBrowser();
        });
        return Flow.Dataflow.link(_.showOutline, function () {
          return switchToOutline();
        });
      });
      return {
        outline: _outline,
        isOutlineMode: _isOutlineMode,
        switchToOutline: switchToOutline,
        browser: _browser,
        isBrowserMode: _isBrowserMode,
        switchToBrowser: switchToBrowser,
        clipboard: _clipboard,
        isClipboardMode: _isClipboardMode,
        switchToClipboard: switchToClipboard,
        help: _help,
        isHelpMode: _isHelpMode,
        switchToHelp: switchToHelp
      };
    }

    var flowPrelude$70 = flowPreludeFunction();

    function flowNotebook(_) {
      var lodash = window._;
      var Flow = window.Flow;
      var Mousetrap = window.Mousetrap;
      var $ = window.jQuery;
      var __slice = [].slice;
      _.localName = Flow.Dataflow.signal('Untitled Flow');
      Flow.Dataflow.react(_.localName, function (name) {
        document.title = 'H2O' + (name && name.trim() ? '- ' + name : '');
        return document.title;
      });
      _.remoteName = Flow.Dataflow.signal(null);
      _.isEditingName = Flow.Dataflow.signal(false);
      _.cells = Flow.Dataflow.signals([]);
      _.selectedCell = null;
      _.selectedCellIndex = -1;
      _.clipboardCell = null;
      _.lastDeletedCell = null;
      _.areInputsHidden = Flow.Dataflow.signal(false);
      _.areOutputsHidden = Flow.Dataflow.signal(false);
      _.isSidebarHidden = Flow.Dataflow.signal(false);
      _.isRunningAll = Flow.Dataflow.signal(false);
      _.runningCaption = Flow.Dataflow.signal('Running');
      _.runningPercent = Flow.Dataflow.signal('0%');
      _.runningCellInput = Flow.Dataflow.signal('');
      var _status = flowStatus(_);
      var _sidebar = flowSidebar(_);
      var _about = Flow.about(_);
      var _dialogs = Flow.dialogs(_);
      var pasteCellandReplace = notImplemented;
      var mergeCellAbove = notImplemented;
      var startTour = notImplemented;
      //
      // Top menu bar
      //
      _.menus = Flow.Dataflow.signal(null);
      var _toolbar = createToolbar(_);
      var normalModeKeyboardShortcuts = createNormalModeKeyboardShortcuts(_);
      var editModeKeyboardShortcuts = createEditModeKeyboardShortcuts();
      var normalModeKeyboardShortcutsHelp = lodash.map(normalModeKeyboardShortcuts, toKeyboardHelp);
      var editModeKeyboardShortcutsHelp = lodash.map(editModeKeyboardShortcuts, toKeyboardHelp);
      Flow.Dataflow.link(_.ready, initialize$1.bind(this, _));
      return {
        name: _.localName,
        isEditingName: _.isEditingName,
        editName: editName.bind(this, _),
        saveName: saveName.bind(this, _),
        menus: _.menus,
        sidebar: _sidebar,
        status: _status,
        toolbar: _toolbar,
        cells: _.cells,
        areInputsHidden: _.areInputsHidden,
        areOutputsHidden: _.areOutputsHidden,
        isSidebarHidden: _.isSidebarHidden,
        isRunningAll: _.isRunningAll,
        runningCaption: _.runningCaption,
        runningPercent: _.runningPercent,
        runningCellInput: _.runningCellInput,
        stopRunningAll: stopRunningAll.bind(this, _),
        toggleSidebar: toggleSidebar.bind(this, _),
        shortcutsHelp: {
          normalMode: normalModeKeyboardShortcutsHelp,
          editMode: editModeKeyboardShortcutsHelp
        },
        about: _about,
        dialogs: _dialogs,
        templateOf: function templateOf(view) {
          return view.template;
        }
      };
    }

    function flowApplication(_, routines) {
      var Flow = window.Flow;
      flowApplicationContext(_);
      var _sandbox = flowSandbox(_, routines(_));
      // TODO support external renderers
      _.renderers = flowRenderers(_, _sandbox);
      flowAnalytics(_);
      flowGrowl(_);
      flowAutosave(_);
      var _notebook = flowNotebook(_);
      _.requestPack = requestPack;
      _.requestFlow = requestFlow;
      _.requestRemoveAll = requestRemoveAll;
      return {
        context: _,
        sandbox: _sandbox,
        view: _notebook
      };
    }

    //
    // TODO
    //
    // XXX how does cell output behave when a widget throws an exception?
    // XXX GLM case is failing badly. Investigate. Should catch/handle gracefully.
    //
    // integrate with groc
    // tooltips on celltype flags
    // arrow keys cause page to scroll - disable those behaviors
    // scrollTo() behavior
    //

    function flow() {
      var Flow = window.Flow;
      var ko = window.ko;
      var H2O = window.H2O;
      var $ = window.jQuery;
      var getContextPath = function getContextPath() {
        window.Flow.ContextPath = '/';
        return $.ajax({
          url: window.referrer,
          type: 'GET',
          success: function success(data, status, xhr) {
            if (xhr.getAllResponseHeaders().indexOf('X-h2o-context-path') !== -1) {
              window.Flow.ContextPath = xhr.getResponseHeader('X-h2o-context-path');
              return window.Flow.ContextPath;
            }
          },

          async: false
        });
      };
      var checkSparklingWater = function checkSparklingWater(context) {
        context.onSparklingWater = false;
        return $.ajax({
          url: window.Flow.ContextPath + '3/Metadata/endpoints',
          type: 'GET',
          dataType: 'json',
          success: function success(response) {
            var route = void 0;
            var _i = void 0;
            var _len = void 0;
            var _ref = response.routes;
            var _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              route = _ref[_i];
              if (route.url_pattern === '/3/scalaint') {
                _results.push(context.onSparklingWater = true);
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          },

          async: false
        });
      };
      if ((typeof window !== 'undefined' && window !== null ? window.$ : void 0) != null) {
        $(function () {
          var context = {};
          getContextPath();
          checkSparklingWater(context);
          window.flow = flowApplication(context, H2O.Routines);
          h2oApplication(context);
          ko.applyBindings(window.flow);
          context.ready();
          return context.initialized();
        });
      }
    }

    var flowPrelude = flowPreludeFunction();

    // flow.coffee
    // parent IIFE for the rest of this file
    // defer for now
    (function () {
      var lodash = window._;
      var marked = window.marked;
      window.Flow = {};
      window.H2O = {};
      flow();
      about();
      clipboard();
      failure();
      help();
      objectBrowser();
      async();
      data();
      dataflow();
      dialogs();
      error();
      format();
      gui$1();
      html();
      knockout();
      localStorage();
      // src/core/modules/marked.coffee IIFE
      // experience errors on first abstraction attempt
      // defer for now
      (function () {
        if ((typeof window !== 'undefined' && window !== null ? window.marked : void 0) == null) {
          return;
        }
        marked.setOptions({
          smartypants: true,
          highlight: function highlight(code, lang) {
            if (window.hljs) {
              return window.hljs.highlightAuto(code, [lang]).value;
            }
            return code;
          }
        });
      }).call(this);
      routines();
    }).call(undefined);

}));