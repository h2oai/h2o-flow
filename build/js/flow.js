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
}.call(this));
(function () {
    Flow.Analytics = function (_) {
        Flow.Dataflow.link(_.trackEvent, function (category, action, label, value) {
            return lodash.defer(function () {
                return window.ga('send', 'event', category, action, label, value);
            });
        });
        return Flow.Dataflow.link(_.trackException, function (description) {
            return lodash.defer(function () {
                _.requestEcho('FLOW: ' + description, function () {
                });
                return window.ga('send', 'exception', {
                    exDescription: description,
                    exFatal: false,
                    appName: 'Flow',
                    appVersion: Flow.Version
                });
            });
        });
    };
}.call(this));
(function () {
    Flow.ApplicationContext = function (_) {
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
        return _.dialog = Flow.Dataflow.slot();
    };
}.call(this));
(function () {
    Flow.Application = function (_, routines) {
        var _notebook, _renderers, _sandbox;
        Flow.ApplicationContext(_);
        _sandbox = Flow.Sandbox(_, routines(_));
        _renderers = Flow.Renderers(_, _sandbox);
        Flow.Growl(_);
        Flow.Autosave(_);
        _notebook = Flow.Notebook(_, _renderers);
        return {
            context: _,
            sandbox: _sandbox,
            view: _notebook
        };
    };
}.call(this));
(function () {
    var createBuffer, iterate, pipe, _applicate, _async, _find, _find$2, _find$3, _fork, _get, _isFuture, _join, _noop, __slice = [].slice;
    createBuffer = function (array) {
        var buffer, _array, _go;
        _array = array || [];
        _go = null;
        buffer = function (element) {
            if (element === void 0) {
                return _array;
            } else {
                _array.push(element);
                if (_go) {
                    _go(element);
                }
                return element;
            }
        };
        buffer.subscribe = function (go) {
            return _go = go;
        };
        buffer.buffer = _array;
        buffer.isBuffer = true;
        return buffer;
    };
    _noop = function (go) {
        return go(null);
    };
    _applicate = function (go) {
        return function (error, args) {
            if (lodash.isFunction(go)) {
                return go.apply(null, [error].concat(args));
            }
        };
    };
    _fork = function (f, args) {
        var self;
        if (!lodash.isFunction(f)) {
            throw new Error('Not a function.');
        }
        self = function (go) {
            var canGo;
            canGo = lodash.isFunction(go);
            if (self.settled) {
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
                        return f.apply(null, args.concat(function (error, result) {
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
                            return self.pending = false;
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
    _isFuture = function (a) {
        if (a != null ? a.isFuture : void 0) {
            return true;
        } else {
            return false;
        }
    };
    _join = function (args, go) {
        var arg, i, _actual, _i, _len, _results, _settled, _tasks;
        if (args.length === 0) {
            return go(null, []);
        }
        _tasks = [];
        _results = [];
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
    };
    pipe = function (tasks) {
        var next, _tasks;
        _tasks = tasks.slice(0);
        next = function (args, go) {
            var task;
            task = _tasks.shift();
            if (task) {
                return task.apply(null, args.concat(function () {
                    var error, results;
                    error = arguments[0], results = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
                    if (error) {
                        return go(error);
                    } else {
                        return next(results, go);
                    }
                }));
            } else {
                return go.apply(null, [null].concat(args));
            }
        };
        return function () {
            var args, go, _i;
            args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), go = arguments[_i++];
            return next(args, go);
        };
    };
    iterate = function (tasks) {
        var next, _results, _tasks;
        _tasks = tasks.slice(0);
        _results = [];
        next = function (go) {
            var task;
            task = _tasks.shift();
            if (task) {
                return task(function (error, result) {
                    if (error) {
                        return go(error);
                    } else {
                        _results.push(result);
                    }
                    return next(go);
                });
            } else {
                return go(null, _results);
            }
        };
        return function (go) {
            return next(go);
        };
    };
    _async = function () {
        var args, f, later;
        f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        later = function () {
            var args, error, go, result, _i;
            args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), go = arguments[_i++];
            try {
                result = f.apply(null, args);
                return go(null, result);
            } catch (_error) {
                error = _error;
                return go(error);
            }
        };
        return _fork(later, args);
    };
    _find$3 = function (attr, prop, obj) {
        var v, _i, _len;
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
    _find$2 = function (attr, obj) {
        if (_isFuture(obj)) {
            return _async(_find$2, attr, obj);
        } else if (lodash.isString(attr)) {
            if (lodash.isArray(obj)) {
                return _find$3('name', attr, obj);
            } else {
                return obj[attr];
            }
        }
    };
    _find = function () {
        var a, args, b, c, ta, tb, tc;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        switch (args.length) {
        case 3:
            a = args[0], b = args[1], c = args[2];
            ta = Flow.Prelude.typeOf(a);
            tb = Flow.Prelude.typeOf(b);
            tc = Flow.Prelude.typeOf(c);
            if (ta === 'Array' && tb === 'String') {
                return _find$3(b, c, a);
            } else if (ta === 'String' && (tc = 'Array')) {
                return _find$3(a, b, c);
            }
            break;
        case 2:
            a = args[0], b = args[1];
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
        }
    };
    _get = function (attr, obj) {
        if (_isFuture(obj)) {
            return _async(_get, attr, obj);
        } else if (lodash.isString(attr)) {
            if (lodash.isArray(obj)) {
                return _find$3('name', attr, obj);
            } else {
                return obj[attr];
            }
        }
    };
    Flow.Async = {
        createBuffer: createBuffer,
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
}.call(this));
(function () {
    Flow.Autosave = function (_) {
        var setDirty, setPristine, warnOnExit;
        warnOnExit = function (e) {
            var message;
            message = 'Warning: you are about to exit Flow.';
            if (e = e != null ? e : window.event) {
                e.returnValue = message;
            }
            return message;
        };
        setDirty = function () {
            return window.onbeforeunload = warnOnExit;
        };
        setPristine = function () {
            return window.onbeforeunload = null;
        };
        return Flow.Dataflow.link(_.ready, function () {
            Flow.Dataflow.link(_.setDirty, setDirty);
            return Flow.Dataflow.link(_.setPristine, setPristine);
        });
    };
}.call(this));
(function () {
    Flow.CoffeescriptKernel = function () {
        var coalesceScopes, compileCoffeescript, compileJavascript, createGlobalScope, createLocalScope, createRootScope, deleteAstNode, executeJavascript, generateJavascript, identifyDeclarations, parseDeclarations, parseJavascript, removeHoistedDeclarations, rewriteJavascript, safetyWrapCoffeescript, traverseJavascript, traverseJavascriptScoped;
        safetyWrapCoffeescript = function (guid) {
            return function (cs, go) {
                var block, lines;
                lines = cs.replace(/[\n\r]/g, '\n').split('\n');
                block = lodash.map(lines, function (line) {
                    return '  ' + line;
                });
                block.unshift('_h2o_results_[\'' + guid + '\'].result do ->');
                return go(null, block.join('\n'));
            };
        };
        compileCoffeescript = function (cs, go) {
            var error;
            try {
                return go(null, CoffeeScript.compile(cs, { bare: true }));
            } catch (_error) {
                error = _error;
                return go(new Flow.Error('Error compiling coffee-script', error));
            }
        };
        parseJavascript = function (js, go) {
            var error;
            try {
                return go(null, esprima.parse(js));
            } catch (_error) {
                error = _error;
                return go(new Flow.Error('Error parsing javascript expression', error));
            }
        };
        identifyDeclarations = function (node) {
            var declaration;
            if (!node) {
                return null;
            }
            switch (node.type) {
            case 'VariableDeclaration':
                return function () {
                    var _i, _len, _ref, _results;
                    _ref = node.declarations;
                    _results = [];
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
            }
            return null;
        };
        parseDeclarations = function (block) {
            var declaration, declarations, identifiers, node, _i, _j, _len, _len1, _ref;
            identifiers = [];
            _ref = block.body;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                node = _ref[_i];
                if (declarations = identifyDeclarations(node)) {
                    for (_j = 0, _len1 = declarations.length; _j < _len1; _j++) {
                        declaration = declarations[_j];
                        identifiers.push(declaration);
                    }
                }
            }
            return lodash.indexBy(identifiers, function (identifier) {
                return identifier.name;
            });
        };
        traverseJavascript = function (parent, key, node, f) {
            var child, i;
            if (lodash.isArray(node)) {
                i = node.length;
                while (i--) {
                    child = node[i];
                    if (lodash.isObject(child)) {
                        traverseJavascript(node, i, child, f);
                        f(node, i, child);
                    }
                }
            } else {
                for (i in node) {
                    child = node[i];
                    if (lodash.isObject(child)) {
                        traverseJavascript(node, i, child, f);
                        f(node, i, child);
                    }
                }
            }
        };
        deleteAstNode = function (parent, i) {
            if (_.isArray(parent)) {
                return parent.splice(i, 1);
            } else if (lodash.isObject(parent)) {
                return delete parent[i];
            }
        };
        createLocalScope = function (node) {
            var localScope, param, _i, _len, _ref;
            localScope = parseDeclarations(node.body);
            _ref = node.params;
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
        };
        coalesceScopes = function (scopes) {
            var currentScope, i, identifier, name, scope, _i, _len;
            currentScope = {};
            for (i = _i = 0, _len = scopes.length; _i < _len; i = ++_i) {
                scope = scopes[i];
                if (i === 0) {
                    for (name in scope) {
                        identifier = scope[name];
                        currentScope[name] = identifier;
                    }
                } else {
                    for (name in scope) {
                        identifier = scope[name];
                        currentScope[name] = null;
                    }
                }
            }
            return currentScope;
        };
        traverseJavascriptScoped = function (scopes, parentScope, parent, key, node, f) {
            var child, currentScope, isNewScope;
            isNewScope = node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
            if (isNewScope) {
                scopes.push(createLocalScope(node));
                currentScope = coalesceScopes(scopes);
            } else {
                currentScope = parentScope;
            }
            for (key in node) {
                child = node[key];
                if (lodash.isObject(child)) {
                    traverseJavascriptScoped(scopes, currentScope, node, key, child, f);
                    f(currentScope, node, key, child);
                }
            }
            if (isNewScope) {
                scopes.pop();
            }
        };
        createRootScope = function (sandbox) {
            return function (program, go) {
                var error, name, rootScope;
                try {
                    rootScope = parseDeclarations(program.body[0].expression['arguments'][0].callee.body);
                    for (name in sandbox.context) {
                        rootScope[name] = {
                            name: name,
                            object: '_h2o_context_'
                        };
                    }
                    return go(null, rootScope, program);
                } catch (_error) {
                    error = _error;
                    return go(new Flow.Error('Error parsing root scope', error));
                }
            };
        };
        removeHoistedDeclarations = function (rootScope, program, go) {
            var error;
            try {
                traverseJavascript(null, null, program, function (parent, key, node) {
                    var declarations;
                    if (node.type === 'VariableDeclaration') {
                        declarations = node.declarations.filter(function (declaration) {
                            return declaration.type === 'VariableDeclarator' && declaration.id.type === 'Identifier' && !rootScope[declaration.id.name];
                        });
                        if (declarations.length === 0) {
                            return deleteAstNode(parent, key);
                        } else {
                            return node.declarations = declarations;
                        }
                    }
                });
                return go(null, rootScope, program);
            } catch (_error) {
                error = _error;
                return go(new Flow.Error('Error rewriting javascript', error));
            }
        };
        createGlobalScope = function (rootScope, routines) {
            var globalScope, identifier, name;
            globalScope = {};
            for (name in rootScope) {
                identifier = rootScope[name];
                globalScope[name] = identifier;
            }
            for (name in routines) {
                globalScope[name] = {
                    name: name,
                    object: 'h2o'
                };
            }
            return globalScope;
        };
        rewriteJavascript = function (sandbox) {
            return function (rootScope, program, go) {
                var error, globalScope;
                globalScope = createGlobalScope(rootScope, sandbox.routines);
                try {
                    traverseJavascriptScoped([globalScope], globalScope, null, null, program, function (globalScope, parent, key, node) {
                        var identifier;
                        if (node.type === 'Identifier') {
                            if (parent.type === 'VariableDeclarator' && key === 'id') {
                                return;
                            }
                            if (key === 'property') {
                                return;
                            }
                            if (!(identifier = globalScope[node.name])) {
                                return;
                            }
                            return parent[key] = {
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
                        }
                    });
                    return go(null, program);
                } catch (_error) {
                    error = _error;
                    return go(new Flow.Error('Error rewriting javascript', error));
                }
            };
        };
        generateJavascript = function (program, go) {
            var error;
            try {
                return go(null, escodegen.generate(program));
            } catch (_error) {
                error = _error;
                return go(new Flow.Error('Error generating javascript', error));
            }
        };
        compileJavascript = function (js, go) {
            var closure, error;
            try {
                closure = new Function('h2o', '_h2o_context_', '_h2o_results_', 'print', js);
                return go(null, closure);
            } catch (_error) {
                error = _error;
                return go(new Flow.Error('Error compiling javascript', error));
            }
        };
        executeJavascript = function (sandbox, print) {
            return function (closure, go) {
                var error;
                try {
                    return go(null, closure(sandbox.routines, sandbox.context, sandbox.results, print));
                } catch (_error) {
                    error = _error;
                    return go(new Flow.Error('Error executing javascript', error));
                }
            };
        };
        return {
            safetyWrapCoffeescript: safetyWrapCoffeescript,
            compileCoffeescript: compileCoffeescript,
            parseJavascript: parseJavascript,
            createRootScope: createRootScope,
            removeHoistedDeclarations: removeHoistedDeclarations,
            rewriteJavascript: rewriteJavascript,
            generateJavascript: generateJavascript,
            compileJavascript: compileJavascript,
            executeJavascript: executeJavascript
        };
    }();
}.call(this));
(function () {
    var combineRanges, computeRange, createAbstractVariable, createCompiledPrototype, createFactor, createNumericVariable, createRecordConstructor, createTable, createVariable, factor, includeZeroInRange, nextPrototypeName, permute, _prototypeCache, _prototypeId, __slice = [].slice;
    _prototypeId = 0;
    nextPrototypeName = function () {
        return 'Map' + ++_prototypeId;
    };
    _prototypeCache = {};
    createCompiledPrototype = function (attrs) {
        var attr, cacheKey, i, inits, params, proto, prototypeName;
        cacheKey = attrs.join('\0');
        if (proto = _prototypeCache[cacheKey]) {
            return proto;
        }
        params = function () {
            var _i, _ref, _results;
            _results = [];
            for (i = _i = 0, _ref = attrs.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                _results.push('a' + i);
            }
            return _results;
        }();
        inits = function () {
            var _i, _len, _results;
            _results = [];
            for (i = _i = 0, _len = attrs.length; _i < _len; i = ++_i) {
                attr = attrs[i];
                _results.push('this[' + JSON.stringify(attr) + ']=a' + i + ';');
            }
            return _results;
        }();
        prototypeName = nextPrototypeName();
        return _prototypeCache[cacheKey] = new Function('function ' + prototypeName + '(' + params.join(',') + '){' + inits.join('') + '} return ' + prototypeName + ';')();
    };
    createRecordConstructor = function (variables) {
        var variable;
        return createCompiledPrototype(function () {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = variables.length; _i < _len; _i++) {
                variable = variables[_i];
                _results.push(variable.label);
            }
            return _results;
        }());
    };
    createTable = function (opts) {
        var description, expand, fill, label, meta, rows, schema, variable, variables, _i, _len;
        label = opts.label, description = opts.description, variables = opts.variables, rows = opts.rows, meta = opts.meta;
        if (!description) {
            description = 'No description available.';
        }
        schema = {};
        for (_i = 0, _len = variables.length; _i < _len; _i++) {
            variable = variables[_i];
            schema[variable.label] = variable;
        }
        fill = function (i, go) {
            _fill(i, function (error, result) {
                var index, startIndex, value, _j, _len1;
                if (error) {
                    return go(error);
                } else {
                    startIndex = result.index, lodash.values = result.values;
                    for (index = _j = 0, _len1 = lodash.values.length; _j < _len1; index = ++_j) {
                        value = lodash.values[index];
                        rows[startIndex + index] = lodash.values[index];
                    }
                    return go(null);
                }
            });
        };
        expand = function () {
            var type, types, _j, _len1, _results;
            types = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            _results = [];
            for (_j = 0, _len1 = types.length; _j < _len1; _j++) {
                type = types[_j];
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
    includeZeroInRange = function (range) {
        var hi, lo;
        lo = range[0], hi = range[1];
        if (lo > 0 && hi > 0) {
            return [
                0,
                hi
            ];
        } else if (lo < 0 && hi < 0) {
            return [
                lo,
                0
            ];
        } else {
            return range;
        }
    };
    combineRanges = function () {
        var hi, lo, range, ranges, value, _i, _len;
        ranges = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        lo = Number.POSITIVE_INFINITY;
        hi = Number.NEGATIVE_INFINITY;
        for (_i = 0, _len = ranges.length; _i < _len; _i++) {
            range = ranges[_i];
            if (lo > (value = range[0])) {
                lo = value;
            }
            if (hi < (value = range[1])) {
                hi = value;
            }
        }
        return [
            lo,
            hi
        ];
    };
    computeRange = function (rows, attr) {
        var hi, lo, row, value, _i, _len;
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
                hi
            ];
        } else {
            return [
                -1,
                1
            ];
        }
    };
    permute = function (array, indices) {
        var i, index, permuted, _i, _len;
        permuted = new Array(array.length);
        for (i = _i = 0, _len = indices.length; _i < _len; i = ++_i) {
            index = indices[i];
            permuted[i] = array[index];
        }
        return permuted;
    };
    createAbstractVariable = function (_label, _type, _domain, _format, _read) {
        return {
            label: _label,
            type: _type,
            domain: _domain || [],
            format: _format || lodash.identity,
            read: _read
        };
    };
    createNumericVariable = function (_label, _domain, _format, _read) {
        var self;
        self = createAbstractVariable(_label, Flow.TNumber, _domain || [
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY
        ], _format, _read);
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
    };
    createVariable = function (_label, _type, _domain, _format, _read) {
        if (_type === Flow.TNumber) {
            return createNumericVariable(_label, _domain, _format, _read);
        } else {
            return createAbstractVariable(_label, _type, _domain, _format, _read);
        }
    };
    createFactor = function (_label, _domain, _format, _read) {
        var level, self, _i, _id, _len, _levels, _ref;
        self = createAbstractVariable(_label, Flow.TFactor, _domain || [], _format, _read);
        _id = 0;
        _levels = {};
        if (self.domain.length) {
            _ref = self.domain;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                level = _ref[_i];
                _levels[level] = _id++;
            }
        }
        if (!self.read) {
            self.read = function (datum) {
                var id;
                level = datum === void 0 || datum === null ? 'null' : datum;
                if (void 0 === (id = _levels[level])) {
                    _levels[level] = id = _id++;
                    self.domain.push(level);
                }
                return id;
            };
        }
        return self;
    };
    factor = function (array) {
        var data, domain, i, id, level, levels, _i, _id, _len;
        _id = 0;
        levels = {};
        domain = [];
        data = new Array(array.length);
        for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
            level = array[i];
            if (void 0 === (id = levels[level])) {
                levels[level] = id = _id++;
                domain.push(level);
            }
            data[i] = id;
        }
        return [
            domain,
            data
        ];
    };
    Flow.Data = {
        Table: createTable,
        Variable: createVariable,
        Factor: createFactor,
        computeColumnInterpretation: function (type) {
            if (type === Flow.TNumber) {
                return 'c';
            } else if (type === Flow.TFactor) {
                return 'd';
            } else {
                return 't';
            }
        },
        Record: createRecordConstructor,
        computeRange: computeRange,
        combineRanges: combineRanges,
        includeZeroInRange: includeZeroInRange,
        factor: factor,
        permute: permute
    };
}.call(this));
(function () {
    var __slice = [].slice;
    Flow.Dataflow = function () {
        var createObservable, createObservableArray, createSignal, createSignals, createSlot, createSlots, isObservable, _act, _apply, _isSignal, _lift, _link, _merge, _react, _unlink;
        createSlot = function () {
            var arrow, self;
            arrow = null;
            self = function () {
                var args;
                args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                if (arrow) {
                    return arrow.func.apply(null, args);
                } else {
                    return void 0;
                }
            };
            self.subscribe = function (func) {
                console.assert(lodash.isFunction(func));
                if (arrow) {
                    throw new Error('Cannot re-attach slot');
                } else {
                    return arrow = {
                        func: func,
                        dispose: function () {
                            return arrow = null;
                        }
                    };
                }
            };
            self.dispose = function () {
                if (arrow) {
                    return arrow.dispose();
                }
            };
            return self;
        };
        createSlots = function () {
            var arrows, self;
            arrows = [];
            self = function () {
                var args;
                args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                return lodash.map(arrows, function (arrow) {
                    return arrow.func.apply(null, args);
                });
            };
            self.subscribe = function (func) {
                var arrow;
                console.assert(lodash.isFunction(func));
                arrows.push(arrow = {
                    func: func,
                    dispose: function () {
                        return Flow.Prelude.remove(arrows, arrow);
                    }
                });
                return arrow;
            };
            self.dispose = function () {
                return lodash.forEach(Flow.Prelude.copy(arrows), function (arrow) {
                    return arrow.dispose();
                });
            };
            return self;
        };
        if (typeof ko !== 'undefined' && ko !== null) {
            createObservable = ko.observable;
            createObservableArray = ko.observableArray;
            isObservable = ko.isObservable;
        } else {
            createObservable = function (initialValue) {
                var arrows, currentValue, notifySubscribers, self;
                arrows = [];
                currentValue = initialValue;
                notifySubscribers = function (arrows, newValue) {
                    var arrow, _i, _len;
                    for (_i = 0, _len = arrows.length; _i < _len; _i++) {
                        arrow = arrows[_i];
                        arrow.func(newValue);
                    }
                };
                self = function (newValue) {
                    var unchanged;
                    if (arguments.length === 0) {
                        return currentValue;
                    } else {
                        unchanged = self.equalityComparer ? self.equalityComparer(currentValue, newValue) : currentValue === newValue;
                        if (!unchanged) {
                            currentValue = newValue;
                            return notifySubscribers(arrows, newValue);
                        }
                    }
                };
                self.subscribe = function (func) {
                    var arrow;
                    console.assert(lodash.isFunction(func));
                    arrows.push(arrow = {
                        func: func,
                        dispose: function () {
                            return Flow.Prelude.remove(arrows, arrow);
                        }
                    });
                    return arrow;
                };
                self.__observable__ = true;
                return self;
            };
            createObservableArray = createObservable;
            isObservable = function (obj) {
                if (obj.__observable__) {
                    return true;
                } else {
                    return false;
                }
            };
        }
        createSignal = function (value, equalityComparer) {
            var observable;
            if (arguments.length === 0) {
                return createSignal(void 0, Flow.Prelude.never);
            } else {
                observable = createObservable(value);
                if (lodash.isFunction(equalityComparer)) {
                    observable.equalityComparer = equalityComparer;
                }
                return observable;
            }
        };
        _isSignal = isObservable;
        createSignals = function (array) {
            return createObservableArray(array || []);
        };
        _link = function (source, func) {
            console.assert(lodash.isFunction(source, '[signal] is not a function'));
            console.assert(lodash.isFunction(source.subscribe, '[signal] does not have a [dispose] method'));
            console.assert(lodash.isFunction(func, '[func] is not a function'));
            return source.subscribe(func);
        };
        _unlink = function (arrows) {
            var arrow, _i, _len, _results;
            if (lodash.isArray(arrows)) {
                _results = [];
                for (_i = 0, _len = arrows.length; _i < _len; _i++) {
                    arrow = arrows[_i];
                    console.assert(lodash.isFunction(arrow.dispose, '[arrow] does not have a [dispose] method'));
                    _results.push(arrow.dispose());
                }
                return _results;
            } else {
                console.assert(lodash.isFunction(arrows.dispose, '[arrow] does not have a [dispose] method'));
                return arrows.dispose();
            }
        };
        _apply = function (sources, func) {
            return func.apply(null, lodash.map(sources, function (source) {
                return source();
            }));
        };
        _act = function () {
            var func, sources, _i;
            sources = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), func = arguments[_i++];
            _apply(sources, func);
            return lodash.map(sources, function (source) {
                return _link(source, function () {
                    return _apply(sources, func);
                });
            });
        };
        _react = function () {
            var func, sources, _i;
            sources = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), func = arguments[_i++];
            return lodash.map(sources, function (source) {
                return _link(source, function () {
                    return _apply(sources, func);
                });
            });
        };
        _lift = function () {
            var evaluate, func, sources, target, _i;
            sources = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), func = arguments[_i++];
            evaluate = function () {
                return _apply(sources, func);
            };
            target = createSignal(evaluate());
            lodash.map(sources, function (source) {
                return _link(source, function () {
                    return target(evaluate());
                });
            });
            return target;
        };
        _merge = function () {
            var evaluate, func, sources, target, _i;
            sources = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), target = arguments[_i++], func = arguments[_i++];
            evaluate = function () {
                return _apply(sources, func);
            };
            target(evaluate());
            return lodash.map(sources, function (source) {
                return _link(source, function () {
                    return target(evaluate());
                });
            });
        };
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
}.call(this));
(function () {
    var __slice = [].slice;
    Flow.Dialogs = function (_) {
        var showDialog, _dialog;
        _dialog = Flow.Dataflow.signal(null);
        showDialog = function (ctor, args, _go) {
            var $dialog, dialog, go, responded;
            responded = false;
            go = function (response) {
                if (!responded) {
                    responded = true;
                    $dialog.modal('hide');
                    if (_go) {
                        return _go(response);
                    }
                }
            };
            _dialog(dialog = ctor.apply(null, [_].concat(args).concat(go)));
            $dialog = $('#' + dialog.template);
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
        };
        Flow.Dataflow.link(_.dialog, function () {
            var args, ctor, go, _i;
            ctor = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), go = arguments[_i++];
            return showDialog(ctor, args, go);
        });
        Flow.Dataflow.link(_.confirm, function (message, opts, go) {
            return showDialog(Flow.ConfirmDialog, [
                message,
                opts
            ], go);
        });
        Flow.Dataflow.link(_.alert, function (message, opts, go) {
            return showDialog(Flow.AlertDialog, [
                message,
                opts
            ], go);
        });
        return {
            dialog: _dialog,
            template: function (dialog) {
                return 'flow-' + dialog.template;
            }
        };
    };
}.call(this));
(function () {
    var FlowError, __hasProp = {}.hasOwnProperty, __extends = function (child, parent) {
            for (var key in parent) {
                if (__hasProp.call(parent, key))
                    child[key] = parent[key];
            }
            function ctor() {
                this.constructor = child;
            }
            ctor.prototype = parent.prototype;
            child.prototype = new ctor();
            child.__super__ = parent.prototype;
            return child;
        };
    FlowError = function (_super) {
        __extends(FlowError, _super);
        function FlowError(message, cause) {
            var error, _ref;
            this.message = message;
            this.cause = cause;
            this.name = 'FlowError';
            if ((_ref = this.cause) != null ? _ref.stack : void 0) {
                this.stack = this.cause.stack;
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
}.call(this));
(function () {
    var Digits, formatDate, formatReal, formatTime, significantDigitsBeforeDecimal, __formatReal;
    significantDigitsBeforeDecimal = function (value) {
        return 1 + Math.floor(Math.log(Math.abs(value)) / Math.LN10);
    };
    Digits = function (digits, value) {
        var magnitude, sd;
        if (value === 0) {
            return 0;
        } else {
            sd = significantDigitsBeforeDecimal(value);
            if (sd >= digits) {
                return value.toFixed(0);
            } else {
                magnitude = Math.pow(10, digits - sd);
                return Math.round(value * magnitude) / magnitude;
            }
        }
    };
    if (typeof exports === 'undefined' || exports === null) {
        formatTime = d3.time.format('%Y-%m-%d %H:%M:%S');
    }
    formatDate = function (time) {
        if (time) {
            return formatTime(new Date(time));
        } else {
            return '-';
        }
    };
    __formatReal = {};
    formatReal = function (precision) {
        var cached, format;
        format = (cached = __formatReal[precision]) ? cached : __formatReal[precision] = precision === -1 ? lodash.identity : d3.format('.' + precision + 'f');
        return function (value) {
            return format(value);
        };
    };
    Flow.Format = {
        Digits: Digits,
        Real: formatReal,
        Date: formatDate,
        Time: formatTime
    };
}.call(this));
(function () {
    Flow.Growl = function (_) {
        return Flow.Dataflow.link(_.growl, function (message, type) {
            if (type) {
                return $.bootstrapGrowl(message, { type: type });
            } else {
                return $.bootstrapGrowl(message);
            }
        });
    };
}.call(this));
(function () {
    var button, checkbox, content, control, dropdown, html, listbox, markdown, text, textarea, textbox, wrapArray, wrapValue;
    wrapValue = function (value, init) {
        if (value === void 0) {
            return Flow.Dataflow.signal(init);
        } else {
            if (Flow.Dataflow.isSignal(value)) {
                return value;
            } else {
                return Flow.Dataflow.signal(value);
            }
        }
    };
    wrapArray = function (elements) {
        var element;
        if (elements) {
            if (Flow.Dataflow.isSignal(elements)) {
                element = elements();
                if (lodash.isArray(element)) {
                    return elements;
                } else {
                    return Flow.Dataflow.signal([element]);
                }
            } else {
                return Flow.Dataflow.signals(lodash.isArray(elements) ? elements : [elements]);
            }
        } else {
            return Flow.Dataflow.signals([]);
        }
    };
    control = function (type, opts) {
        var guid;
        if (!opts) {
            opts = {};
        }
        guid = 'gui_' + lodash.uniqueId();
        return {
            type: type,
            id: opts.id || guid,
            label: Flow.Dataflow.signal(opts.label || ' '),
            description: Flow.Dataflow.signal(opts.description || ' '),
            visible: Flow.Dataflow.signal(opts.visible === false ? false : true),
            disable: Flow.Dataflow.signal(opts.disable === true ? true : false),
            template: 'flow-form-' + type,
            templateOf: function (control) {
                return control.template;
            }
        };
    };
    content = function (type, opts) {
        var self;
        self = control(type, opts);
        self.value = wrapValue(opts.value, '');
        return self;
    };
    text = function (opts) {
        return content('text', opts);
    };
    html = function (opts) {
        return content('html', opts);
    };
    markdown = function (opts) {
        return content('markdown', opts);
    };
    checkbox = function (opts) {
        var self;
        self = control('checkbox', opts);
        self.value = wrapValue(opts.value, opts.value ? true : false);
        return self;
    };
    dropdown = function (opts) {
        var self;
        self = control('dropdown', opts);
        self.options = opts.options || [];
        self.value = wrapValue(opts.value);
        self.caption = opts.caption || 'Choose...';
        return self;
    };
    listbox = function (opts) {
        var self;
        self = control('listbox', opts);
        self.options = opts.options || [];
        self.values = wrapArray(opts.values);
        return self;
    };
    textbox = function (opts) {
        var self;
        self = control('textbox', opts);
        self.value = wrapValue(opts.value, '');
        self.event = lodash.isString(opts.event) ? opts.event : null;
        return self;
    };
    textarea = function (opts) {
        var self;
        self = control('textarea', opts);
        self.value = wrapValue(opts.value, '');
        self.event = lodash.isString(opts.event) ? opts.event : null;
        self.rows = lodash.isNumber(opts.rows) ? opts.rows : 5;
        return self;
    };
    button = function (opts) {
        var self;
        self = control('button', opts);
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
}.call(this));
(function () {
    if ((typeof window !== 'undefined' && window !== null ? window.diecut : void 0) == null) {
        return;
    }
    Flow.HTML = {
        template: diecut,
        render: function (name, html) {
            var el;
            el = document.createElement(name);
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
}.call(this));
(function () {
    if ((typeof window !== 'undefined' && window !== null ? window.ko : void 0) == null) {
        return;
    }
    ko.bindingHandlers.raw = {
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $element, arg;
            arg = ko.unwrap(valueAccessor());
            if (arg) {
                $element = $(element);
                $element.empty();
                $element.append(arg);
            }
        }
    };
    ko.bindingHandlers.markdown = {
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var data, error, html;
            data = ko.unwrap(valueAccessor());
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
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var data;
            data = ko.unwrap(valueAccessor());
            return $(element).text(JSON.stringify(data, null, 2));
        }
    };
    ko.bindingHandlers.enterKey = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $element, action;
            if (action = ko.unwrap(valueAccessor())) {
                if (lodash.isFunction(action)) {
                    $element = $(element);
                    $element.keydown(function (e) {
                        if (e.which === 13) {
                            action(viewModel);
                        }
                    });
                } else {
                    throw 'Enter key action is not a function';
                }
            }
        }
    };
    ko.bindingHandlers.typeahead = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $element, action;
            if (action = ko.unwrap(valueAccessor())) {
                if (lodash.isFunction(action)) {
                    $element = $(element);
                    $element.typeahead(null, {
                        displayKey: 'value',
                        source: action
                    });
                } else {
                    throw 'Typeahead action is not a function';
                }
            }
        }
    };
    ko.bindingHandlers.cursorPosition = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var arg;
            if (arg = ko.unwrap(valueAccessor())) {
                arg.getCursorPosition = function () {
                    return $(element).textrange('get', 'position');
                };
            }
        }
    };
    ko.bindingHandlers.autoResize = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $el, arg, resize;
            if (arg = ko.unwrap(valueAccessor())) {
                arg.autoResize = resize = function () {
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
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $el, $viewport, arg;
            if (arg = ko.unwrap(valueAccessor())) {
                $el = $(element);
                $viewport = $el.closest('.flow-box-notebook');
                arg.scrollIntoView = function (immediate) {
                    var height, position, top;
                    if (immediate == null) {
                        immediate = false;
                    }
                    position = $viewport.scrollTop();
                    top = $el.position().top + position;
                    height = $viewport.height();
                    if (top - 20 < position || top + 20 > position + height) {
                        if (immediate) {
                            return $viewport.scrollTop(top);
                        } else {
                            return $viewport.animate({ scrollTop: top }, 'fast');
                        }
                    }
                };
            }
        }
    };
    ko.bindingHandlers.collapse = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $caretEl, $el, $nextEl, caretDown, caretEl, caretRight, isCollapsed, toggle;
            caretDown = 'fa-caret-down';
            caretRight = 'fa-caret-right';
            isCollapsed = ko.unwrap(valueAccessor());
            caretEl = document.createElement('i');
            caretEl.className = 'fa';
            caretEl.style.marginRight = '3px';
            element.insertBefore(caretEl, element.firstChild);
            $el = $(element);
            $nextEl = $el.next();
            if (!$nextEl.length) {
                throw new Error('No collapsible sibling found');
            }
            $caretEl = $(caretEl);
            toggle = function () {
                if (isCollapsed) {
                    $caretEl.removeClass(caretDown).addClass(caretRight);
                    $nextEl.hide();
                } else {
                    $caretEl.removeClass(caretRight).addClass(caretDown);
                    $nextEl.show();
                }
                return isCollapsed = !isCollapsed;
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
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $element, arg;
            arg = ko.unwrap(valueAccessor());
            if (arg) {
                $element = $(element);
                $element.empty();
                $element.append(arg);
            }
        }
    };
    ko.bindingHandlers.dump = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var object;
            return object = ko.unwrap(valueAccessor());
        }
    };
    ko.bindingHandlers.element = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            return valueAccessor()(element);
        }
    };
    ko.bindingHandlers.file = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $file, file;
            file = valueAccessor();
            if (file) {
                $file = $(element);
                $file.change(function () {
                    return file(this.files[0]);
                });
            }
        }
    };
    ko.bindingHandlers.codemirror = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var editor, internalTextArea, options;
            options = ko.unwrap(valueAccessor());
            editor = CodeMirror.fromTextArea(element, options);
            editor.on('change', function (cm) {
                return allBindings().value(cm.getValue());
            });
            element.editor = editor;
            if (allBindings().value()) {
                editor.setValue(allBindings().value());
            }
            internalTextArea = $(editor.getWrapperElement()).find('div textarea');
            internalTextArea.attr('rows', '1');
            internalTextArea.attr('spellcheck', 'false');
            internalTextArea.removeAttr('wrap');
            return editor.refresh();
        },
        update: function (element, valueAccessor) {
            if (element.editor) {
                return element.editor.refresh();
            }
        }
    };
}.call(this));
(function () {
    var keyOf, list, purge, purgeAll, read, write, _ls;
    if (!(typeof window !== 'undefined' && window !== null ? window.localStorage : void 0)) {
        return;
    }
    _ls = window.localStorage;
    keyOf = function (type, id) {
        return '' + type + ':' + id;
    };
    list = function (type) {
        var i, id, key, objs, t, _i, _ref, _ref1;
        objs = [];
        for (i = _i = 0, _ref = _ls.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            key = _ls.key(i);
            _ref1 = key.split(':'), t = _ref1[0], id = _ref1[1];
            if (type === t) {
                objs.push([
                    type,
                    id,
                    JSON.parse(_ls.getItem(key))
                ]);
            }
        }
        return objs;
    };
    read = function (type, id) {
        var raw;
        if (raw = _ls.getobj(keyOf(type, id))) {
            return JSON.parse(raw);
        } else {
            return null;
        }
    };
    write = function (type, id, obj) {
        return _ls.setItem(keyOf(type, id), JSON.stringify(obj));
    };
    purge = function (type, id) {
        if (id) {
            return _ls.removeItem(keyOf(type, id));
        } else {
            return purgeAll(type);
        }
    };
    purgeAll = function (type) {
        var allKeys, i, key, _i, _len;
        allKeys = function () {
            var _i, _ref, _results;
            _results = [];
            for (i = _i = 0, _ref = _ls.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
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
}.call(this));
(function () {
    if ((typeof window !== 'undefined' && window !== null ? window.marked : void 0) == null) {
        return;
    }
    marked.setOptions({
        smartypants: true,
        highlight: function (code, lang) {
            if (window.hljs) {
                return window.hljs.highlightAuto(code, [lang]).value;
            } else {
                return code;
            }
        }
    });
}.call(this));
(function () {
    Flow.Prelude = function () {
        var _always, _copy, _deepClone, _isDefined, _isFalsy, _isTruthy, _negative, _never, _remove, _repeat, _typeOf, _words;
        _isDefined = function (value) {
            return !lodash.isUndefined(value);
        };
        _isTruthy = function (value) {
            if (value) {
                return true;
            } else {
                return false;
            }
        };
        _isFalsy = function (value) {
            if (value) {
                return false;
            } else {
                return true;
            }
        };
        _negative = function (value) {
            return !value;
        };
        _always = function () {
            return true;
        };
        _never = function () {
            return false;
        };
        _copy = function (array) {
            return array.slice(0);
        };
        _remove = function (array, element) {
            var index;
            if (-1 < (index = lodash.indexOf(array, element))) {
                return lodash.head(array.splice(index, 1));
            } else {
                return void 0;
            }
        };
        _words = function (text) {
            return text.split(/\s+/);
        };
        _repeat = function (count, value) {
            var array, i, _i;
            array = [];
            for (i = _i = 0; 0 <= count ? _i < count : _i > count; i = 0 <= count ? ++_i : --_i) {
                array.push(value);
            }
            return array;
        };
        _typeOf = function (a) {
            var type;
            type = Object.prototype.toString.call(a);
            if (a === null) {
                return Flow.TNull;
            } else if (a === void 0) {
                return Flow.TUndefined;
            } else if (a === true || a === false || type === '[object Boolean]') {
                return Flow.TBoolean;
            } else {
                switch (type) {
                case '[object String]':
                    return Flow.TString;
                case '[object Number]':
                    return Flow.TNumber;
                case '[object Function]':
                    return Flow.TFunction;
                case '[object Object]':
                    return Flow.TObject;
                case '[object Array]':
                    return Flow.TArray;
                case '[object Arguments]':
                    return Flow.TArguments;
                case '[object Date]':
                    return Flow.TDate;
                case '[object RegExp]':
                    return Flow.TRegExp;
                case '[object Error]':
                    return Flow.TError;
                default:
                    return type;
                }
            }
        };
        _deepClone = function (obj) {
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
    }();
}.call(this));
(function () {
    Flow.Sandbox = function (_, routines) {
        return {
            routines: routines,
            context: {},
            results: {}
        };
    };
}.call(this));
(function () {
    Flow.TUndefined = 'undefined';
    Flow.TNull = 'null';
    Flow.TBoolean = 'Boolean';
    Flow.TString = 'String';
    Flow.TNumber = 'Number';
    Flow.TFunction = 'Function';
    Flow.TObject = 'Object';
    Flow.TArray = 'Array';
    Flow.TArguments = 'Arguments';
    Flow.TDate = 'Date';
    Flow.TRegExp = 'RegExp';
    Flow.TError = 'Error';
    Flow.TFactor = 'Factor';
}.call(this));
(function () {
    var EOL, describeCount, format1d0, formatBytes, formatClockTime, formatElapsedTime, formatMilliseconds, fromNow, highlight, multilineTextToHTML, padTime, sanitizeName, splitTime;
    describeCount = function (count, singular, plural) {
        if (!plural) {
            plural = singular + 's';
        }
        switch (count) {
        case 0:
            return 'No ' + plural;
        case 1:
            return '1 ' + singular;
        default:
            return '' + count + ' ' + plural;
        }
    };
    fromNow = function (date) {
        return moment(date).fromNow();
    };
    formatBytes = function (bytes) {
        var i, sizes;
        sizes = [
            'Bytes',
            'KB',
            'MB',
            'GB',
            'TB'
        ];
        if (bytes === 0) {
            return '0 Byte';
        }
        i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + sizes[i];
    };
    padTime = function (n) {
        return '' + (n < 10 ? '0' : '') + n;
    };
    splitTime = function (s) {
        var hrs, mins, ms, secs;
        ms = s % 1000;
        s = (s - ms) / 1000;
        secs = s % 60;
        s = (s - secs) / 60;
        mins = s % 60;
        hrs = (s - mins) / 60;
        return [
            hrs,
            mins,
            secs,
            ms
        ];
    };
    formatMilliseconds = function (s) {
        var hrs, mins, ms, secs, _ref;
        _ref = splitTime(s), hrs = _ref[0], mins = _ref[1], secs = _ref[2], ms = _ref[3];
        return '' + padTime(hrs) + ':' + padTime(mins) + ':' + padTime(secs) + '.' + ms;
    };
    format1d0 = function (n) {
        return Math.round(n * 10) / 10;
    };
    formatElapsedTime = function (s) {
        var hrs, mins, ms, secs, _ref;
        _ref = splitTime(s), hrs = _ref[0], mins = _ref[1], secs = _ref[2], ms = _ref[3];
        if (hrs !== 0) {
            return '' + format1d0((hrs * 60 + mins) / 60) + 'h';
        } else if (mins !== 0) {
            return '' + format1d0((mins * 60 + secs) / 60) + 'm';
        } else if (secs !== 0) {
            return '' + format1d0((secs * 1000 + ms) / 1000) + 's';
        } else {
            return '' + ms + 'ms';
        }
    };
    formatClockTime = function (date) {
        return moment(date).format('h:mm:ss a');
    };
    EOL = '\n';
    multilineTextToHTML = function (text) {
        return lodash.map(text.split(EOL), function (str) {
            return lodash.escape(str);
        }).join('<br/>');
    };
    sanitizeName = function (name) {
        return name.replace(/[^a-z0-9_ \(\)-]/gi, '-').trim();
    };
    highlight = function (code, lang) {
        if (window.hljs) {
            return window.hljs.highlightAuto(code, [lang]).value;
        } else {
            return code;
        }
    };
    Flow.Util = {
        describeCount: describeCount,
        fromNow: fromNow,
        formatBytes: formatBytes,
        formatMilliseconds: formatMilliseconds,
        formatElapsedTime: formatElapsedTime,
        formatClockTime: formatClockTime,
        multilineTextToHTML: multilineTextToHTML,
        uuid: (typeof window !== 'undefined' && window !== null ? window.uuid : void 0) ? window.uuid : null,
        sanitizeName: sanitizeName,
        highlight: highlight
    };
}.call(this));
(function () {
    Flow.Version = '0.5.3';
    Flow.About = function (_) {
        var _properties;
        _properties = Flow.Dataflow.signals([]);
        Flow.Dataflow.link(_.ready, function () {
            if (Flow.BuildProperties) {
                return _properties(Flow.BuildProperties);
            } else {
                return _.requestAbout(function (error, response) {
                    var name, properties, value, _i, _len, _ref, _ref1;
                    properties = [];
                    if (!error) {
                        _ref = response.entries;
                        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                            _ref1 = _ref[_i], name = _ref1.name, value = _ref1.value;
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
                    return _properties(Flow.BuildProperties = properties);
                });
            }
        });
        return { properties: _properties };
    };
}.call(this));
(function () {
    Flow.AlertDialog = function (_, _message, _opts, _go) {
        var accept;
        if (_opts == null) {
            _opts = {};
        }
        lodash.defaults(_opts, {
            title: 'Alert',
            acceptCaption: 'OK'
        });
        accept = function () {
            return _go(true);
        };
        return {
            title: _opts.title,
            acceptCaption: _opts.acceptCaption,
            message: Flow.Util.multilineTextToHTML(_message),
            accept: accept,
            template: 'alert-dialog'
        };
    };
}.call(this));
(function () {
    Flow.Browser = function (_) {
        var createNotebookView, loadNotebooks, _docs, _hasDocs, _sortedDocs;
        _docs = Flow.Dataflow.signals([]);
        _sortedDocs = Flow.Dataflow.lift(_docs, function (docs) {
            return lodash.sortBy(docs, function (doc) {
                return -doc.date().getTime();
            });
        });
        _hasDocs = Flow.Dataflow.lift(_docs, function (docs) {
            return docs.length > 0;
        });
        createNotebookView = function (notebook) {
            var load, purge, self, _date, _fromNow, _name;
            _name = notebook.name;
            _date = Flow.Dataflow.signal(new Date(notebook.timestamp_millis));
            _fromNow = Flow.Dataflow.lift(_date, Flow.Util.fromNow);
            load = function () {
                return _.confirm('This action will replace your active notebook.\nAre you sure you want to continue?', {
                    acceptCaption: 'Load Notebook',
                    declineCaption: 'Cancel'
                }, function (accept) {
                    if (accept) {
                        return _.load(_name);
                    }
                });
            };
            purge = function () {
                return _.confirm('Are you sure you want to delete this notebook?\n"' + _name + '"', {
                    acceptCaption: 'Delete',
                    declineCaption: 'Keep'
                }, function (accept) {
                    if (accept) {
                        return _.requestDeleteObject('notebook', _name, function (error) {
                            var _ref;
                            if (error) {
                                return _alert((_ref = error.message) != null ? _ref : error);
                            } else {
                                _docs.remove(self);
                                return _.growl('Notebook deleted.');
                            }
                        });
                    }
                });
            };
            return self = {
                name: _name,
                date: _date,
                fromNow: _fromNow,
                load: load,
                purge: purge
            };
        };
        loadNotebooks = function () {
            return _.requestObjects('notebook', function (error, notebooks) {
                if (error) {
                    return console.debug(error);
                } else {
                    return _docs(lodash.map(notebooks, function (notebook) {
                        return createNotebookView(notebook);
                    }));
                }
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
    };
}.call(this));
(function () {
    Flow.Cell = function (_, _renderers, type, input) {
        var activate, clear, clip, execute, navigate, select, self, toggleInput, toggleOutput, _actions, _errors, _guid, _hasError, _hasInput, _hasOutput, _input, _isActive, _isBusy, _isCode, _isInputVisible, _isOutputHidden, _isReady, _isSelected, _outputs, _render, _result, _time, _type;
        if (type == null) {
            type = 'cs';
        }
        if (input == null) {
            input = '';
        }
        _guid = lodash.uniqueId();
        _type = Flow.Dataflow.signal(type);
        _render = Flow.Dataflow.lift(_type, function (type) {
            return _renderers[type](_guid);
        });
        _isCode = Flow.Dataflow.lift(_render, function (render) {
            return render.isCode;
        });
        _isSelected = Flow.Dataflow.signal(false);
        _isActive = Flow.Dataflow.signal(false);
        _hasError = Flow.Dataflow.signal(false);
        _isBusy = Flow.Dataflow.signal(false);
        _isReady = Flow.Dataflow.lift(_isBusy, function (isBusy) {
            return !isBusy;
        });
        _time = Flow.Dataflow.signal('');
        _hasInput = Flow.Dataflow.signal(true);
        _input = Flow.Dataflow.signal(input);
        _outputs = Flow.Dataflow.signals([]);
        _errors = [];
        _result = Flow.Dataflow.signal(null);
        _hasOutput = Flow.Dataflow.lift(_outputs, function (outputs) {
            return outputs.length > 0;
        });
        _isInputVisible = Flow.Dataflow.signal(true);
        _isOutputHidden = Flow.Dataflow.signal(false);
        _actions = {};
        Flow.Dataflow.act(_isActive, function (isActive) {
            if (isActive) {
                _.selectCell(self);
                _hasInput(true);
                if (!_isCode()) {
                    _outputs([]);
                }
            }
        });
        Flow.Dataflow.act(_isSelected, function (isSelected) {
            if (!isSelected) {
                return _isActive(false);
            }
        });
        select = function () {
            _.selectCell(self, false);
            return true;
        };
        navigate = function () {
            _.selectCell(self);
            return true;
        };
        activate = function () {
            return _isActive(true);
        };
        clip = function () {
            return _.saveClip('user', _type(), _input());
        };
        toggleInput = function () {
            return _isInputVisible(!_isInputVisible());
        };
        toggleOutput = function () {
            return _isOutputHidden(!_isOutputHidden());
        };
        clear = function () {
            _result(null);
            _outputs([]);
            _errors.length = 0;
            _hasError(false);
            if (!_isCode()) {
                return _hasInput(true);
            }
        };
        execute = function (go) {
            var render, startTime;
            startTime = Date.now();
            _time('Started at ' + Flow.Util.formatClockTime(startTime));
            input = _input().trim();
            if (!input) {
                if (go) {
                    return go(null);
                } else {
                    return void 0;
                }
            }
            render = _render();
            _isBusy(true);
            clear();
            if (_type() === 'sca') {
                input = input.replace(/\\/g, '\\\\');
                input = input.replace(/'/g, '\\\'');
                input = input.replace(/\n/g, '\\n');
                input = 'runScalaCode ' + _.scalaIntpId() + ', \'' + input + '\'';
            }
            render(input, {
                data: function (result) {
                    return _outputs.push(result);
                },
                close: function (result) {
                    return _result(result);
                },
                error: function (error) {
                    _hasError(true);
                    if (error.name === 'FlowError') {
                        _outputs.push(Flow.Failure(_, error));
                    } else {
                        _outputs.push({
                            text: JSON.stringify(error, null, 2),
                            template: 'flow-raw'
                        });
                    }
                    return _errors.push(error);
                },
                end: function () {
                    _hasInput(_isCode());
                    _isBusy(false);
                    _time(Flow.Util.formatElapsedTime(Date.now() - startTime));
                    if (go) {
                        go(_hasError() ? _errors.slice(0) : null);
                    }
                }
            });
            return _isActive(false);
        };
        return self = {
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
            toggleInput: toggleInput,
            isOutputHidden: _isOutputHidden,
            toggleOutput: toggleOutput,
            select: select,
            navigate: navigate,
            activate: activate,
            execute: execute,
            clear: clear,
            clip: clip,
            _actions: _actions,
            getCursorPosition: function () {
                return _actions.getCursorPosition();
            },
            autoResize: function () {
                return _actions.autoResize();
            },
            scrollIntoView: function (immediate) {
                return _actions.scrollIntoView(immediate);
            },
            templateOf: function (view) {
                return view.template;
            },
            template: 'flow-cell'
        };
    };
}.call(this));
(function () {
    var SystemClips;
    SystemClips = [
        'assist',
        'importFiles',
        'getFrames',
        'getModels',
        'getPredictions',
        'getJobs',
        'buildModel',
        'predict'
    ];
    Flow.Clipboard = function (_) {
        var addClip, createClip, emptyTrash, initialize, lengthOf, loadUserClips, removeClip, saveUserClips, serializeUserClips, _hasTrashClips, _hasUserClips, _systemClipCount, _systemClips, _trashClipCount, _trashClips, _userClipCount, _userClips;
        lengthOf = function (array) {
            if (array.length) {
                return '(' + array.length + ')';
            } else {
                return '';
            }
        };
        _systemClips = Flow.Dataflow.signals([]);
        _systemClipCount = Flow.Dataflow.lift(_systemClips, lengthOf);
        _userClips = Flow.Dataflow.signals([]);
        _userClipCount = Flow.Dataflow.lift(_userClips, lengthOf);
        _hasUserClips = Flow.Dataflow.lift(_userClips, function (clips) {
            return clips.length > 0;
        });
        _trashClips = Flow.Dataflow.signals([]);
        _trashClipCount = Flow.Dataflow.lift(_trashClips, lengthOf);
        _hasTrashClips = Flow.Dataflow.lift(_trashClips, function (clips) {
            return clips.length > 0;
        });
        createClip = function (_list, _type, _input, _canRemove) {
            var execute, insert, self;
            if (_canRemove == null) {
                _canRemove = true;
            }
            execute = function () {
                return _.insertAndExecuteCell(_type, _input);
            };
            insert = function () {
                return _.insertCell(_type, _input);
            };
            Flow.Prelude.remove = function () {
                if (_canRemove) {
                    return removeClip(_list, self);
                }
            };
            return self = {
                type: _type,
                input: _input,
                execute: execute,
                insert: insert,
                remove: Flow.Prelude.remove,
                canRemove: _canRemove
            };
        };
        addClip = function (list, type, input) {
            return list.push(createClip(list, type, input));
        };
        removeClip = function (list, clip) {
            if (list === _userClips) {
                _userClips.remove(clip);
                saveUserClips();
                return _trashClips.push(createClip(_trashClips, clip.type, clip.input));
            } else {
                return _trashClips.remove(clip);
            }
        };
        emptyTrash = function () {
            return _trashClips.removeAll();
        };
        loadUserClips = function () {
            return _.requestObjectExists('environment', 'clips', function (error, exists) {
                if (exists) {
                    return _.requestObject('environment', 'clips', function (error, doc) {
                        if (!error) {
                            return _userClips(lodash.map(doc.clips, function (clip) {
                                return createClip(_userClips, clip.type, clip.input);
                            }));
                        }
                    });
                }
            });
        };
        serializeUserClips = function () {
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
        saveUserClips = function () {
            return _.requestPutObject('environment', 'clips', serializeUserClips(), function (error) {
                if (error) {
                    _.alert('Error saving clips: ' + error.message);
                }
            });
        };
        initialize = function () {
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
                        } else {
                            return addClip(_trashClips, type, input);
                        }
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
}.call(this));
(function () {
    Flow.Coffeescript = function (_, guid, sandbox) {
        var isRoutine, print, render, _kernel;
        _kernel = Flow.CoffeescriptKernel;
        print = function (arg) {
            if (arg !== print) {
                sandbox.results[guid].outputs(arg);
            }
            return print;
        };
        isRoutine = function (f) {
            var name, routine, _ref;
            _ref = sandbox.routines;
            for (name in _ref) {
                routine = _ref[name];
                if (f === routine) {
                    return true;
                }
            }
            return false;
        };
        render = function (input, output) {
            var cellResult, evaluate, outputBuffer, tasks;
            sandbox.results[guid] = cellResult = {
                result: Flow.Dataflow.signal(null),
                outputs: outputBuffer = Flow.Async.createBuffer([])
            };
            evaluate = function (ft) {
                if (ft != null ? ft.isFuture : void 0) {
                    return ft(function (error, result) {
                        var _ref;
                        if (error) {
                            output.error(new Flow.Error('Error evaluating cell', error));
                            return output.end();
                        } else {
                            if (result != null ? (_ref = result._flow_) != null ? _ref.render : void 0 : void 0) {
                                return output.data(result._flow_.render(function () {
                                    return output.end();
                                }));
                            } else {
                                return output.data(Flow.ObjectBrowser(_, function () {
                                    return output.end();
                                }('output', result)));
                            }
                        }
                    });
                } else {
                    return output.data(Flow.ObjectBrowser(_, function () {
                        return output.end();
                    }, 'output', ft));
                }
            };
            outputBuffer.subscribe(evaluate);
            tasks = [
                _kernel.safetyWrapCoffeescript(guid),
                _kernel.compileCoffeescript,
                _kernel.parseJavascript,
                _kernel.createRootScope(sandbox),
                _kernel.removeHoistedDeclarations,
                _kernel.rewriteJavascript(sandbox),
                _kernel.generateJavascript,
                _kernel.compileJavascript,
                _kernel.executeJavascript(sandbox, print)
            ];
            return Flow.Async.pipe(tasks)(input, function (error) {
                var result;
                if (error) {
                    output.error(error);
                }
                result = cellResult.result();
                if (lodash.isFunction(result)) {
                    if (isRoutine(result)) {
                        return print(result());
                    } else {
                        return evaluate(result);
                    }
                } else {
                    return output.close(Flow.ObjectBrowser(_, function () {
                        return output.end();
                    }, 'result', result));
                }
            });
        };
        render.isCode = true;
        return render;
    };
}.call(this));
(function () {
    Flow.ConfirmDialog = function (_, _message, _opts, _go) {
        var accept, decline;
        if (_opts == null) {
            _opts = {};
        }
        lodash.defaults(_opts, {
            title: 'Confirm',
            acceptCaption: 'Yes',
            declineCaption: 'No'
        });
        accept = function () {
            return _go(true);
        };
        decline = function () {
            return _go(false);
        };
        return {
            title: _opts.title,
            acceptCaption: _opts.acceptCaption,
            declineCaption: _opts.declineCaption,
            message: Flow.Util.multilineTextToHTML(_message),
            accept: accept,
            decline: decline,
            template: 'confirm-dialog'
        };
    };
}.call(this));
(function () {
}.call(this));
(function () {
    var traceCauses;
    traceCauses = function (error, causes) {
        causes.push(error.message);
        if (error.cause) {
            traceCauses(error.cause, causes);
        }
        return causes;
    };
    Flow.Failure = function (_, error) {
        var causes, message, toggleStack, _isStackVisible;
        causes = traceCauses(error, []);
        message = causes.shift();
        _isStackVisible = Flow.Dataflow.signal(false);
        toggleStack = function () {
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
}.call(this));
(function () {
    Flow.Form = function (_, _form, _go) {
        lodash.defer(_go);
        return {
            form: _form,
            template: 'flow-form',
            templateOf: function (control) {
                return control.template;
            }
        };
    };
}.call(this));
(function () {
    Flow.Heading = function (_, level) {
        var render;
        render = function (input, output) {
            output.data({
                text: input.trim() || '(Untitled)',
                template: 'flow-' + level
            });
            return output.end();
        };
        render.isCode = false;
        return render;
    };
}.call(this));
(function () {
    var _catalog, _homeContent, _homeMarkdown, _index;
    _catalog = null;
    _index = {};
    _homeContent = null;
    _homeMarkdown = '<blockquote>\nUsing Flow for the first time?\n<br/>\n<div style=\'margin-top:10px\'>\n  <button type=\'button\' data-action=\'get-flow\' data-pack-name=\'examples\' data-flow-name=\'QuickStartVideos.flow\' class=\'flow-button\'><i class=\'fa fa-file-movie-o\'></i><span>Quickstart Videos</span>\n  </button>\n</div>\n</blockquote>\n\nOr, <a href=\'#\' data-action=\'get-pack\' data-pack-name=\'examples\'>view example Flows</a> to explore and learn H<sub>2</sub>O.\n\n###### Star H2O on Github!\n\n<iframe src="https://ghbtns.com/github-btn.html?user=h2oai&repo=h2o-3&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>\n\n###### General\n\n%HELP_TOPICS%\n\n###### Examples\n\nFlow packs are a great way to explore and learn H<sub>2</sub>O. Try out these Flows and run them in your browser.<br/><a href=\'#\' data-action=\'get-packs\'>Browse installed packs...</a>\n\n###### H<sub>2</sub>O REST API\n\n- <a href=\'#\' data-action=\'endpoints\'>Routes</a>\n- <a href=\'#\' data-action=\'schemas\'>Schemas</a>\n';
    Flow.Help = function (_) {
        var buildToc, buildTopics, displayEndpoint, displayEndpoints, displayFlows, displayHtml, displayPacks, displaySchema, displaySchemas, fixImageSources, goBack, goForward, goHome, goTo, initialize, performAction, _canGoBack, _canGoForward, _content, _history, _historyIndex;
        _content = Flow.Dataflow.signal(null);
        _history = [];
        _historyIndex = -1;
        _canGoBack = Flow.Dataflow.signal(false);
        _canGoForward = Flow.Dataflow.signal(false);
        goTo = function (index) {
            var content;
            content = _history[_historyIndex = index];
            $('a, button', $(content)).each(function (i) {
                var $a, action;
                $a = $(this);
                if (action = $a.attr('data-action')) {
                    return $a.click(function () {
                        return performAction(action, $a);
                    });
                }
            });
            _content(content);
            _canGoForward(_historyIndex < _history.length - 1);
            _canGoBack(_historyIndex > 0);
        };
        goBack = function () {
            if (_historyIndex > 0) {
                return goTo(_historyIndex - 1);
            }
        };
        goForward = function () {
            if (_historyIndex < _history.length - 1) {
                return goTo(_historyIndex + 1);
            }
        };
        displayHtml = function (content) {
            if (_historyIndex < _history.length - 1) {
                _history.splice(_historyIndex + 1, _history.length - (_historyIndex + 1), content);
            } else {
                _history.push(content);
            }
            return goTo(_history.length - 1);
        };
        fixImageSources = function (html) {
            return html.replace(/\s+src\s*\=\s*\"images\//g, ' src="help/images/');
        };
        performAction = function (action, $el) {
            var packName, routeIndex, schemaName, topic;
            switch (action) {
            case 'help':
                topic = _index[$el.attr('data-topic')];
                _.requestHelpContent(topic.name, function (error, html) {
                    var contents, div, h5, h6, mark, _ref;
                    _ref = Flow.HTML.template('div', 'mark', 'h5', 'h6'), div = _ref[0], mark = _ref[1], h5 = _ref[2], h6 = _ref[3];
                    contents = [
                        mark('Help'),
                        h5(topic.title),
                        fixImageSources(div(html))
                    ];
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
                _.requestPacks(function (error, packNames) {
                    if (!error) {
                        return displayPacks(lodash.filter(packNames, function (packName) {
                            return packName !== 'test';
                        }));
                    }
                });
                break;
            case 'get-pack':
                packName = $el.attr('data-pack-name');
                _.requestPack(packName, function (error, flowNames) {
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
                    var flowName;
                    if (accept) {
                        packName = $el.attr('data-pack-name');
                        flowName = $el.attr('data-flow-name');
                        if (H2O.Util.validateFileExtension(flowName, '.flow')) {
                            return _.requestFlow(packName, flowName, function (error, flow) {
                                if (!error) {
                                    return _.open(H2O.Util.getFileBaseName(flowName, '.flow'), flow);
                                }
                            });
                        }
                    }
                });
                break;
            case 'endpoints':
                _.requestEndpoints(function (error, response) {
                    if (!error) {
                        return displayEndpoints(response.routes);
                    }
                });
                break;
            case 'endpoint':
                routeIndex = $el.attr('data-index');
                _.requestEndpoint(routeIndex, function (error, response) {
                    if (!error) {
                        return displayEndpoint(lodash.head(response.routes));
                    }
                });
                break;
            case 'schemas':
                _.requestSchemas(function (error, response) {
                    if (!error) {
                        return displaySchemas(lodash.sortBy(response.schemas, function (schema) {
                            return schema.name;
                        }));
                    }
                });
                break;
            case 'schema':
                schemaName = $el.attr('data-schema');
                _.requestSchema(schemaName, function (error, response) {
                    if (!error) {
                        return displaySchema(lodash.head(response.schemas));
                    }
                });
            }
        };
        buildToc = function (nodes) {
            var a, li, ul, _ref;
            _ref = Flow.HTML.template('ul', 'li', 'a href=\'#\' data-action=\'help\' data-topic=\'$1\''), ul = _ref[0], li = _ref[1], a = _ref[2];
            return ul(lodash.map(nodes, function (node) {
                return li(a(node.title, node.name));
            }));
        };
        buildTopics = function (index, topics) {
            var topic, _i, _len;
            for (_i = 0, _len = topics.length; _i < _len; _i++) {
                topic = topics[_i];
                index[topic.name] = topic;
                if (topic.children.length) {
                    buildTopics(index, topic.children);
                }
            }
            return _results;
          }();
          return _checkedModelCount(checkedViews.length);
        });
        var predict = function predict() {
          return _.insertAndExecuteCell('cs', 'predict model: ' + flowPrelude$49.stringify(model_id.name));
        };
        displayPacks = function (packNames) {
            var a, div, h5, i, mark, p, _ref;
            _ref = Flow.HTML.template('div', 'mark', 'h5', 'p', 'i.fa.fa-folder-o', 'a href=\'#\' data-action=\'get-pack\' data-pack-name=\'$1\''), div = _ref[0], mark = _ref[1], h5 = _ref[2], p = _ref[3], i = _ref[4], a = _ref[5];
            displayHtml(Flow.HTML.render('div', div([
                mark('Packs'),
                h5('Installed Packs'),
                div(lodash.map(packNames, function (packName) {
                    return p([
                        i(),
                        a(packName, packName)
                    ]);
                }))
            ])));
        };
        displayFlows = function (packName, flowNames) {
            var a, div, h5, i, mark, p, _ref;
            _ref = Flow.HTML.template('div', 'mark', 'h5', 'p', 'i.fa.fa-file-text-o', 'a href=\'#\' data-action=\'get-flow\' data-pack-name=\'' + packName + '\' data-flow-name=\'$1\''), div = _ref[0], mark = _ref[1], h5 = _ref[2], p = _ref[3], i = _ref[4], a = _ref[5];
            displayHtml(Flow.HTML.render('div', div([
                mark('Pack'),
                h5(packName),
                div(lodash.map(flowNames, function (flowName) {
                    return p([
                        i(),
                        a(flowName, flowName)
                    ]);
                }))
            ])));
        };
        displayEndpoints = function (routes) {
            var action, code, div, els, h5, mark, p, route, routeIndex, _i, _len, _ref;
            _ref = Flow.HTML.template('div', 'mark', 'h5', 'p', 'a href=\'#\' data-action=\'endpoint\' data-index=\'$1\'', 'code'), div = _ref[0], mark = _ref[1], h5 = _ref[2], p = _ref[3], action = _ref[4], code = _ref[5];
            els = [
                mark('API'),
                h5('List of Routes')
            ];
            for (routeIndex = _i = 0, _len = routes.length; _i < _len; routeIndex = ++_i) {
                route = routes[routeIndex];
                els.push(p(action(code(route.http_method + ' ' + route.url_pattern), routeIndex) + '<br/>' + route.summary));
            }
            displayHtml(Flow.HTML.render('div', div(els)));
        };
        goHome = function () {
            return displayHtml(Flow.HTML.render('div', _homeContent));
        };
        displayEndpoint = function (route) {
            var action, code, div, h5, h6, mark, p, _ref, _ref1;
            _ref = Flow.HTML.template('div', 'mark', 'h5', 'h6', 'p', 'a href=\'#\' data-action=\'schema\' data-schema=\'$1\'', 'code'), div = _ref[0], mark = _ref[1], h5 = _ref[2], h6 = _ref[3], p = _ref[4], action = _ref[5], code = _ref[6];
            return displayHtml(Flow.HTML.render('div', div([
                mark('Route'),
                h5(route.url_pattern),
                h6('Method'),
                p(code(route.http_method)),
                h6('Summary'),
                p(route.summary),
                h6('Parameters'),
                p(((_ref1 = route.path_params) != null ? _ref1.length : void 0) ? route.path_params.join(', ') : '-'),
                h6('Input Schema'),
                p(action(code(route.input_schema), route.input_schema)),
                h6('Output Schema'),
                p(action(code(route.output_schema), route.output_schema))
            ])));
        };
        displaySchemas = function (schemas) {
            var action, code, div, els, h5, li, mark, schema, ul, variable, _ref;
            _ref = Flow.HTML.template('div', 'h5', 'ul', 'li', 'var', 'mark', 'code', 'a href=\'#\' data-action=\'schema\' data-schema=\'$1\''), div = _ref[0], h5 = _ref[1], ul = _ref[2], li = _ref[3], variable = _ref[4], mark = _ref[5], code = _ref[6], action = _ref[7];
            els = [
                mark('API'),
                h5('List of Schemas'),
                ul(function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = schemas.length; _i < _len; _i++) {
                        schema = schemas[_i];
                        _results.push(li('' + action(code(schema.name), schema.name) + ' ' + variable(lodash.escape(schema.type))));
                    }
                    return _results;
                }())
            ];
            return displayHtml(Flow.HTML.render('div', div(els)));
        };
        displaySchema = function (schema) {
            var code, content, div, field, h5, h6, mark, p, small, variable, _i, _len, _ref, _ref1;
            _ref = Flow.HTML.template('div', 'mark', 'h5', 'h6', 'p', 'code', 'var', 'small'), div = _ref[0], mark = _ref[1], h5 = _ref[2], h6 = _ref[3], p = _ref[4], code = _ref[5], variable = _ref[6], small = _ref[7];
            content = [
                mark('Schema'),
                h5('' + schema.name + ' (' + lodash.escape(schema.type) + ')'),
                h6('Fields')
            ];
            _ref1 = schema.fields;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                field = _ref1[_i];
                if (field.name !== '__meta') {
                    content.push(p('' + variable(field.name) + (field.required ? '*' : '') + ' ' + code(lodash.escape(field.type)) + '<br/>' + small(field.help)));
                }
            }
            return displayHtml(Flow.HTML.render('div', div(content)));
        };
        initialize = function (catalog) {
            _catalog = catalog;
            buildTopics(_index, _catalog);
            _homeContent = marked(_homeMarkdown).replace('%HELP_TOPICS%', buildToc(_catalog));
            return goHome();
        };
        Flow.Dataflow.link(_.ready, function () {
            return _.requestHelpIndex(function (error, catalog) {
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
}.call(this));
(function () {
    Flow.Markdown = function (_) {
        var render;
        render = function (input, output) {
            var error;
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
    };
}.call(this));
(function () {
    var __slice = [].slice;
    Flow.Renderers = function (_, _sandbox) {
        return {
            h1: function () {
                return Flow.Heading(_, 'h1');
            },
            h2: function () {
                return Flow.Heading(_, 'h2');
            },
            h3: function () {
                return Flow.Heading(_, 'h3');
            },
            h4: function () {
                return Flow.Heading(_, 'h4');
            },
            h5: function () {
                return Flow.Heading(_, 'h5');
            },
            h6: function () {
                return Flow.Heading(_, 'h6');
            },
            md: function () {
                return Flow.Markdown(_);
            },
            cs: function (guid) {
                return Flow.Coffeescript(_, guid, _sandbox);
            },
            sca: function (guid) {
                return Flow.Coffeescript(_, guid, _sandbox);
            },
            raw: function () {
                return Flow.Raw(_);
            }
        };
    };
    Flow.Notebook = function (_, _renderers) {
        var appendCell, appendCellAndRun, checkConsistency, checkIfNameIsInUse, clearAllCells, clearCell, cloneCell, continueRunningAllCells, convertCellToCode, convertCellToHeading, convertCellToMarkdown, convertCellToRaw, convertCellToScala, copyCell, createCell, createMenu, createMenuHeader, createMenuItem, createNotebook, createShortcutHint, createTool, cutCell, deleteCell, deserialize, displayAbout, displayDocumentation, displayFAQ, displayKeyboardShortcuts, duplicateNotebook, editModeKeyboardShortcuts, editModeKeyboardShortcutsHelp, editName, executeAllCells, executeCommand, exportNotebook, findBuildProperty, getBuildProperties, goToH2OUrl, goToUrl, initialize, initializeMenus, insertAbove, insertBelow, insertCell, insertCellAbove, insertCellAboveAndRun, insertCellBelow, insertCellBelowAndRun, insertNewCellAbove, insertNewCellBelow, insertNewScalaCellAbove, insertNewScalaCellBelow, loadNotebook, menuCell, menuCellSW, menuDivider, mergeCellAbove, mergeCellBelow, moveCellDown, moveCellUp, normalModeKeyboardShortcuts, normalModeKeyboardShortcutsHelp, notImplemented, openNotebook, pasteCellAbove, pasteCellBelow, pasteCellandReplace, promptForNotebook, removeCell, runAllCells, runCell, runCellAndInsertBelow, runCellAndSelectBelow, saveName, saveNotebook, selectCell, selectNextCell, selectPreviousCell, serialize, setupKeyboardHandling, setupMenus, showBrowser, showClipboard, showHelp, showOutline, shutdown, splitCell, startTour, stopRunningAll, storeNotebook, switchToCommandMode, switchToEditMode, toKeyboardHelp, toggleAllInputs, toggleAllOutputs, toggleInput, toggleOutput, toggleSidebar, undoLastDelete, uploadFile, _about, _areInputsHidden, _areOutputsHidden, _cells, _clipboardCell, _dialogs, _initializeInterpreter, _isEditingName, _isRunningAll, _isSidebarHidden, _lastDeletedCell, _localName, _menus, _remoteName, _runningCaption, _runningCellInput, _runningPercent, _selectedCell, _selectedCellIndex, _sidebar, _status, _toolbar;
        _localName = Flow.Dataflow.signal('Untitled Flow');
        Flow.Dataflow.react(_localName, function (name) {
            return document.title = 'H2O' + (name && name.trim() ? '- ' + name : '');
        });
        _remoteName = Flow.Dataflow.signal(null);
        _isEditingName = Flow.Dataflow.signal(false);
        editName = function () {
            return _isEditingName(true);
        };
        saveName = function () {
            return _isEditingName(false);
        };
        _cells = Flow.Dataflow.signals([]);
        _selectedCell = null;
        _selectedCellIndex = -1;
        _clipboardCell = null;
        _lastDeletedCell = null;
        _areInputsHidden = Flow.Dataflow.signal(false);
        _areOutputsHidden = Flow.Dataflow.signal(false);
        _isSidebarHidden = Flow.Dataflow.signal(false);
        _isRunningAll = Flow.Dataflow.signal(false);
        _runningCaption = Flow.Dataflow.signal('Running');
        _runningPercent = Flow.Dataflow.signal('0%');
        _runningCellInput = Flow.Dataflow.signal('');
        _status = Flow.Status(_);
        _sidebar = Flow.Sidebar(_, _cells);
        _about = Flow.About(_);
        _dialogs = Flow.Dialogs(_);
        _initializeInterpreter = function () {
            return _.requestScalaIntp(function (error, response) {
                if (error) {
                    return _.scalaIntpId(-1);
                } else {
                    return _.scalaIntpId(response.session_id);
                }
            });
        };
        serialize = function () {
            var cell, cells;
            cells = function () {
                var _i, _len, _ref, _results;
                _ref = _cells();
                _results = [];
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
        };
        deserialize = function (localName, remoteName, doc) {
            var cell, cells, _i, _len, _ref;
            _localName(localName);
            _remoteName(remoteName);
            cells = function () {
                var _i, _len, _ref, _results;
                _ref = doc.cells;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    cell = _ref[_i];
                    _results.push(createCell(cell.type, cell.input));
                }
                return _results;
            }();
            _cells(cells);
            selectCell(lodash.head(cells));
            _ref = _cells();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                cell = _ref[_i];
                if (!cell.isCode()) {
                    cell.execute();
                }
            }
        };
        createCell = function (type, input) {
            if (type == null) {
                type = 'cs';
            }
            if (input == null) {
                input = '';
            }
            return Flow.Cell(_, _renderers, type, input);
        };
        checkConsistency = function () {
            var cell, i, selectionCount, _i, _len, _ref;
            selectionCount = 0;
            _ref = _cells();
            for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                cell = _ref[i];
                if (!cell) {
                    error('index ' + i + ' is empty');
                } else {
                    if (cell.isSelected()) {
                        selectionCount++;
                    }
                }
            }
            if (selectionCount !== 1) {
                error('selected cell count = ' + selectionCount);
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
        selectCell = function (target, scrollIntoView, scrollImmediately) {
            if (scrollIntoView == null) {
                scrollIntoView = true;
            }
            if (scrollImmediately == null) {
                scrollImmediately = false;
            }
            if (_selectedCell === target) {
                return;
            }
            if (_selectedCell) {
                _selectedCell.isSelected(false);
            }
            _selectedCell = target;
            _selectedCell.isSelected(true);
            _selectedCellIndex = _cells.indexOf(_selectedCell);
            checkConsistency();
            if (scrollIntoView) {
                lodash.defer(function () {
                    return _selectedCell.scrollIntoView(scrollImmediately);
                });
            }
            return _selectedCell;
        };
        cloneCell = function (cell) {
            return createCell(cell.type(), cell.input());
        };
        switchToCommandMode = function () {
            return _selectedCell.isActive(false);
        };
        switchToEditMode = function () {
            _selectedCell.isActive(true);
            return false;
        };
        convertCellToCode = function () {
            return _selectedCell.type('cs');
        };
        convertCellToHeading = function (level) {
            return function () {
                _selectedCell.type('h' + level);
                return _selectedCell.execute();
            };
        };
        convertCellToMarkdown = function () {
            _selectedCell.type('md');
            return _selectedCell.execute();
        };
        convertCellToRaw = function () {
            _selectedCell.type('raw');
            return _selectedCell.execute();
        };
        convertCellToScala = function () {
            return _selectedCell.type('sca');
        };
        copyCell = function () {
            return _clipboardCell = _selectedCell;
        };
        cutCell = function () {
            copyCell();
            return removeCell();
        };
        deleteCell = function () {
            _lastDeletedCell = _selectedCell;
            return removeCell();
        };
        removeCell = function () {
            var cells, removedCell;
            cells = _cells();
            if (cells.length > 1) {
                if (_selectedCellIndex === cells.length - 1) {
                    removedCell = lodash.head(_cells.splice(_selectedCellIndex, 1));
                    selectCell(cells[_selectedCellIndex - 1]);
                } else {
                    removedCell = lodash.head(_cells.splice(_selectedCellIndex, 1));
                    selectCell(cells[_selectedCellIndex]);
                }
                if (removedCell) {
                    _.saveClip('trash', removedCell.type(), removedCell.input());
                }
            }
        };
        insertCell = function (index, cell) {
            _cells.splice(index, 0, cell);
            selectCell(cell);
            return cell;
        };
        insertAbove = function (cell) {
            return insertCell(_selectedCellIndex, cell);
        };
        insertBelow = function (cell) {
            return insertCell(_selectedCellIndex + 1, cell);
        };
        appendCell = function (cell) {
            return insertCell(_cells().length, cell);
        };
        insertCellAbove = function (type, input) {
            return insertAbove(createCell(type, input));
        };
        insertCellBelow = function (type, input) {
            return insertBelow(createCell(type, input));
        };
        insertNewCellAbove = function () {
            return insertAbove(createCell('cs'));
        };
        insertNewCellBelow = function () {
            return insertBelow(createCell('cs'));
        };
        insertNewScalaCellAbove = function () {
            return insertAbove(createCell('sca'));
        };
        insertNewScalaCellBelow = function () {
            return insertBelow(createCell('sca'));
        };
        insertCellAboveAndRun = function (type, input) {
            var cell;
            cell = insertAbove(createCell(type, input));
            cell.execute();
            return cell;
        };
        insertCellBelowAndRun = function (type, input) {
            var cell;
            cell = insertBelow(createCell(type, input));
            cell.execute();
            return cell;
        };
        appendCellAndRun = function (type, input) {
            var cell;
            cell = appendCell(createCell(type, input));
            cell.execute();
            return cell;
        };
        moveCellDown = function () {
            var cells;
            cells = _cells();
            if (_selectedCellIndex !== cells.length - 1) {
                _cells.splice(_selectedCellIndex, 1);
                _selectedCellIndex++;
                _cells.splice(_selectedCellIndex, 0, _selectedCell);
            }
        };
        moveCellUp = function () {
            var cells;
            if (_selectedCellIndex !== 0) {
                cells = _cells();
                _cells.splice(_selectedCellIndex, 1);
                _selectedCellIndex--;
                _cells.splice(_selectedCellIndex, 0, _selectedCell);
            }
        };
        mergeCellBelow = function () {
            var cells, nextCell;
            cells = _cells();
            if (_selectedCellIndex !== cells.length - 1) {
                nextCell = cells[_selectedCellIndex + 1];
                if (_selectedCell.type() === nextCell.type()) {
                    nextCell.input(_selectedCell.input() + '\n' + nextCell.input());
                    removeCell();
                }
            }
        };
        splitCell = function () {
            var cursorPosition, input, left, right;
            if (_selectedCell.isActive()) {
                input = _selectedCell.input();
                if (input.length > 1) {
                    cursorPosition = _selectedCell.getCursorPosition();
                    if (0 < cursorPosition && cursorPosition < input.length - 1) {
                        left = input.substr(0, cursorPosition);
                        right = input.substr(cursorPosition);
                        _selectedCell.input(left);
                        insertCell(_selectedCellIndex + 1, createCell('cs', right));
                        _selectedCell.isActive(true);
                    }
                }
            }
        };
        pasteCellAbove = function () {
            if (_clipboardCell) {
                return insertCell(_selectedCellIndex, cloneCell(_clipboardCell));
            }
        };
        pasteCellBelow = function () {
            if (_clipboardCell) {
                return insertCell(_selectedCellIndex + 1, cloneCell(_clipboardCell));
            }
        };
        undoLastDelete = function () {
            if (_lastDeletedCell) {
                insertCell(_selectedCellIndex + 1, _lastDeletedCell);
            }
            return _lastDeletedCell = null;
        };
        runCell = function () {
            _selectedCell.execute();
            return false;
        };
        runCellAndInsertBelow = function () {
            _selectedCell.execute(function () {
                return insertNewCellBelow();
            });
            return false;
        };
        runCellAndSelectBelow = function () {
            _selectedCell.execute(function () {
                return selectNextCell();
            });
            return false;
        };
        checkIfNameIsInUse = function (name, go) {
            return _.requestObjectExists('notebook', name, function (error, exists) {
                return go(exists);
            });
        };
        storeNotebook = function (localName, remoteName) {
            return _.requestPutObject('notebook', localName, serialize(), function (error) {
                if (error) {
                    return _.alert('Error saving notebook: ' + error.message);
                } else {
                    _remoteName(localName);
                    _localName(localName);
                    if (remoteName !== localName) {
                        return _.requestDeleteObject('notebook', remoteName, function (error) {
                            if (error) {
                                _.alert('Error deleting remote notebook [' + remoteName + ']: ' + error.message);
                            }
                            return _.saved();
                        });
                    } else {
                        return _.saved();
                    }
                }
            });
        };
        saveNotebook = function () {
            var localName, remoteName;
            localName = Flow.Util.sanitizeName(_localName());
            if (localName === '') {
                return _.alert('Invalid notebook name.');
            }
            remoteName = _remoteName();
            if (remoteName) {
                storeNotebook(localName, remoteName);
            } else {
                checkIfNameIsInUse(localName, function (isNameInUse) {
                    if (isNameInUse) {
                        return _.confirm('A notebook with that name already exists.\nDo you want to replace it with the one you\'re saving?', {
                            acceptCaption: 'Replace',
                            declineCaption: 'Cancel'
                        }, function (accept) {
                            if (accept) {
                                return storeNotebook(localName, remoteName);
                            }
                        });
                    } else {
                        return storeNotebook(localName, remoteName);
                    }
                });
            }
        };
        promptForNotebook = function () {
            return _.dialog(Flow.FileOpenDialog, function (result) {
                var error, filename, _ref;
                if (result) {
                    error = result.error, filename = result.filename;
                    if (error) {
                        return _.growl((_ref = error.message) != null ? _ref : error);
                    } else {
                        loadNotebook(filename);
                        return _.loaded();
                    }
                }
            });
        };
        uploadFile = function () {
            return _.dialog(Flow.FileUploadDialog, function (result) {
                var error, _ref;
                if (result) {
                    error = result.error;
                    if (error) {
                        return _.growl((_ref = error.message) != null ? _ref : error);
                    } else {
                        _.growl('File uploaded successfully!');
                        return _.insertAndExecuteCell('cs', 'setupParse source_frames: [ ' + Flow.Prelude.stringify(result.result.destination_frame) + ']');
                    }
                }
            });
        };
        toggleInput = function () {
            return _selectedCell.toggleInput();
        };
        toggleOutput = function () {
            return _selectedCell.toggleOutput();
        };
        toggleAllInputs = function () {
            var cell, wereHidden, _i, _len, _ref;
            wereHidden = _areInputsHidden();
            _areInputsHidden(!wereHidden);
            if (wereHidden) {
                _ref = _cells();
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    cell = _ref[_i];
                    cell.autoResize();
                }
            }
        };
        toggleAllOutputs = function () {
            return _areOutputsHidden(!_areOutputsHidden());
        };
        toggleSidebar = function () {
            return _isSidebarHidden(!_isSidebarHidden());
        };
        showBrowser = function () {
            _isSidebarHidden(false);
            return _.showBrowser();
        };
        showOutline = function () {
            _isSidebarHidden(false);
            return _.showOutline();
        };
        showClipboard = function () {
            _isSidebarHidden(false);
            return _.showClipboard();
        };
        selectNextCell = function () {
            var cells;
            cells = _cells();
            if (_selectedCellIndex !== cells.length - 1) {
                selectCell(cells[_selectedCellIndex + 1]);
            }
            return false;
        };
        selectPreviousCell = function () {
            var cells;
            if (_selectedCellIndex !== 0) {
                cells = _cells();
                selectCell(cells[_selectedCellIndex - 1]);
            }
            return false;
        };
        displayKeyboardShortcuts = function () {
            return $('#keyboardHelpDialog').modal();
        };
        findBuildProperty = function (caption) {
            var entry;
            if (Flow.BuildProperties) {
                if (entry = lodash.find(Flow.BuildProperties, function (entry) {
                        return entry.caption === caption;
                    })) {
                    return entry.value;
                } else {
                    return void 0;
                }
            } else {
                return void 0;
            }
        };
        getBuildProperties = function () {
            var projectVersion;
            projectVersion = findBuildProperty('H2O Build project version');
            return [
                findBuildProperty('H2O Build git branch'),
                projectVersion,
                projectVersion ? lodash.last(projectVersion.split('.')) : void 0,
                findBuildProperty('H2O Build git hash') || 'master'
            ];
        };
        displayDocumentation = function () {
            var buildVersion, gitBranch, gitHash, projectVersion, _ref;
            _ref = getBuildProperties(), gitBranch = _ref[0], projectVersion = _ref[1], buildVersion = _ref[2], gitHash = _ref[3];
            if (buildVersion && buildVersion !== '99999') {
                return window.open('http://h2o-release.s3.amazonaws.com/h2o/' + gitBranch + '/' + buildVersion + '/docs-website/h2o-docs/index.html', '_blank');
            } else {
                return window.open('https://github.com/h2oai/h2o-3/blob/' + gitHash + '/h2o-docs/src/product/flow/README.md', '_blank');
            }
        };
        displayFAQ = function () {
            var buildVersion, gitBranch, gitHash, projectVersion, _ref;
            _ref = getBuildProperties(), gitBranch = _ref[0], projectVersion = _ref[1], buildVersion = _ref[2], gitHash = _ref[3];
            if (buildVersion && buildVersion !== '99999') {
                return window.open('http://h2o-release.s3.amazonaws.com/h2o/' + gitBranch + '/' + buildVersion + '/docs-website/h2o-docs/index.html', '_blank');
            } else {
                return window.open('https://github.com/h2oai/h2o-3/blob/' + gitHash + '/h2o-docs/src/product/howto/FAQ.md', '_blank');
            }
        };
        executeCommand = function (command) {
            return function () {
                return _.insertAndExecuteCell('cs', command);
            };
        };
        displayAbout = function () {
            return $('#aboutDialog').modal();
        };
        shutdown = function () {
            return _.requestShutdown(function (error, result) {
                if (error) {
                    return _.growl('Shutdown failed: ' + error.message, 'danger');
                } else {
                    return _.growl('Shutdown complete!', 'warning');
                }
            });
        };
        showHelp = function () {
            _isSidebarHidden(false);
            return _.showHelp();
        };
        createNotebook = function () {
            return _.confirm('This action will replace your active notebook.\nAre you sure you want to continue?', {
                acceptCaption: 'Create New Notebook',
                declineCaption: 'Cancel'
            }, function (accept) {
                var currentTime;
                if (accept) {
                    currentTime = new Date().getTime();
                    return deserialize('Untitled Flow', null, {
                        cells: [{
                                type: 'cs',
                                input: ''
                            }]
                    });
                }
            });
        };
        duplicateNotebook = function () {
            return deserialize('Copy of ' + _localName(), null, serialize());
        };
        openNotebook = function (name, doc) {
            return deserialize(name, null, doc);
        };
        loadNotebook = function (name) {
            return _.requestObject('notebook', name, function (error, doc) {
                var _ref;
                if (error) {
                    return _.alert((_ref = error.message) != null ? _ref : error);
                } else {
                    return deserialize(name, name, doc);
                }
            });
        };
        exportNotebook = function () {
            var remoteName;
            if (remoteName = _remoteName()) {
                return window.open('/3/NodePersistentStorage.bin/notebook/' + remoteName, '_blank');
            } else {
                return _.alert('Please save this notebook before exporting.');
            }
        };
        goToH2OUrl = function (url) {
            return function () {
                return window.open(window.Flow.ContextPath + url, '_blank');
            };
        };
        goToUrl = function (url) {
            return function () {
                return window.open(url, '_blank');
            };
        };
        executeAllCells = function (fromBeginning, go) {
            var cellCount, cellIndex, cells, executeNextCell;
            _isRunningAll(true);
            cells = _cells().slice(0);
            cellCount = cells.length;
            cellIndex = 0;
            if (!fromBeginning) {
                cells = cells.slice(_selectedCellIndex);
                cellIndex = _selectedCellIndex;
            }
            executeNextCell = function () {
                var cell;
                if (_isRunningAll()) {
                    cell = cells.shift();
                    if (cell) {
                        cell.scrollIntoView(true);
                        cellIndex++;
                        _runningCaption('Running cell ' + cellIndex + ' of ' + cellCount);
                        _runningPercent('' + Math.floor(100 * cellIndex / cellCount) + '%');
                        _runningCellInput(cell.input());
                        return cell.execute(function (errors) {
                            if (errors) {
                                return go('failed', errors);
                            } else {
                                return executeNextCell();
                            }
                        });
                    } else {
                        return go('done');
                    }
                } else {
                    return go('aborted');
                }
            };
            return executeNextCell();
        };
        runAllCells = function (fromBeginning) {
            if (fromBeginning == null) {
                fromBeginning = true;
            }
            return executeAllCells(fromBeginning, function (status) {
                _isRunningAll(false);
                switch (status) {
                case 'aborted':
                    return _.growl('Stopped running your flow.', 'warning');
                case 'failed':
                    return _.growl('Failed running your flow.', 'danger');
                default:
                    return _.growl('Finished running your flow!', 'success');
                }
            });
        };
        continueRunningAllCells = function () {
            return runAllCells(false);
        };
        stopRunningAll = function () {
            return _isRunningAll(false);
        };
        clearCell = function () {
            _selectedCell.clear();
            return _selectedCell.autoResize();
        };
        clearAllCells = function () {
            var cell, _i, _len, _ref;
            _ref = _cells();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                cell = _ref[_i];
                cell.clear();
                cell.autoResize();
            }
        };
        notImplemented = function () {
        };
        pasteCellandReplace = notImplemented;
        mergeCellAbove = notImplemented;
        startTour = notImplemented;
        createMenu = function (label, items) {
            return {
                label: label,
                items: items
            };
        };
        createMenuHeader = function (label) {
            return {
                label: label,
                action: null
            };
        };
        createShortcutHint = function (shortcut) {
            return '<span style=\'float:right\'>' + lodash.map(shortcut, function (key) {
                return '<kbd>' + key + '</kbd>';
            }).join(' ') + '</span>';
        };
        createMenuItem = function (label, action, shortcut) {
            var kbds;
            kbds = shortcut ? createShortcutHint(shortcut) : '';
            return {
                label: '' + lodash.escape(label) + kbds,
                action: action
            };
        };
        menuDivider = {
            label: null,
            action: null
        };
        _menus = Flow.Dataflow.signal(null);
        menuCell = [
            createMenuItem('Run Cell', runCell, [
                'ctrl',
                'enter'
            ]),
            menuDivider,
            createMenuItem('Cut Cell', cutCell, ['x']),
            createMenuItem('Copy Cell', copyCell, ['c']),
            createMenuItem('Paste Cell Above', pasteCellAbove, [
                'shift',
                'v'
            ]),
            createMenuItem('Paste Cell Below', pasteCellBelow, ['v']),
            createMenuItem('Delete Cell', deleteCell, [
                'd',
                'd'
            ]),
            createMenuItem('Undo Delete Cell', undoLastDelete, ['z']),
            menuDivider,
            createMenuItem('Move Cell Up', moveCellUp, [
                'ctrl',
                'k'
            ]),
            createMenuItem('Move Cell Down', moveCellDown, [
                'ctrl',
                'j'
            ]),
            menuDivider,
            createMenuItem('Insert Cell Above', insertNewCellAbove, ['a']),
            createMenuItem('Insert Cell Below', insertNewCellBelow, ['b']),
            menuDivider,
            createMenuItem('Toggle Cell Input', toggleInput),
            createMenuItem('Toggle Cell Output', toggleOutput, ['o']),
            createMenuItem('Clear Cell Output', clearCell)
        ];
        menuCellSW = [
            menuDivider,
            createMenuItem('Insert Scala Cell Above', insertNewScalaCellAbove),
            createMenuItem('Insert Scala Cell Below', insertNewScalaCellBelow)
        ];
        if (_.onSparklingWater) {
            menuCell = __slice.call(menuCell).concat(__slice.call(menuCellSW));
        }
        initializeMenus = function (builder) {
            var modelMenuItems;
            modelMenuItems = lodash.map(builder, function (builder) {
                return createMenuItem('' + builder.algo_full_name + '...', executeCommand('buildModel ' + Flow.Prelude.stringify(builder.algo)));
            }).concat([
                menuDivider,
                createMenuItem('List All Models', executeCommand('getModels')),
                createMenuItem('List Grid Search Results', executeCommand('getGrids')),
                createMenuItem('Import Model...', executeCommand('importModel')),
                createMenuItem('Export Model...', executeCommand('exportModel'))
            ]);
            return [
                createMenu('Flow', [
                    createMenuItem('New Flow', createNotebook),
                    createMenuItem('Open Flow...', promptForNotebook),
                    createMenuItem('Save Flow', saveNotebook, ['s']),
                    createMenuItem('Make a Copy...', duplicateNotebook),
                    menuDivider,
                    createMenuItem('Run All Cells', runAllCells),
                    createMenuItem('Run All Cells Below', continueRunningAllCells),
                    menuDivider,
                    createMenuItem('Toggle All Cell Inputs', toggleAllInputs),
                    createMenuItem('Toggle All Cell Outputs', toggleAllOutputs),
                    createMenuItem('Clear All Cell Outputs', clearAllCells),
                    menuDivider,
                    createMenuItem('Download this Flow...', exportNotebook)
                ]),
                createMenu('Cell', menuCell),
                createMenu('Data', [
                    createMenuItem('Import Files...', executeCommand('importFiles')),
                    createMenuItem('Upload File...', uploadFile),
                    createMenuItem('Split Frame...', executeCommand('splitFrame')),
                    createMenuItem('Merge Frames...', executeCommand('mergeFrames')),
                    menuDivider,
                    createMenuItem('List All Frames', executeCommand('getFrames')),
                    menuDivider,
                    createMenuItem('Impute...', executeCommand('imputeColumn'))
                ]),
                createMenu('Model', modelMenuItems),
                createMenu('Score', [
                    createMenuItem('Predict...', executeCommand('predict')),
                    createMenuItem('Partial Dependence Plots...', executeCommand('buildPartialDependence')),
                    menuDivider,
                    createMenuItem('List All Predictions', executeCommand('getPredictions'))
                ]),
                createMenu('Admin', [
                    createMenuItem('Jobs', executeCommand('getJobs')),
                    createMenuItem('Cluster Status', executeCommand('getCloud')),
                    createMenuItem('Water Meter (CPU meter)', goToH2OUrl('perfbar.html')),
                    menuDivider,
                    createMenuHeader('Inspect Log'),
                    createMenuItem('View Log', executeCommand('getLogFile')),
                    createMenuItem('Download Logs', goToH2OUrl('3/Logs/download')),
                    menuDivider,
                    createMenuHeader('Advanced'),
                    createMenuItem('Create Synthetic Frame...', executeCommand('createFrame')),
                    createMenuItem('Stack Trace', executeCommand('getStackTrace')),
                    createMenuItem('Network Test', executeCommand('testNetwork')),
                    createMenuItem('Profiler', executeCommand('getProfile depth: 10')),
                    createMenuItem('Timeline', executeCommand('getTimeline')),
                    createMenuItem('Shut Down', shutdown)
                ]),
                createMenu('Help', [
                    createMenuItem('Assist Me', executeCommand('assist')),
                    menuDivider,
                    createMenuItem('Contents', showHelp),
                    createMenuItem('Keyboard Shortcuts', displayKeyboardShortcuts, ['h']),
                    menuDivider,
                    createMenuItem('Documentation', displayDocumentation),
                    createMenuItem('FAQ', displayFAQ),
                    createMenuItem('H2O.ai', goToUrl('http://h2o.ai/')),
                    createMenuItem('H2O on Github', goToUrl('https://github.com/h2oai/h2o-3')),
                    createMenuItem('Report an issue', goToUrl('http://jira.h2o.ai')),
                    createMenuItem('Forum / Ask a question', goToUrl('https://groups.google.com/d/forum/h2ostream')),
                    menuDivider,
                    createMenuItem('About', displayAbout)
                ])
            ];
        };
        setupMenus = function () {
            return _.requestModelBuilders(function (error, builders) {
                return _menus(initializeMenus(error ? [] : builders));
            });
        };
        createTool = function (icon, label, action, isDisabled) {
            if (isDisabled == null) {
                isDisabled = false;
            }
            return {
                label: label,
                action: action,
                isDisabled: isDisabled,
                icon: 'fa fa-' + icon
            };
        };
        _toolbar = [
            [
                createTool('file-o', 'New', createNotebook),
                createTool('folder-open-o', 'Open', promptForNotebook),
                createTool('save', 'Save (s)', saveNotebook)
            ],
            [
                createTool('plus', 'Insert Cell Below (b)', insertNewCellBelow),
                createTool('arrow-up', 'Move Cell Up (ctrl+k)', moveCellUp),
                createTool('arrow-down', 'Move Cell Down (ctrl+j)', moveCellDown)
            ],
            [
                createTool('cut', 'Cut Cell (x)', cutCell),
                createTool('copy', 'Copy Cell (c)', copyCell),
                createTool('paste', 'Paste Cell Below (v)', pasteCellBelow),
                createTool('eraser', 'Clear Cell', clearCell),
                createTool('trash-o', 'Delete Cell (d d)', deleteCell)
            ],
            [
                createTool('step-forward', 'Run and Select Below', runCellAndSelectBelow),
                createTool('play', 'Run (ctrl+enter)', runCell),
                createTool('forward', 'Run All', runAllCells)
            ],
            [createTool('question-circle', 'Assist Me', executeCommand('assist'))]
        ];
        normalModeKeyboardShortcuts = [
            [
                'enter',
                'edit mode',
                switchToEditMode
            ],
            [
                'y',
                'to code',
                convertCellToCode
            ],
            [
                'm',
                'to markdown',
                convertCellToMarkdown
            ],
            [
                'r',
                'to raw',
                convertCellToRaw
            ],
            [
                '1',
                'to heading 1',
                convertCellToHeading(1)
            ],
            [
                '2',
                'to heading 2',
                convertCellToHeading(2)
            ],
            [
                '3',
                'to heading 3',
                convertCellToHeading(3)
            ],
            [
                '4',
                'to heading 4',
                convertCellToHeading(4)
            ],
            [
                '5',
                'to heading 5',
                convertCellToHeading(5)
            ],
            [
                '6',
                'to heading 6',
                convertCellToHeading(6)
            ],
            [
                'up',
                'select previous cell',
                selectPreviousCell
            ],
            [
                'down',
                'select next cell',
                selectNextCell
            ],
            [
                'k',
                'select previous cell',
                selectPreviousCell
            ],
            [
                'j',
                'select next cell',
                selectNextCell
            ],
            [
                'ctrl+k',
                'move cell up',
                moveCellUp
            ],
            [
                'ctrl+j',
                'move cell down',
                moveCellDown
            ],
            [
                'a',
                'insert cell above',
                insertNewCellAbove
            ],
            [
                'b',
                'insert cell below',
                insertNewCellBelow
            ],
            [
                'x',
                'cut cell',
                cutCell
            ],
            [
                'c',
                'copy cell',
                copyCell
            ],
            [
                'shift+v',
                'paste cell above',
                pasteCellAbove
            ],
            [
                'v',
                'paste cell below',
                pasteCellBelow
            ],
            [
                'z',
                'undo last delete',
                undoLastDelete
            ],
            [
                'd d',
                'delete cell (press twice)',
                deleteCell
            ],
            [
                'shift+m',
                'merge cell below',
                mergeCellBelow
            ],
            [
                's',
                'save notebook',
                saveNotebook
            ],
            [
                'o',
                'toggle output',
                toggleOutput
            ],
            [
                'h',
                'keyboard shortcuts',
                displayKeyboardShortcuts
            ]
        ];
        if (_.onSparklingWater) {
            normalModeKeyboardShortcuts.push([
                'q',
                'to Scala',
                convertCellToScala
            ]);
        }
        editModeKeyboardShortcuts = [
            [
                'esc',
                'command mode',
                switchToCommandMode
            ],
            [
                'ctrl+m',
                'command mode',
                switchToCommandMode
            ],
            [
                'shift+enter',
                'run cell, select below',
                runCellAndSelectBelow
            ],
            [
                'ctrl+enter',
                'run cell',
                runCell
            ],
            [
                'alt+enter',
                'run cell, insert below',
                runCellAndInsertBelow
            ],
            [
                'ctrl+shift+-',
                'split cell',
                splitCell
            ],
            [
                'mod+s',
                'save notebook',
                saveNotebook
            ]
        ];
        toKeyboardHelp = function (shortcut) {
            var caption, keystrokes, seq;
            seq = shortcut[0], caption = shortcut[1];
            keystrokes = lodash.map(seq.split(/\+/g), function (key) {
                return '<kbd>' + key + '</kbd>';
            }).join(' ');
            return {
                keystrokes: keystrokes,
                caption: caption
            };
        };
        normalModeKeyboardShortcutsHelp = lodash.map(normalModeKeyboardShortcuts, toKeyboardHelp);
        editModeKeyboardShortcutsHelp = lodash.map(editModeKeyboardShortcuts, toKeyboardHelp);
        setupKeyboardHandling = function (mode) {
            var caption, f, shortcut, _i, _j, _len, _len1, _ref, _ref1;
            for (_i = 0, _len = normalModeKeyboardShortcuts.length; _i < _len; _i++) {
                _ref = normalModeKeyboardShortcuts[_i], shortcut = _ref[0], caption = _ref[1], f = _ref[2];
                Mousetrap.bind(shortcut, f);
            }
            for (_j = 0, _len1 = editModeKeyboardShortcuts.length; _j < _len1; _j++) {
                _ref1 = editModeKeyboardShortcuts[_j], shortcut = _ref1[0], caption = _ref1[1], f = _ref1[2];
                Mousetrap.bindGlobal(shortcut, f);
            }
        };
        initialize = function () {
            setupKeyboardHandling('normal');
            setupMenus();
            Flow.Dataflow.link(_.load, loadNotebook);
            Flow.Dataflow.link(_.open, openNotebook);
            Flow.Dataflow.link(_.selectCell, selectCell);
            Flow.Dataflow.link(_.executeAllCells, executeAllCells);
            Flow.Dataflow.link(_.insertAndExecuteCell, function (type, input) {
                return lodash.defer(appendCellAndRun, type, input);
            });
            Flow.Dataflow.link(_.insertCell, function (type, input) {
                return lodash.defer(insertCellBelow, type, input);
            });
            Flow.Dataflow.link(_.saved, function () {
                return _.growl('Notebook saved.');
            });
            Flow.Dataflow.link(_.loaded, function () {
                return _.growl('Notebook loaded.');
            });
            executeCommand('assist')();
            _.setDirty();
            if (_.onSparklingWater) {
                return _initializeInterpreter();
            }
        };
        Flow.Dataflow.link(_.ready, initialize);
        return {
            name: _localName,
            isEditingName: _isEditingName,
            editName: editName,
            saveName: saveName,
            menus: _menus,
            sidebar: _sidebar,
            status: _status,
            toolbar: _toolbar,
            cells: _cells,
            areInputsHidden: _areInputsHidden,
            areOutputsHidden: _areOutputsHidden,
            isSidebarHidden: _isSidebarHidden,
            isRunningAll: _isRunningAll,
            runningCaption: _runningCaption,
            runningPercent: _runningPercent,
            runningCellInput: _runningCellInput,
            stopRunningAll: stopRunningAll,
            toggleSidebar: toggleSidebar,
            shortcutsHelp: {
                normalMode: normalModeKeyboardShortcutsHelp,
                editMode: editModeKeyboardShortcutsHelp
            },
            about: _about,
            dialogs: _dialogs,
            templateOf: function (view) {
                return view.template;
            }
        };
    };
}.call(this));
(function () {
    var isExpandable, preview, previewArray, previewObject;
    isExpandable = function (type) {
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
    previewArray = function (array) {
        var element, ellipsis, previews;
        ellipsis = array.length > 5 ? ', ...' : '';
        previews = function () {
            var _i, _len, _ref, _results;
            _ref = lodash.head(array, 5);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                element = _ref[_i];
                _results.push(preview(element));
            }
            return _results;
        }();
        return '[' + previews.join(', ') + ellipsis + ']';
    };
    previewObject = function (object) {
        var count, ellipsis, key, previews, value;
        count = 0;
        previews = [];
        ellipsis = '';
        for (key in object) {
            value = object[key];
            if (!(key !== '_flow_')) {
                continue;
            }
            previews.push('' + key + ': ' + preview(value));
            if (++count === 5) {
                ellipsis = ', ...';
                break;
            }
        }
        return '{' + previews.join(', ') + ellipsis + '}';
    };
    preview = function (element, recurse) {
        var type;
        if (recurse == null) {
            recurse = false;
        }
        type = Flow.Prelude.typeOf(element);
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
            } else {
                return type;
            }
            break;
        default:
            if (recurse) {
                return previewObject(element);
            } else {
                return type;
            }
        }
    };
    Flow.ObjectBrowserElement = function (key, object) {
        var toggle, _canExpand, _expansions, _isExpanded, _type;
        _expansions = Flow.Dataflow.signal(null);
        _isExpanded = Flow.Dataflow.signal(false);
        _type = Flow.Prelude.typeOf(object);
        _canExpand = isExpandable(_type);
        toggle = function () {
            var expansions, value;
            if (!_canExpand) {
                return;
            }
            if (_expansions() === null) {
                expansions = [];
                for (key in object) {
                    value = object[key];
                    if (key !== '_flow_') {
                        expansions.push(Flow.ObjectBrowserElement(key, value));
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
    Flow.ObjectBrowser = function (_, _go, key, object) {
        lodash.defer(_go);
        return {
            object: Flow.ObjectBrowserElement(key, object),
            template: 'flow-object'
        };
    };
}.call(this));
(function () {
    Flow.Outline = function (_, _cells) {
        return { cells: _cells };
    };
}.call(this));
(function () {
    Flow.Raw = function (_) {
        var render;
        render = function (input, output) {
            output.data({
                text: input,
                template: 'flow-raw'
            });
            return output.end();
        };
        render.isCode = false;
        return render;
    };
}.call(this));
(function () {
    Flow.Sidebar = function (_, cells) {
        var switchToBrowser, switchToClipboard, switchToHelp, switchToOutline, _browser, _clipboard, _help, _isBrowserMode, _isClipboardMode, _isHelpMode, _isOutlineMode, _mode, _outline;
        _mode = Flow.Dataflow.signal('help');
        _outline = Flow.Outline(_, cells);
        _isOutlineMode = Flow.Dataflow.lift(_mode, function (mode) {
            return mode === 'outline';
        });
        switchToOutline = function () {
            return _mode('outline');
        };
        _browser = Flow.Browser(_);
        _isBrowserMode = Flow.Dataflow.lift(_mode, function (mode) {
            return mode === 'browser';
        });
        switchToBrowser = function () {
            return _mode('browser');
        };
        _clipboard = Flow.Clipboard(_);
        _isClipboardMode = Flow.Dataflow.lift(_mode, function (mode) {
            return mode === 'clipboard';
        });
        switchToClipboard = function () {
            return _mode('clipboard');
        };
        _help = Flow.Help(_);
        _isHelpMode = Flow.Dataflow.lift(_mode, function (mode) {
            return mode === 'help';
        });
        switchToHelp = function () {
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
    };
}.call(this));
(function () {
    Flow.Status = function (_) {
        var defaultMessage, onStatus, _connections, _isBusy, _message;
        defaultMessage = 'Ready';
        _message = Flow.Dataflow.signal(defaultMessage);
        _connections = Flow.Dataflow.signal(0);
        _isBusy = Flow.Dataflow.lift(_connections, function (connections) {
            return connections > 0;
        });
        onStatus = function (category, type, data) {
            var connections;
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
                    } else {
                        return lodash.defer(_message, defaultMessage);
                    }
                }
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
    };
}.call(this));
(function () {
    H2O.ApplicationContext = function (_) {
        _.requestFileGlob = Flow.Dataflow.slot();
        _.requestCreateFrame = Flow.Dataflow.slot();
        _.requestSplitFrame = Flow.Dataflow.slot();
        _.requestImportFile = Flow.Dataflow.slot();
        _.requestImportFiles = Flow.Dataflow.slot();
        _.requestParseFiles = Flow.Dataflow.slot();
        _.requestInspect = Flow.Dataflow.slot();
        _.requestParseSetup = Flow.Dataflow.slot();
        _.requestParseSetupPreview = Flow.Dataflow.slot();
        _.requestFrames = Flow.Dataflow.slot();
        _.requestFrame = Flow.Dataflow.slot();
        _.requestFrameSlice = Flow.Dataflow.slot();
        _.requestFrameSummary = Flow.Dataflow.slot();
        _.requestFrameDataE = Flow.Dataflow.slot();
        _.requestFrameSummarySlice = Flow.Dataflow.slot();
        _.requestFrameSummarySliceE = Flow.Dataflow.slot();
        _.requestFrameSummaryWithoutData = Flow.Dataflow.slot();
        _.requestDeleteFrame = Flow.Dataflow.slot();
        _.requestExportFrame = Flow.Dataflow.slot();
        _.requestColumnSummary = Flow.Dataflow.slot();
        _.requestModelBuilder = Flow.Dataflow.slot();
        _.requestModelBuilders = Flow.Dataflow.slot();
        _.requestModelBuild = Flow.Dataflow.slot();
        _.requestModelInputValidation = Flow.Dataflow.slot();
        _.requestAutoModelBuild = Flow.Dataflow.slot();
        _.requestPredict = Flow.Dataflow.slot();
        _.requestPrediction = Flow.Dataflow.slot();
        _.requestPredictions = Flow.Dataflow.slot();
        _.requestPartialDependence = Flow.Dataflow.slot();
        _.requestPartialDependenceData = Flow.Dataflow.slot();
        _.requestGrids = Flow.Dataflow.slot();
        _.requestModels = Flow.Dataflow.slot();
        _.requestGrid = Flow.Dataflow.slot();
        _.requestModel = Flow.Dataflow.slot();
        _.requestPojoPreview = Flow.Dataflow.slot();
        _.requestDeleteModel = Flow.Dataflow.slot();
        _.requestImportModel = Flow.Dataflow.slot();
        _.requestExportModel = Flow.Dataflow.slot();
        _.requestJobs = Flow.Dataflow.slot();
        _.requestJob = Flow.Dataflow.slot();
        _.requestCancelJob = Flow.Dataflow.slot();
        _.requestObjects = Flow.Dataflow.slot();
        _.requestObject = Flow.Dataflow.slot();
        _.requestObjectExists = Flow.Dataflow.slot();
        _.requestDeleteObject = Flow.Dataflow.slot();
        _.requestPutObject = Flow.Dataflow.slot();
        _.requestUploadObject = Flow.Dataflow.slot();
        _.requestUploadFile = Flow.Dataflow.slot();
        _.requestCloud = Flow.Dataflow.slot();
        _.requestTimeline = Flow.Dataflow.slot();
        _.requestProfile = Flow.Dataflow.slot();
        _.requestStackTrace = Flow.Dataflow.slot();
        _.requestRemoveAll = Flow.Dataflow.slot();
        _.requestEcho = Flow.Dataflow.slot();
        _.requestLogFile = Flow.Dataflow.slot();
        _.requestNetworkTest = Flow.Dataflow.slot();
        _.requestAbout = Flow.Dataflow.slot();
        _.requestShutdown = Flow.Dataflow.slot();
        _.requestEndpoints = Flow.Dataflow.slot();
        _.requestEndpoint = Flow.Dataflow.slot();
        _.requestSchemas = Flow.Dataflow.slot();
        _.requestSchema = Flow.Dataflow.slot();
        _.requestPacks = Flow.Dataflow.slot();
        _.requestPack = Flow.Dataflow.slot();
        _.requestFlow = Flow.Dataflow.slot();
        _.requestHelpIndex = Flow.Dataflow.slot();
        _.requestHelpContent = Flow.Dataflow.slot();
        _.requestExec = Flow.Dataflow.slot();
        _.ls = Flow.Dataflow.slot();
        _.inspect = Flow.Dataflow.slot();
        _.plot = Flow.Dataflow.slot();
        _.grid = Flow.Dataflow.slot();
        _.enumerate = Flow.Dataflow.slot();
        _.scalaIntpId = Flow.Dataflow.signal(-1);
        _.requestRDDs = Flow.Dataflow.slot();
        _.requestDataFrames = Flow.Dataflow.slot();
        _.requestScalaIntp = Flow.Dataflow.slot();
        _.requestScalaCode = Flow.Dataflow.slot();
        _.requestAsH2OFrameFromRDD = Flow.Dataflow.slot();
        _.requestAsH2OFrameFromDF = Flow.Dataflow.slot();
        return _.requestAsDataFrame = Flow.Dataflow.slot();
    };
}.call(this));
(function () {
    H2O.Application = function (_) {
        H2O.ApplicationContext(_);
        return H2O.Proxy(_);
    };
}.call(this));
(function () {
    H2O.Proxy = function (_) {
        var cacheModelBuilders, composePath, doDelete, doGet, doPost, doPostJSON, doPut, doUpload, download, encodeArrayForPost, encodeObject, encodeObjectForPost, getGridModelBuilderEndpoint, getLines, getModelBuilderEndpoint, getModelBuilders, http, mapWithKey, optsToString, requestAbout, requestAsDataFrame, requestAsH2OFrameFromDF, requestAsH2OFrameFromRDD, requestAutoModelBuild, requestCancelJob, requestCloud, requestColumnSummary, requestCreateFrame, requestDataFrames, requestDeleteFrame, requestDeleteModel, requestDeleteObject, requestEcho, requestEndpoint, requestEndpoints, requestExec, requestExportFrame, requestExportModel, requestFileGlob, requestFlow, requestFrame, requestFrameSlice, requestFrameSummary, requestFrameSummarySlice, requestFrameSummaryWithoutData, requestFrames, requestGrid, requestGrids, requestHelpContent, requestHelpIndex, requestImportFile, requestImportFiles, requestImportModel, requestInspect, requestIsStorageConfigured, requestJob, requestJobs, requestLogFile, requestModel, requestModelBuild, requestModelBuilder, requestModelBuilders, requestModelBuildersVisibility, requestModelInputValidation, requestModels, requestNetworkTest, requestObject, requestObjectExists, requestObjects, requestPack, requestPacks, requestParseFiles, requestParseSetup, requestParseSetupPreview, requestPartialDependence, requestPartialDependenceData, requestPojoPreview, requestPredict, requestPrediction, requestPredictions, requestProfile, requestPutObject, requestRDDs, requestRemoveAll, requestScalaCode, requestScalaIntp, requestSchema, requestSchemas, requestShutdown, requestSplitFrame, requestStackTrace, requestTimeline, requestUploadFile, requestUploadObject, requestWithOpts, trackPath, unwrap, __gridModelBuilderEndpoints, __modelBuilderEndpoints, __modelBuilders, _storageConfiguration;
        download = function (type, url, go) {
            if (url.substring(0, 1) === '/') {
                url = window.Flow.ContextPath + url.substring(1);
            }
            return $.ajax({
                dataType: type,
                url: url,
                success: function (data, status, xhr) {
                    return go(null, data);
                },
                error: function (xhr, status, error) {
                    return go(new Flow.Error(error));
                }
            });
        };
        optsToString = function (opts) {
            var str;
            if (opts != null) {
                str = ' with opts ' + JSON.stringify(opts);
                if (str.length > 50) {
                    return '' + str.substr(0, 50) + '...';
                } else {
                    return str;
                }
            } else {
                return '';
            }
        };
        http = function (method, path, opts, go) {
            var req;
            if (path.substring(0, 1) === '/') {
                path = window.Flow.ContextPath + path.substring(1);
            }
            _.status('server', 'request', path);
            trackPath(path);
            req = function () {
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
        __modelBuilders = null;
        __modelBuilderEndpoints = null;
        __gridModelBuilderEndpoints = null;
        cacheModelBuilders = function (modelBuilders) {
            var gridModelBuilderEndpoints, modelBuilder, modelBuilderEndpoints, _i, _len;
            modelBuilderEndpoints = {};
            gridModelBuilderEndpoints = {};
            for (_i = 0, _len = modelBuilders.length; _i < _len; _i++) {
                modelBuilder = modelBuilders[_i];
                modelBuilderEndpoints[modelBuilder.algo] = '/' + modelBuilder.__meta.schema_version + '/ModelBuilders/' + modelBuilder.algo;
                gridModelBuilderEndpoints[modelBuilder.algo] = '/99/Grid/' + modelBuilder.algo;
            }
            __modelBuilderEndpoints = modelBuilderEndpoints;
            __gridModelBuilderEndpoints = gridModelBuilderEndpoints;
            return __modelBuilders = modelBuilders;
        };
        getModelBuilders = function () {
            return __modelBuilders;
        };
        getModelBuilderEndpoint = function (algo) {
            return __modelBuilderEndpoints[algo];
        };
        getGridModelBuilderEndpoint = function (algo) {
            return __gridModelBuilderEndpoints[algo];
        };
        requestModelBuilders = function (go) {
            var modelBuilders, visibility;
            if (modelBuilders = getModelBuilders()) {
                return go(null, modelBuilders);
            } else {
                visibility = 'Stable';
                return doGet('/3/ModelBuilders', unwrap(go, function (result) {
                    var algo, availableBuilders, builder, builders;
                    builders = function () {
                        var _ref, _results;
                        _ref = result.model_builders;
                        _results = [];
                        for (algo in _ref) {
                            builder = _ref[algo];
                            _results.push(builder);
                        }
                        return _results;
                    }();
                    availableBuilders = function () {
                        var _i, _j, _len, _len1, _results, _results1;
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
                            break;
                        case 'Beta':
                            _results1 = [];
                            for (_j = 0, _len1 = builders.length; _j < _len1; _j++) {
                                builder = builders[_j];
                                if (builder.visibility === visibility || builder.visibility === 'Stable') {
                                    _results1.push(builder);
                                }
                            }
                            return _results1;
                            break;
                        default:
                            return builders;
                        }
                    }();
                    return cacheModelBuilders(availableBuilders);
                }));
            }
        };
        requestModelBuilder = function (algo, go) {
            return doGet(getModelBuilderEndpoint(algo), go);
        };
        requestModelInputValidation = function (algo, parameters, go) {
            return doPost('' + getModelBuilderEndpoint(algo) + '/parameters', encodeObjectForPost(parameters), go);
        };
        requestModelBuild = function (algo, parameters, go) {
            _.trackEvent('model', algo);
            if (parameters.hyper_parameters) {
                parameters.hyper_parameters = Flow.Prelude.stringify(parameters.hyper_parameters);
                if (parameters.search_criteria) {
                    parameters.search_criteria = Flow.Prelude.stringify(parameters.search_criteria);
                }
                return doPost(getGridModelBuilderEndpoint(algo), encodeObjectForPost(parameters), go);
            } else {
                return doPost(getModelBuilderEndpoint(algo), encodeObjectForPost(parameters), go);
            }
        };
        requestAutoModelBuild = function (parameters, go) {
            return doPostJSON('/99/AutoMLBuilder', parameters, go);
        };
        requestPredict = function (destinationKey, modelKey, frameKey, options, go) {
            var opt, opts;
            opts = {};
            if (destinationKey) {
                opts.predictions_frame = destinationKey;
            }
            if (void 0 !== (opt = options.reconstruction_error)) {
                opts.reconstruction_error = opt;
            }
            if (void 0 !== (opt = options.deep_features_hidden_layer)) {
                opts.deep_features_hidden_layer = opt;
            }
            if (void 0 !== (opt = options.leaf_node_assignment)) {
                opts.leaf_node_assignment = opt;
            }
            if (void 0 !== (opt = options.exemplar_index)) {
                opts.exemplar_index = opt;
            }
            return doPost('/3/Predictions/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), opts, function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, result);
                }
            });
        };
        requestPrediction = function (modelKey, frameKey, go) {
            return doGet('/3/ModelMetrics/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, result);
                }
            });
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
      Flow.Version = '0.4.54';
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