"use strict";(function(){ var lodash = window._; window.Flow={}; window.H2O={};(function () {
    if ((typeof window !== 'undefined' && window !== null ? window.$ : void 0) != null) {
        $(function () {
            var context;
            context = {};
            window.flow = Flow.Application(context, H2O.Routines);
            H2O.Application(context);
            ko.applyBindings(window.flow);
            context.ready();
            return context.initialized();
        });
    }
}.call(this));
(function () {
    Flow.Version = '0.2.80';
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
        var activate, clear, clip, execute, navigate, select, self, toggleInput, toggleOutput, _actions, _errors, _guid, _hasError, _hasInput, _hasOutput, _input, _isActive, _isBusy, _isCode, _isInputVisible, _isOutputHidden, _isReady, _isSelected, _outputs, _render, _result, _type;
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
            var render;
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
            return _.requestObject('environment', 'clips', function (error, doc) {
                if (!error) {
                    return _userClips(lodash.map(doc.clips, function (clip) {
                        return createClip(_userClips, clip.type, clip.input);
                    }));
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
    _homeMarkdown = '<blockquote> \nUsing Flow for the first time?\n<br/>\n<div style=\'margin-top:10px\'>\n  <button type=\'button\' data-action=\'assist\' class=\'flow-button\'><i class=\'fa fa-support\'></i><span>Assist Me!</span>\n  </button>\n</div>\n</blockquote> \n\n##### Help Topics\n\n###### General\n\n%HELP_TOPICS%\n\n###### Packs\n\nFlow packs are a great way to explore and learn H<sub>2</sub>O. Try out these Flows and run them in your browser.<br/><a href=\'#\' data-action=\'get-packs\'>Browse installed packs...</a>\n\n###### H<sub>2</sub>O REST API\n\n- <a href=\'#\' data-action=\'endpoints\'>Routes</a>\n- <a href=\'#\' data-action=\'schemas\'>Schemas</a>\n';
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
            var $html;
            $html = $(html);
            $('img', $html).each(function () {
                var $self, src;
                $self = $(this);
                src = $self.attr('src');
                if (0 === src.indexOf('images/')) {
                    $self.attr('src', 'help/' + src);
                }
            });
            return $html.html();
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
                        return displayPacks(packNames);
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
            raw: function () {
                return Flow.Raw(_);
            }
        };
    };
    Flow.Notebook = function (_, _renderers) {
        var appendCell, appendCellAndRun, checkConsistency, checkIfNameIsInUse, clearAllCells, clearCell, cloneCell, continueRunningAllCells, convertCellToCode, convertCellToHeading, convertCellToMarkdown, convertCellToRaw, copyCell, createCell, createMenu, createMenuHeader, createMenuItem, createNotebook, createTool, cutCell, deleteCell, deserialize, displayAbout, displayDocumentation, displayKeyboardShortcuts, duplicateNotebook, editModeKeyboardShortcuts, editModeKeyboardShortcutsHelp, editName, executeAllCells, executeCommand, exportNotebook, goToUrl, initialize, insertAbove, insertBelow, insertCell, insertCellAbove, insertCellAboveAndRun, insertCellBelow, insertCellBelowAndRun, insertNewCellAbove, insertNewCellBelow, loadNotebook, menuDivider, mergeCellAbove, mergeCellBelow, moveCellDown, moveCellUp, normalModeKeyboardShortcuts, normalModeKeyboardShortcutsHelp, notImplemented, openNotebook, pasteCellAbove, pasteCellBelow, pasteCellandReplace, printPreview, promptForNotebook, removeCell, runAllCells, runCell, runCellAndInsertBelow, runCellAndSelectBelow, saveName, saveNotebook, selectCell, selectNextCell, selectPreviousCell, serialize, setupKeyboardHandling, showBrowser, showClipboard, showHelp, showOutline, shutdown, splitCell, startTour, stopRunningAll, storeNotebook, switchToCommandMode, switchToEditMode, switchToPresentationMode, toKeyboardHelp, toggleAllInputs, toggleAllOutputs, toggleInput, toggleOutput, toggleSidebar, undoLastDelete, uploadFile, _about, _areInputsHidden, _areOutputsHidden, _cells, _clipboardCell, _dialogs, _isEditingName, _isRunningAll, _isSidebarHidden, _lastDeletedCell, _localName, _menus, _remoteName, _runningCaption, _runningCellInput, _runningPercent, _selectedCell, _selectedCellIndex, _sidebar, _status, _toolbar;
        _localName = Flow.Dataflow.signal('Untitled Flow');
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
            return _.requestObject('notebook', name, function (error) {
                return go(error ? false : true);
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
                        return _.alert((_ref = error.message) != null ? _ref : error);
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
                        return _.alert((_ref = error.message) != null ? _ref : error);
                    } else {
                        _.growl('File uploaded successfully!');
                        return _.insertAndExecuteCell('cs', 'setupParse source_keys: [ ' + Flow.Prelude.stringify(result.result.destination_key) + ']');
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
        displayDocumentation = function () {
            var hash, hashEntry;
            hash = Flow.BuildProperties ? (hashEntry = lodash.find(Flow.BuildProperties, function (entry) {
                return entry.caption === 'H2O Build git hash';
            }), hashEntry ? hashEntry.value : 'master') : 'master';
            return window.open('https://github.com/h2oai/h2o-dev/blob/' + hash + '/h2o-docs/src/product/flow/README.md', '_blank');
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
            var currentTime;
            currentTime = new Date().getTime();
            return deserialize('Untitled Flow', null, {
                cells: [{
                        type: 'cs',
                        input: ''
                    }]
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
        printPreview = notImplemented;
        pasteCellandReplace = notImplemented;
        mergeCellAbove = notImplemented;
        switchToPresentationMode = notImplemented;
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
        createMenuItem = function (label, action, isDisabled) {
            if (isDisabled == null) {
                isDisabled = false;
            }
            return {
                label: label,
                action: action,
                isDisabled: isDisabled
            };
        };
        menuDivider = {
            label: null,
            action: null
        };
        _menus = [
            createMenu('Flow', [
                createMenuItem('New', createNotebook),
                createMenuItem('Open...', promptForNotebook),
                createMenuItem('Save', saveNotebook),
                createMenuItem('Duplicate', duplicateNotebook),
                menuDivider,
                createMenuItem('Upload File...', uploadFile),
                menuDivider,
                createMenuItem('Print Preview', printPreview, true),
                createMenuItem('Export...', exportNotebook)
            ]),
            createMenu('Edit', [
                createMenuItem('Cut Cell', cutCell),
                createMenuItem('Copy Cell', copyCell),
                createMenuItem('Paste Cell Above', pasteCellAbove),
                createMenuItem('Paste Cell Below', pasteCellBelow),
                createMenuItem('Paste Cell and Replace', pasteCellandReplace, true),
                createMenuItem('Delete Cell', deleteCell),
                createMenuItem('Undo Delete Cell', undoLastDelete),
                menuDivider,
                createMenuItem('Insert Cell Above', insertNewCellAbove),
                createMenuItem('Insert Cell Below', insertNewCellBelow),
                menuDivider,
                createMenuItem('Split Cell', splitCell),
                createMenuItem('Merge Cell Above', mergeCellAbove, true),
                createMenuItem('Merge Cell Below', mergeCellBelow),
                menuDivider,
                createMenuItem('Move Cell Up', moveCellUp),
                createMenuItem('Move Cell Down', moveCellDown)
            ]),
            createMenu('View', [
                createMenuItem('Toggle Input', toggleInput),
                createMenuItem('Toggle Output', toggleOutput),
                menuDivider,
                createMenuItem('Toggle All Inputs', toggleAllInputs),
                createMenuItem('Toggle All Outputs', toggleAllOutputs),
                menuDivider,
                createMenuItem('Toggle Sidebar', toggleSidebar),
                createMenuItem('Outline', showOutline),
                createMenuItem('Flows', showBrowser),
                createMenuItem('Clips', showClipboard),
                menuDivider,
                createMenuItem('Presentation Mode', switchToPresentationMode, true)
            ]),
            createMenu('Format', [
                createMenuItem('Code', convertCellToCode),
                menuDivider,
                createMenuItem('Heading 1', convertCellToHeading(1)),
                createMenuItem('Heading 2', convertCellToHeading(2)),
                createMenuItem('Heading 3', convertCellToHeading(3)),
                createMenuItem('Heading 4', convertCellToHeading(4)),
                createMenuItem('Heading 5', convertCellToHeading(5)),
                createMenuItem('Heading 6', convertCellToHeading(6)),
                createMenuItem('Markdown', convertCellToMarkdown),
                createMenuItem('Raw', convertCellToRaw)
            ]),
            createMenu('Run', [
                createMenuItem('Run', runCell),
                createMenuItem('Run and Select Below', runCellAndSelectBelow),
                createMenuItem('Run and Insert Below', runCellAndInsertBelow),
                menuDivider,
                createMenuItem('Run All', runAllCells),
                createMenuItem('Continue', continueRunningAllCells),
                menuDivider,
                createMenuItem('Clear Output', clearCell),
                menuDivider,
                createMenuItem('Clear All Outputs', clearAllCells)
            ]),
            createMenu('Admin', [
                createMenuItem('Cluster Status', executeCommand('getCloud')),
                createMenuItem('Jobs', executeCommand('getJobs')),
                createMenuItem('Water Meter (CPU meter)', goToUrl('/perfbar.html')),
                menuDivider,
                createMenuHeader('Logs'),
                createMenuItem('View Log', executeCommand('getLogFile')),
                createMenuItem('Download Logs', goToUrl('/Logs/download')),
                menuDivider,
                createMenuHeader('Advanced'),
                createMenuItem('Stack Trace', executeCommand('getStackTrace')),
                createMenuItem('Network Test', executeCommand('testNetwork')),
                createMenuItem('Profiler', executeCommand('getProfile depth: 10')),
                createMenuItem('Timeline', executeCommand('getTimeline')),
                createMenuItem('Shut Down', shutdown)
            ]),
            createMenu('Help', [
                createMenuItem('Tour', startTour, true),
                createMenuItem('Contents', showHelp),
                createMenuItem('Keyboard Shortcuts', displayKeyboardShortcuts),
                menuDivider,
                createMenuItem('What is H2O?', goToUrl('/starwars.html')),
                createMenuItem('H2O Documentation', displayDocumentation),
                createMenuItem('h2o.ai', goToUrl('http://h2o.ai/')),
                menuDivider,
                createMenuItem('About', displayAbout)
            ])
        ];
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
                createTool('save', 'Save', saveNotebook)
            ],
            [
                createTool('plus', 'Insert Cell Below', insertNewCellBelow),
                createTool('arrow-up', 'Move Cell Up', moveCellUp),
                createTool('arrow-down', 'Move Cell Down', moveCellDown)
            ],
            [
                createTool('cut', 'Cut Cell', cutCell),
                createTool('copy', 'Copy Cell', copyCell),
                createTool('paste', 'Paste Cell Below', pasteCellBelow),
                createTool('eraser', 'Clear Cell', clearCell)
            ],
            [
                createTool('step-forward', 'Run and Select Below', runCellAndSelectBelow),
                createTool('play', 'Run', runCell),
                createTool('forward', 'Run All', runAllCells)
            ]
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
            insertNewCellBelow();
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
            return _.setDirty();
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
    Flow.Analytics = function (_) {
        Flow.Dataflow.link(_.trackEvent, function (category, action, label, value) {
            return lodash.defer(function () {
                return window.ga('send', 'event', category, action, label, value);
            });
        });
        return Flow.Dataflow.link(_.trackException, function (description) {
            return lodash.defer(function () {
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
        Flow.Analytics(_);
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
    var EOL, describeCount, formatBytes, formatMilliseconds, fromNow, multilineTextToHTML, padTime, sanitizeName;
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
    formatMilliseconds = function (s) {
        var hrs, mins, ms, secs;
        ms = s % 1000;
        s = (s - ms) / 1000;
        secs = s % 60;
        s = (s - secs) / 60;
        mins = s % 60;
        hrs = (s - mins) / 60;
        return '' + padTime(hrs) + ':' + padTime(mins) + ':' + padTime(secs) + '.' + ms;
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
    Flow.Util = {
        describeCount: describeCount,
        fromNow: fromNow,
        formatBytes: formatBytes,
        formatMilliseconds: formatMilliseconds,
        multilineTextToHTML: multilineTextToHTML,
        uuid: (typeof window !== 'undefined' && window !== null ? window.uuid : void 0) ? window.uuid : null,
        sanitizeName: sanitizeName
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
        _.requestFrameSummary = Flow.Dataflow.slot();
        _.requestDeleteFrame = Flow.Dataflow.slot();
        _.requestRDDs = Flow.Dataflow.slot();
        _.requestColumnSummary = Flow.Dataflow.slot();
        _.requestModelBuilder = Flow.Dataflow.slot();
        _.requestModelBuilders = Flow.Dataflow.slot();
        _.requestModelBuild = Flow.Dataflow.slot();
        _.requestModelInputValidation = Flow.Dataflow.slot();
        _.requestPredict = Flow.Dataflow.slot();
        _.requestPrediction = Flow.Dataflow.slot();
        _.requestPredictions = Flow.Dataflow.slot();
        _.requestModels = Flow.Dataflow.slot();
        _.requestModel = Flow.Dataflow.slot();
        _.requestDeleteModel = Flow.Dataflow.slot();
        _.requestJobs = Flow.Dataflow.slot();
        _.requestJob = Flow.Dataflow.slot();
        _.requestCancelJob = Flow.Dataflow.slot();
        _.requestObjects = Flow.Dataflow.slot();
        _.requestObject = Flow.Dataflow.slot();
        _.requestDeleteObject = Flow.Dataflow.slot();
        _.requestPutObject = Flow.Dataflow.slot();
        _.requestUploadObject = Flow.Dataflow.slot();
        _.requestUploadFile = Flow.Dataflow.slot();
        _.requestCloud = Flow.Dataflow.slot();
        _.requestTimeline = Flow.Dataflow.slot();
        _.requestProfile = Flow.Dataflow.slot();
        _.requestStackTrace = Flow.Dataflow.slot();
        _.requestRemoveAll = Flow.Dataflow.slot();
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
        _.inspect = Flow.Dataflow.slot();
        _.plot = Flow.Dataflow.slot();
        _.grid = Flow.Dataflow.slot();
        return _.enumerate = Flow.Dataflow.slot();
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
        var composePath, doDelete, doGet, doPost, doPut, doUpload, download, encodeArrayForPost, encodeObject, encodeObjectForPost, getLines, http, mapWithKey, patchUpModels, requestAbout, requestCancelJob, requestCloud, requestColumnSummary, requestCreateFrame, requestDeleteFrame, requestDeleteModel, requestDeleteObject, requestEndpoint, requestEndpoints, requestExec, requestFileGlob, requestFlow, requestFrame, requestFrameSummary, requestFrames, requestHelpContent, requestHelpIndex, requestImportFile, requestImportFiles, requestInspect, requestJob, requestJobs, requestLogFile, requestModel, requestModelBuild, requestModelBuilder, requestModelBuilders, requestModelInputValidation, requestModels, requestNetworkTest, requestObject, requestObjects, requestPack, requestPacks, requestParseFiles, requestParseSetup, requestParseSetupPreview, requestPredict, requestPrediction, requestPredictions, requestProfile, requestPutObject, requestRDDs, requestRemoveAll, requestSchema, requestSchemas, requestShutdown, requestSplitFrame, requestStackTrace, requestTimeline, requestUploadFile, requestUploadObject, requestWithOpts, trackPath, unwrap;
        download = function (type, url, go) {
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
        http = function (method, path, opts, go) {
            var req;
            _.status('server', 'request', path);
            trackPath(path);
            req = function () {
                switch (method) {
                case 'GET':
                    return $.getJSON(path);
                case 'POST':
                    return $.post(path, opts);
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
                }
            }();
            req.done(function (data, status, xhr) {
                var error;
                _.status('server', 'response', path);
                try {
                    return go(null, data);
                } catch (_error) {
                    error = _error;
                    return go(new Flow.Error('Error processing ' + method + ' ' + path, error));
                }
            });
            return req.fail(function (xhr, status, error) {
                var cause, response, serverError, _ref;
                _.status('server', 'error', path);
                response = xhr.responseJSON;
                cause = (response != null ? (_ref = response.__meta) != null ? _ref.schema_type : void 0 : void 0) === 'H2OError' ? (serverError = new Flow.Error(response.exception_msg), serverError.stack = '' + response.dev_msg + ' (' + response.exception_type + ')' + '\n  ' + response.stacktrace.join('\n  '), serverError) : (error != null ? error.message : void 0) ? new Flow.Error(error.message) : status === 0 ? new Flow.Error('Could not connect to H2O') : lodash.isString(error) ? new Flow.Error(error) : new Flow.Error('Unknown error');
                return go(new Flow.Error('Error calling ' + method + ' ' + path + ' with opts ' + JSON.stringify(opts), cause));
            });
        };
        doGet = function (path, go) {
            return http('GET', path, null, go);
        };
        doPost = function (path, opts, go) {
            return http('POST', path, opts, go);
        };
        doPut = function (path, opts, go) {
            return http('PUT', path, opts, go);
        };
        doUpload = function (path, formData, go) {
            return http('UPLOAD', path, formData, go);
        };
        doDelete = function (path, go) {
            return http('DELETE', path, null, go);
        };
        trackPath = function (path) {
            var base, e, name, other, root, version, _ref, _ref1;
            try {
                _ref = path.split('/'), root = _ref[0], version = _ref[1], name = _ref[2];
                _ref1 = name.split('?'), base = _ref1[0], other = _ref1[1];
                if (base !== 'Typeahead.json' && base !== 'Jobs.json') {
                    _.trackEvent('api', base, version);
                }
            } catch (_error) {
                e = _error;
            }
        };
        mapWithKey = function (obj, f) {
            var key, result, value;
            result = [];
            for (key in obj) {
                value = obj[key];
                result.push(f(value, key));
            }
            return result;
        };
        composePath = function (path, opts) {
            var params;
            if (opts) {
                params = mapWithKey(opts, function (v, k) {
                    return '' + k + '=' + v;
                });
                return path + '?' + params.join('&');
            } else {
                return path;
            }
        };
        requestWithOpts = function (path, opts, go) {
            return doGet(composePath(path, opts), go);
        };
        encodeArrayForPost = function (array) {
            if (array) {
                if (array.length === 0) {
                    return null;
                } else {
                    return '[' + lodash.map(array, function (element) {
                        if (lodash.isNumber(element)) {
                            return element;
                        } else {
                            return '"' + element + '"';
                        }
                    }).join(',') + ']';
                }
            } else {
                return null;
            }
        };
        encodeObject = function (source) {
            var k, target, v;
            target = {};
            for (k in source) {
                v = source[k];
                target[k] = encodeURIComponent(v);
            }
            return target;
        };
        encodeObjectForPost = function (source) {
            var k, target, v;
            target = {};
            for (k in source) {
                v = source[k];
                target[k] = lodash.isArray(v) ? encodeArrayForPost(v) : v;
            }
            return target;
        };
        unwrap = function (go, transform) {
            return function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, transform(result));
                }
            };
        };
        requestExec = function (ast, go) {
            return doPost('/1/Rapids.json', { ast: ast }, function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    if (result.error) {
                        return go(new Flow.Error(result.error));
                    } else {
                        return go(null, result);
                    }
                }
            });
        };
        requestInspect = function (key, go) {
            var opts;
            opts = { key: encodeURIComponent(key) };
            return requestWithOpts('/1/Inspect.json', opts, go);
        };
        requestCreateFrame = function (opts, go) {
            return doPost('/2/CreateFrame.json', opts, go);
        };
        requestSplitFrame = function (frameKey, splitRatios, splitKeys, go) {
            var opts;
            opts = {
                dataset: frameKey,
                ratios: encodeArrayForPost(splitRatios),
                dest_keys: encodeArrayForPost(splitKeys)
            };
            return doPost('/2/SplitFrame.json', opts, go);
        };
        requestFrames = function (go) {
            return doGet('/3/Frames.json', function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, result.frames);
                }
            });
        };
        requestFrame = function (key, go) {
            return doGet('/3/Frames.json/' + encodeURIComponent(key), function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, lodash.head(result.frames));
                }
            });
        };
        requestFrameSummary = function (key, go) {
            return doGet('/3/Frames.json/' + encodeURIComponent(key) + '/summary', function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, lodash.head(result.frames));
                }
            });
        };
        requestDeleteFrame = function (key, go) {
            return doDelete('/3/Frames.json/' + encodeURIComponent(key), go);
        };
        requestRDDs = function (go) {
            return doGet('/3/RDDs.json', function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, result.rdds);
                }
            });
        };
        requestColumnSummary = function (key, column, go) {
            return doGet('/3/Frames.json/' + encodeURIComponent(key) + '/columns/' + encodeURIComponent(column) + '/summary', function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, lodash.head(result.frames));
                }
            });
        };
        requestJobs = function (go) {
            return doGet('/2/Jobs.json', function (error, result) {
                if (error) {
                    return go(new Flow.Error('Error fetching jobs', error));
                } else {
                    return go(null, result.jobs);
                }
            });
        };
        requestJob = function (key, go) {
            return doGet('/2/Jobs.json/' + encodeURIComponent(key), function (error, result) {
                if (error) {
                    return go(new Flow.Error('Error fetching job \'' + key + '\'', error));
                } else {
                    return go(null, lodash.head(result.jobs));
                }
            });
        };
        requestCancelJob = function (key, go) {
            return doPost('/2/Jobs.json/' + encodeURIComponent(key) + '/cancel', {}, function (error, result) {
                if (error) {
                    return go(new Flow.Error('Error canceling job \'' + key + '\'', error));
                } else {
                    console.debug(result);
                    return go(null);
                }
            });
        };
        requestFileGlob = function (path, limit, go) {
            var opts;
            opts = {
                src: encodeURIComponent(path),
                limit: limit
            };
            return requestWithOpts('/2/Typeahead.json/files', opts, go);
        };
        requestImportFiles = function (paths, go) {
            var tasks;
            tasks = lodash.map(paths, function (path) {
                return function (go) {
                    return requestImportFile(path, go);
                };
            });
            return Flow.Async.iterate(tasks)(go);
        };
        requestImportFile = function (path, go) {
            var opts;
            opts = { path: encodeURIComponent(path) };
            return requestWithOpts('/2/ImportFiles.json', opts, go);
        };
        requestParseSetup = function (sourceKeys, go) {
            var opts;
            opts = { source_keys: encodeArrayForPost(sourceKeys) };
            return doPost('/2/ParseSetup.json', opts, go);
        };
        requestParseSetupPreview = function (sourceKeys, parseType, separator, useSingleQuotes, checkHeader, columnTypes, go) {
            var opts;
            opts = {
                source_keys: encodeArrayForPost(sourceKeys),
                parse_type: parseType,
                separator: separator,
                single_quotes: useSingleQuotes,
                check_header: checkHeader,
                column_types: encodeArrayForPost(columnTypes)
            };
            return doPost('/2/ParseSetup.json', opts, go);
        };
        requestParseFiles = function (sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) {
            var opts;
            opts = {
                destination_key: destinationKey,
                source_keys: encodeArrayForPost(sourceKeys),
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
            return doPost('/2/Parse.json', opts, go);
        };
        patchUpModels = function (models) {
            var model, parameter, parseError, _i, _j, _len, _len1, _ref;
            for (_i = 0, _len = models.length; _i < _len; _i++) {
                model = models[_i];
                _ref = model.parameters;
                for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                    parameter = _ref[_j];
                    switch (parameter.type) {
                    case 'Key<Frame>':
                    case 'Key<Model>':
                    case 'VecSpecifier':
                        if (lodash.isString(parameter.actual_value)) {
                            try {
                                parameter.actual_value = JSON.parse(parameter.actual_value);
                            } catch (_error) {
                                parseError = _error;
                            }
                        }
                    }
                }
            }
            return models;
        };
        requestModels = function (go, opts) {
            return requestWithOpts('/3/Models.json', opts, function (error, result) {
                if (error) {
                    return go(error, result);
                } else {
                    return go(error, patchUpModels(result.models));
                }
            });
        };
        requestModel = function (key, go) {
            return doGet('/3/Models.json/' + encodeURIComponent(key), function (error, result) {
                if (error) {
                    return go(error, result);
                } else {
                    return go(error, lodash.head(patchUpModels(result.models)));
                }
            });
        };
        requestDeleteModel = function (key, go) {
            return doDelete('/3/Models.json/' + encodeURIComponent(key), go);
        };
        requestModelBuilders = function (go) {
            return doGet('/3/ModelBuilders.json', go);
        };
        requestModelBuilder = function (algo, go) {
            return doGet('/3/ModelBuilders.json/' + algo, go);
        };
        requestModelInputValidation = function (algo, parameters, go) {
            return doPost('/3/ModelBuilders.json/' + algo + '/parameters', encodeObjectForPost(parameters), go);
        };
        requestModelBuild = function (algo, parameters, go) {
            _.trackEvent('model', algo);
            return doPost('/3/ModelBuilders.json/' + algo, encodeObjectForPost(parameters), go);
        };
        requestPredict = function (destinationKey, modelKey, frameKey, go) {
            var opts;
            opts = destinationKey ? { destination_key: destinationKey } : {};
            return doPost('/3/Predictions.json/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), opts, function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, lodash.head(result.model_metrics));
                }
            });
        };
        requestPrediction = function (modelKey, frameKey, go) {
            return doGet('/3/ModelMetrics.json/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, lodash.head(result.model_metrics));
                }
            });
        };
        requestPredictions = function (modelKey, frameKey, _go) {
            var go;
            go = function (error, result) {
                var prediction, predictions;
                if (error) {
                    return _go(error);
                } else {
                    predictions = function () {
                        var _i, _len, _ref, _results;
                        _ref = result.model_metrics;
                        _results = [];
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
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            if (prediction) {
                                _results.push(prediction);
                            }
                        }
                        return _results;
                    }());
                }
            };
            if (modelKey && frameKey) {
                return doGet('/3/ModelMetrics.json/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), go);
            } else if (modelKey) {
                return doGet('/3/ModelMetrics.json/models/' + encodeURIComponent(modelKey), go);
            } else if (frameKey) {
                return doGet('/3/ModelMetrics.json/frames/' + encodeURIComponent(frameKey), go);
            } else {
                return doGet('/3/ModelMetrics.json', go);
            }
        };
        requestObjects = function (type, go) {
            return doGet('/3/NodePersistentStorage.json/' + encodeURIComponent(type), unwrap(go, function (result) {
                return result.entries;
            }));
        };
        requestObject = function (type, name, go) {
            return doGet('/3/NodePersistentStorage.json/' + encodeURIComponent(type) + '/' + encodeURIComponent(name), unwrap(go, function (result) {
                return JSON.parse(result.value);
            }));
        };
        requestDeleteObject = function (type, name, go) {
            return doDelete('/3/NodePersistentStorage.json/' + encodeURIComponent(type) + '/' + encodeURIComponent(name), go);
        };
        requestPutObject = function (type, name, value, go) {
            var uri;
            uri = '/3/NodePersistentStorage.json/' + encodeURIComponent(type);
            if (name) {
                uri += '/' + encodeURIComponent(name);
            }
            return doPost(uri, { value: JSON.stringify(value, null, 2) }, unwrap(go, function (result) {
                return result.name;
            }));
        };
        requestUploadObject = function (type, name, formData, go) {
            var uri;
            uri = '/3/NodePersistentStorage.json/' + encodeURIComponent(type);
            if (name) {
                uri += '/' + encodeURIComponent(name);
            }
            return doUpload(uri, formData, unwrap(go, function (result) {
                return result.name;
            }));
        };
        requestUploadFile = function (key, formData, go) {
            return doUpload('/3/PostFile.json?destination_key=' + encodeURIComponent(key), formData, go);
        };
        requestCloud = function (go) {
            return doGet('/1/Cloud.json', go);
        };
        requestTimeline = function (go) {
            return doGet('/2/Timeline.json', go);
        };
        requestProfile = function (depth, go) {
            return doGet('/2/Profiler.json?depth=' + depth, go);
        };
        requestStackTrace = function (go) {
            return doGet('/2/JStack.json', go);
        };
        requestRemoveAll = function (go) {
            return doDelete('/1/RemoveAll.json', go);
        };
        requestLogFile = function (nodeIndex, fileType, go) {
            return doGet('/3/Logs.json/nodes/' + nodeIndex + '/files/' + fileType, go);
        };
        requestNetworkTest = function (go) {
            return doGet('/2/NetworkTest.json', go);
        };
        requestAbout = function (go) {
            return doGet('/3/About.json', go);
        };
        requestShutdown = function (go) {
            return doPost('/2/Shutdown', {}, go);
        };
        requestEndpoints = function (go) {
            return doGet('/1/Metadata/endpoints.json', go);
        };
        requestEndpoint = function (index, go) {
            return doGet('/1/Metadata/endpoints.json/' + index, go);
        };
        requestSchemas = function (go) {
            return doGet('/1/Metadata/schemas.json', go);
        };
        requestSchema = function (name, go) {
            return doGet('/1/Metadata/schemas.json/' + encodeURIComponent(name), go);
        };
        getLines = function (data) {
            return lodash.filter(data.split('\n'), function (line) {
                if (line.trim()) {
                    return true;
                } else {
                    return false;
                }
            });
        };
        requestPacks = function (go) {
            return download('text', '/flow/packs/index.list', function (error, data) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, getLines(data));
                }
            });
        };
        requestPack = function (packName, go) {
            return download('text', '/flow/packs/' + encodeURIComponent(packName) + '/index.list', function (error, data) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, getLines(data));
                }
            });
        };
        requestFlow = function (packName, flowName, go) {
            return download('json', '/flow/packs/' + encodeURIComponent(packName) + '/' + encodeURIComponent(flowName), go);
        };
        requestHelpIndex = function (go) {
            return download('json', '/flow/help/catalog.json', go);
        };
        requestHelpContent = function (name, go) {
            return download('text', '/flow/help/' + name + '.html', go);
        };
        Flow.Dataflow.link(_.requestInspect, requestInspect);
        Flow.Dataflow.link(_.requestCreateFrame, requestCreateFrame);
        Flow.Dataflow.link(_.requestSplitFrame, requestSplitFrame);
        Flow.Dataflow.link(_.requestFrames, requestFrames);
        Flow.Dataflow.link(_.requestFrame, requestFrame);
        Flow.Dataflow.link(_.requestFrameSummary, requestFrameSummary);
        Flow.Dataflow.link(_.requestDeleteFrame, requestDeleteFrame);
        Flow.Dataflow.link(_.requestRDDs, requestRDDs);
        Flow.Dataflow.link(_.requestColumnSummary, requestColumnSummary);
        Flow.Dataflow.link(_.requestJobs, requestJobs);
        Flow.Dataflow.link(_.requestJob, requestJob);
        Flow.Dataflow.link(_.requestCancelJob, requestCancelJob);
        Flow.Dataflow.link(_.requestFileGlob, requestFileGlob);
        Flow.Dataflow.link(_.requestImportFiles, requestImportFiles);
        Flow.Dataflow.link(_.requestImportFile, requestImportFile);
        Flow.Dataflow.link(_.requestParseSetup, requestParseSetup);
        Flow.Dataflow.link(_.requestParseSetupPreview, requestParseSetupPreview);
        Flow.Dataflow.link(_.requestParseFiles, requestParseFiles);
        Flow.Dataflow.link(_.requestModels, requestModels);
        Flow.Dataflow.link(_.requestModel, requestModel);
        Flow.Dataflow.link(_.requestDeleteModel, requestDeleteModel);
        Flow.Dataflow.link(_.requestModelBuilder, requestModelBuilder);
        Flow.Dataflow.link(_.requestModelBuilders, requestModelBuilders);
        Flow.Dataflow.link(_.requestModelBuild, requestModelBuild);
        Flow.Dataflow.link(_.requestModelInputValidation, requestModelInputValidation);
        Flow.Dataflow.link(_.requestPredict, requestPredict);
        Flow.Dataflow.link(_.requestPrediction, requestPrediction);
        Flow.Dataflow.link(_.requestPredictions, requestPredictions);
        Flow.Dataflow.link(_.requestObjects, requestObjects);
        Flow.Dataflow.link(_.requestObject, requestObject);
        Flow.Dataflow.link(_.requestDeleteObject, requestDeleteObject);
        Flow.Dataflow.link(_.requestPutObject, requestPutObject);
        Flow.Dataflow.link(_.requestUploadObject, requestUploadObject);
        Flow.Dataflow.link(_.requestUploadFile, requestUploadFile);
        Flow.Dataflow.link(_.requestCloud, requestCloud);
        Flow.Dataflow.link(_.requestTimeline, requestTimeline);
        Flow.Dataflow.link(_.requestProfile, requestProfile);
        Flow.Dataflow.link(_.requestStackTrace, requestStackTrace);
        Flow.Dataflow.link(_.requestRemoveAll, requestRemoveAll);
        Flow.Dataflow.link(_.requestLogFile, requestLogFile);
        Flow.Dataflow.link(_.requestNetworkTest, requestNetworkTest);
        Flow.Dataflow.link(_.requestAbout, requestAbout);
        Flow.Dataflow.link(_.requestShutdown, requestShutdown);
        Flow.Dataflow.link(_.requestEndpoints, requestEndpoints);
        Flow.Dataflow.link(_.requestEndpoint, requestEndpoint);
        Flow.Dataflow.link(_.requestSchemas, requestSchemas);
        Flow.Dataflow.link(_.requestSchema, requestSchema);
        Flow.Dataflow.link(_.requestPacks, requestPacks);
        Flow.Dataflow.link(_.requestPack, requestPack);
        Flow.Dataflow.link(_.requestFlow, requestFlow);
        Flow.Dataflow.link(_.requestHelpIndex, requestHelpIndex);
        Flow.Dataflow.link(_.requestHelpContent, requestHelpContent);
        return Flow.Dataflow.link(_.requestExec, requestExec);
    };
}.call(this));
(function () {
    var combineTables, computeFalsePositiveRate, computeTruePositiveRate, concatArrays, convertColumnToVector, convertTableToFrame, createArrays, createDataframe, createFactor, createList, createTempKey, createVector, formatConfusionMatrix, formulateGetPredictionsOrigin, lightning, parseNaNs, parseNulls, parseNumbers, repeatValues, _assistance, __slice = [].slice;
    lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
    if (lightning.settings) {
        lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
        lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
    }
    createTempKey = function () {
        return Flow.Util.uuid().replace(/\-/g, '');
    };
    createVector = lightning.createVector;
    createFactor = lightning.createFactor;
    createList = lightning.createList;
    createDataframe = lightning.createFrame;
    _assistance = {
        importFiles: {
            description: 'Import file(s) into H<sub>2</sub>O',
            icon: 'files-o'
        },
        getFrames: {
            description: 'Get a list of frames in H<sub>2</sub>O',
            icon: 'database'
        },
        splitFrame: {
            description: 'Split a frame into two or more frames',
            icon: 'scissors'
        },
        getModels: {
            description: 'Get a list of models in H<sub>2</sub>O',
            icon: 'cubes'
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
        predict: {
            description: 'Make a prediction',
            icon: 'bolt'
        }
    };
    parseNumbers = function (source) {
        var i, target, value, _i, _len;
        target = new Array(source.length);
        for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
            value = source[i];
            target[i] = value === 'NaN' ? void 0 : value === 'Infinity' ? Number.POSITIVE_INFINITY : value === '-Infinity' ? Number.NEGATIVE_INFINITY : value;
        }
        return target;
    };
    convertColumnToVector = function (column, data) {
        switch (column.type) {
        case 'byte':
        case 'short':
        case 'int':
        case 'long':
            return createVector(column.name, Flow.TNumber, parseNumbers(data));
        case 'float':
        case 'double':
            return createVector(column.name, Flow.TNumber, parseNumbers(data));
        case 'string':
            return createFactor(column.name, Flow.TString, data);
        default:
            return createList(column.name, data);
        }
    };
    convertTableToFrame = function (table, metadata) {
        var column, i, vectors;
        vectors = function () {
            var _i, _len, _ref, _results;
            _ref = table.columns;
            _results = [];
            for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                column = _ref[i];
                _results.push(convertColumnToVector(column, table.data[i]));
            }
            return _results;
        }();
        return createDataframe(table.name, vectors, lodash.range(table.rowcount), null, metadata);
    };
    combineTables = function (tables) {
        var columnCount, columnData, data, element, i, index, leader, rowCount, table, _i, _j, _k, _l, _len, _len1, _len2, _ref;
        leader = lodash.head(tables);
        rowCount = 0;
        columnCount = leader.data.length;
        data = new Array(columnCount);
        for (_i = 0, _len = tables.length; _i < _len; _i++) {
            table = tables[_i];
            rowCount += table.rowcount;
        }
        for (i = _j = 0; 0 <= columnCount ? _j < columnCount : _j > columnCount; i = 0 <= columnCount ? ++_j : --_j) {
            data[i] = columnData = new Array(rowCount);
            index = 0;
            for (_k = 0, _len1 = tables.length; _k < _len1; _k++) {
                table = tables[_k];
                _ref = table.data[i];
                for (_l = 0, _len2 = _ref.length; _l < _len2; _l++) {
                    element = _ref[_l];
                    columnData[index++] = element;
                }
            }
        }
        return {
            name: leader.name,
            columns: leader.columns,
            data: data,
            rowcount: rowCount
        };
    };
    createArrays = function (count, length) {
        var i, _i, _results;
        _results = [];
        for (i = _i = 0; 0 <= count ? _i < count : _i > count; i = 0 <= count ? ++_i : --_i) {
            _results.push(new Array(length));
        }
        return _results;
    };
    parseNaNs = function (source) {
        var element, i, target, _i, _len;
        target = new Array(source.length);
        for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
            element = source[i];
            target[i] = element === 'NaN' ? void 0 : element;
        }
        return target;
    };
    parseNulls = function (source) {
        var element, i, target, _i, _len;
        target = new Array(source.length);
        for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
            element = source[i];
            target[i] = element != null ? element : void 0;
        }
        return target;
    };
    repeatValues = function (count, value) {
        var i, target, _i;
        target = new Array(count);
        for (i = _i = 0; 0 <= count ? _i < count : _i > count; i = 0 <= count ? ++_i : --_i) {
            target[i] = value;
        }
        return target;
    };
    concatArrays = function (arrays) {
        var a;
        switch (arrays.length) {
        case 0:
            return [];
        case 1:
            return lodash.head(arrays);
        default:
            a = lodash.head(arrays);
            return a.concat.apply(a, lodash.tail(arrays));
        }
    };
    computeTruePositiveRate = function (cm) {
        var fn, fp, tn, tp, _ref, _ref1;
        (_ref = cm[0], tn = _ref[0], fp = _ref[1]), (_ref1 = cm[1], fn = _ref1[0], tp = _ref1[1]);
        return tp / (tp + fn);
    };
    computeFalsePositiveRate = function (cm) {
        var fn, fp, tn, tp, _ref, _ref1;
        (_ref = cm[0], tn = _ref[0], fp = _ref[1]), (_ref1 = cm[1], fn = _ref1[0], tp = _ref1[1]);
        return fp / (fp + tn);
    };
    formatConfusionMatrix = function (cm) {
        var fn, fp, table, tbody, td, tn, tp, tr, _ref, _ref1, _ref2;
        (_ref = cm[0], tn = _ref[0], fp = _ref[1]), (_ref1 = cm[1], fn = _ref1[0], tp = _ref1[1]);
        _ref2 = Flow.HTML.template('table.flow-matrix', 'tbody', 'tr', 'td'), table = _ref2[0], tbody = _ref2[1], tr = _ref2[2], td = _ref2[3];
        return table([tbody([
                tr([
                    td(tn),
                    td(fp)
                ]),
                tr([
                    td(fn),
                    td(tp)
                ])
            ])]);
    };
    formulateGetPredictionsOrigin = function (opts) {
        var frameKey, modelKey, opt, sanitizedOpt, sanitizedOpts;
        if (lodash.isArray(opts)) {
            sanitizedOpts = function () {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = opts.length; _i < _len; _i++) {
                    opt = opts[_i];
                    sanitizedOpt = {};
                    if (opt.model) {
                        sanitizedOpt.model = opt.model;
                    }
                    if (opt.frame) {
                        sanitizedOpt.frame = opt.frame;
                    }
                    _results.push(sanitizedOpt);
                }
                return _results;
            }();
            return 'getPredictions ' + Flow.Prelude.stringify(sanitizedOpts);
        } else {
            modelKey = opts.model, frameKey = opts.frame;
            if (modelKey && frameKey) {
                return 'getPredictions model: ' + Flow.Prelude.stringify(modelKey) + ', frame: ' + Flow.Prelude.stringify(frameKey);
            } else if (modelKey) {
                return 'getPredictions model: ' + Flow.Prelude.stringify(modelKey);
            } else if (frameKey) {
                return 'getPredictions frame: ' + Flow.Prelude.stringify(frameKey);
            } else {
                return 'getPredictions()';
            }
        }
    };
    H2O.Routines = function (_) {
        var assist, buildModel, computeSplits, createFrame, createGui, createPlot, deleteAll, deleteFrame, deleteFrames, deleteModel, deleteModels, dump, dumpFuture, extendCloud, extendColumnSummary, extendDeepLearningModel, extendDeletedKeys, extendFrame, extendFrames, extendGBMModel, extendGLMModel, extendGuiForm, extendImportResults, extendJob, extendJobs, extendKMeansModel, extendLogFile, extendModel, extendModels, extendNetworkTest, extendParseResult, extendParseSetupResults, extendPlot, extendPrediction, extendPredictions, extendProfile, extendRDDs, extendSplitFrameResult, extendStackTrace, extendTimeline, f, flow_, getCloud, getColumnSummary, getFrame, getFrameSummary, getFrames, getJob, getJobs, getLogFile, getModel, getModelParameterValue, getModels, getPrediction, getPredictions, getProfile, getRDDs, getStackTrace, getTimeline, grid, gui, importFiles, inspect, inspect$1, inspect$2, inspectBinomialConfusionMatrices, inspectBinomialConfusionMatrices2, inspectBinomialMetrics, inspectBinomialPrediction, inspectBinomialPrediction2, inspectBinomialPredictions, inspectBinomialScores, inspectFrameColumns, inspectFrameData, inspectGBMModelOutput, inspectGLMCoefficientsMagnitude, inspectGLMCoefficientsTable, inspectGLMModelOutput, inspectKMeansModelOutput, inspectKmeansModelClusterMeans, inspectKmeansModelClusters, inspectModelParameters, inspectMultinomialConfusionMatrix, inspectMultinomialPrediction2, inspectNetworkTestResult, inspectParametersAcrossModels, inspectRegressionPrediction, inspectRegressionPrediction2, inspect_, loadScript, name, parseFiles, plot, predict, proceed, read, render_, requestCloud, requestColumnSummary, requestCreateFrame, requestCurrentNodeIndex, requestDeleteFrame, requestDeleteFrames, requestDeleteModel, requestDeleteModels, requestFrame, requestFrameSummary, requestFrames, requestImportAndParseFiles, requestImportAndParseSetup, requestImportFiles, requestJob, requestJobs, requestLogFile, requestModel, requestModelBuild, requestModels, requestModelsByKeys, requestNetworkTest, requestParseFiles, requestParseSetup, requestPredict, requestPrediction, requestPredictions, requestPredicts, requestProfile, requestRDDs, requestRemoveAll, requestSplitFrame, requestStackTrace, requestTimeline, setupParse, splitFrame, testNetwork, _apply, _async, _call, _fork, _get, _isFuture, _join, _plot, _ref;
        _fork = function () {
            var args, f;
            f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            return Flow.Async.fork(f, args);
        };
        _join = function () {
            var args, go, _i;
            args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), go = arguments[_i++];
            return Flow.Async.join(args, Flow.Async.applicate(go));
        };
        _call = function () {
            var args, go;
            go = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            return Flow.Async.join(args, Flow.Async.applicate(go));
        };
        _apply = function (go, args) {
            return Flow.Async.join(args, go);
        };
        _isFuture = Flow.Async.isFuture;
        _async = Flow.Async.async;
        _get = Flow.Async.get;
        proceed = function (func, args, go) {
            return go(null, render_({}, function () {
                return func.apply(null, [_].concat(args || []));
            }));
        };
        proceed = function (func, args, go) {
            return go(null, render_.apply(null, [
                {},
                func
            ].concat(args || [])));
        };
        extendGuiForm = function (form) {
            return render_(form, Flow.Form, form);
        };
        createGui = function (controls, go) {
            return go(null, extendGuiForm(Flow.Dataflow.signals(controls || [])));
        };
        gui = function (controls) {
            return _fork(createGui, controls);
        };
        _ref = Flow.Gui;
        for (name in _ref) {
            f = _ref[name];
            gui[name] = f;
        }
        flow_ = function (raw) {
            return raw._flow_ || (raw._flow_ = { _cache_: {} });
        };
        render_ = function (raw, render) {
            flow_(raw).render = render;
            return raw;
        };
        render_ = function () {
            var args, raw, render;
            raw = arguments[0], render = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
            flow_(raw).render = function (go) {
                return render.apply(null, [
                    _,
                    go
                ].concat(args));
            };
            return raw;
        };
        inspect_ = function (raw, inspectors) {
            var attr, root;
            root = flow_(raw);
            if (root.inspect == null) {
                root.inspect = {};
            }
            for (attr in inspectors) {
                f = inspectors[attr];
                root.inspect[attr] = f;
            }
            return raw;
        };
        inspect = function (a, b) {
            if (arguments.length === 1) {
                return inspect$1(a);
            } else {
                return inspect$2(a, b);
            }
        };
        inspect$1 = function (obj) {
            var attr, inspections, inspectors, _ref1;
            if (_isFuture(obj)) {
                return _async(inspect, obj);
            } else {
                if (inspectors = obj != null ? (_ref1 = obj._flow_) != null ? _ref1.inspect : void 0 : void 0) {
                    inspections = [];
                    for (attr in inspectors) {
                        f = inspectors[attr];
                        inspections.push(inspect$2(attr, obj));
                    }
                    render_(inspections, H2O.InspectsOutput, inspections);
                    return inspections;
                } else {
                    return {};
                }
            }
        };
        inspect$2 = function (attr, obj) {
            var cached, inspection, inspectors, key, root;
            if (!attr) {
                return;
            }
            if (_isFuture(obj)) {
                return _async(inspect, attr, obj);
            }
            if (!obj) {
                return;
            }
            if (!(root = obj._flow_)) {
                return;
            }
            if (!(inspectors = root.inspect)) {
                return;
            }
            if (cached = root._cache_[key = 'inspect_' + attr]) {
                return cached;
            }
            if (!(f = inspectors[attr])) {
                return;
            }
            if (!lodash.isFunction(f)) {
                return;
            }
            root._cache_[key] = inspection = f();
            render_(inspection, H2O.InspectOutput, inspection);
            return inspection;
        };
        _plot = function (render, go) {
            return render(function (error, vis) {
                if (error) {
                    return go(new Flow.Error('Error rendering vis.', error));
                } else {
                    return go(null, vis);
                }
            });
        };
        extendPlot = function (vis) {
            return render_(vis, H2O.PlotOutput, vis.element);
        };
        createPlot = function (f, go) {
            return _plot(f(lightning), function (error, vis) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendPlot(vis));
                }
            });
        };
        plot = function (f) {
            if (_isFuture(f)) {
                return _fork(proceed, H2O.PlotInput, f);
            } else if (lodash.isFunction(f)) {
                return _fork(createPlot, f);
            } else {
                return assist(plot);
            }
        };
        grid = function (f) {
            return plot(function (g) {
                return g(g.select(), g.from(f));
            });
        };
        extendCloud = function (cloud) {
            return render_(cloud, H2O.CloudOutput, cloud);
        };
        extendTimeline = function (timeline) {
            return render_(timeline, H2O.TimelineOutput, timeline);
        };
        extendStackTrace = function (stackTrace) {
            return render_(stackTrace, H2O.StackTraceOutput, stackTrace);
        };
        extendLogFile = function (cloud, nodeIndex, fileType, logFile) {
            return render_(logFile, H2O.LogFileOutput, cloud, nodeIndex, fileType, logFile);
        };
        inspectNetworkTestResult = function (testResult) {
            return function () {
                return convertTableToFrame(testResult.table, {
                    description: testResult.table.name,
                    origin: 'testNetwork'
                });
            };
        };
        extendNetworkTest = function (testResult) {
            inspect_(testResult, { result: inspectNetworkTestResult(testResult) });
            return render_(testResult, H2O.NetworkTestOutput, testResult);
        };
        extendProfile = function (profile) {
            return render_(profile, H2O.ProfileOutput, profile);
        };
        extendFrames = function (frames) {
            render_(frames, H2O.FramesOutput, frames);
            return frames;
        };
        extendSplitFrameResult = function (result) {
            render_(result, H2O.SplitFrameOutput, result);
            return result;
        };
        getModelParameterValue = function (type, value) {
            switch (type) {
            case 'Key<Frame>':
            case 'Key<Model>':
                if (value != null) {
                    return value.name;
                } else {
                    return void 0;
                }
                break;
            case 'VecSpecifier':
                if (value != null) {
                    return value.column_name;
                } else {
                    return void 0;
                }
                break;
            default:
                if (value != null) {
                    return value;
                } else {
                    return void 0;
                }
            }
        };
        inspectParametersAcrossModels = function (models) {
            return function () {
                var data, i, leader, model, modelKeys, parameter, vectors;
                leader = lodash.head(models);
                vectors = function () {
                    var _i, _len, _ref1, _results;
                    _ref1 = leader.parameters;
                    _results = [];
                    for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
                        parameter = _ref1[i];
                        data = function () {
                            var _j, _len1, _results1;
                            _results1 = [];
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
                            _results.push(createFactor(parameter.label, Flow.TString, data));
                            break;
                        case 'byte':
                        case 'short':
                        case 'int':
                        case 'long':
                        case 'float':
                        case 'double':
                            _results.push(createVector(parameter.label, Flow.TNumber, data));
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
                                } else {
                                    return void 0;
                                }
                            }));
                            break;
                        case 'boolean':
                            _results.push(createList(parameter.label, data, function (a) {
                                if (a) {
                                    return 'true';
                                } else {
                                    return 'false';
                                }
                            }));
                            break;
                        default:
                            _results.push(createList(parameter.label, data));
                        }
                    }
                    return _results;
                }();
                modelKeys = function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = models.length; _i < _len; _i++) {
                        model = models[_i];
                        _results.push(model.key.name);
                    }
                    return _results;
                }();
                return createDataframe('parameters', vectors, lodash.range(models.length), null, {
                    description: 'Parameters for models ' + modelKeys.join(', '),
                    origin: 'getModels ' + Flow.Prelude.stringify(modelKeys)
                });
            };
        };
        inspectModelParameters = function (model) {
            return function () {
                var attr, attrs, data, i, parameter, parameters, vectors;
                parameters = model.parameters;
                attrs = [
                    'label',
                    'type',
                    'level',
                    'actual_value',
                    'default_value'
                ];
                vectors = function () {
                    var _i, _j, _len, _len1, _results;
                    _results = [];
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
                    description: 'Parameters for model \'' + model.key.name + '\'',
                    origin: 'getModel ' + Flow.Prelude.stringify(model.key.name)
                });
            };
        };
        inspectGLMModelOutput = function (model) {
            return function () {
                var output, vectors;
                output = model.output;
                vectors = [
                    createFactor('model_category', Flow.TString, [output.model_category]),
                    createFactor('binomial', Flow.TString, [output.binomial]),
                    createVector('aic', Flow.TNumber, [output.aic]),
                    createVector('auc', Flow.TNumber, [output.auc]),
                    createVector('best_lambda_idx', Flow.TNumber, [output.best_lambda_idx]),
                    createVector('null_degrees_of_freedom', Flow.TNumber, [output.null_degrees_of_freedom]),
                    createVector('null_deviance', Flow.TNumber, [output.null_deviance]),
                    createVector('rank', Flow.TNumber, [output.rank]),
                    createVector('residual_degrees_of_freedom', Flow.TNumber, [output.residual_degrees_of_freedom]),
                    createVector('residual_deviance', Flow.TNumber, [output.residual_deviance]),
                    createVector('threshold', Flow.TNumber, [output.threshold])
                ];
                return createDataframe('output', vectors, lodash.range(1), null, {
                    description: 'Output for GLM model \'' + model.key.name + '\'',
                    origin: 'getModel ' + Flow.Prelude.stringify(model.key.name)
                });
            };
        };
        inspectGLMCoefficientsMagnitude = function (model) {
            return function () {
                return convertTableToFrame(model.output.coefficients_magnitude, {
                    description: '' + model.output.coefficients_magnitude.name + ' for GLM model ' + model.key.name,
                    origin: 'getModel ' + Flow.Prelude.stringify(model.key.name)
                });
            };
        };
        inspectGLMCoefficientsTable = function (model) {
            return function () {
                return convertTableToFrame(model.output.coefficients_table, {
                    description: '' + model.output.coefficients_table.name + ' for GLM model ' + model.key.name,
                    origin: 'getModel ' + Flow.Prelude.stringify(model.key.name)
                });
            };
        };
        inspectGBMModelOutput = function (model) {
            return function () {
                var output, size, vectors;
                output = model.output;
                size = output.mse_train.length;
                vectors = [
                    createVector('tree', Flow.TNumber, lodash.range(size)),
                    createVector('mse_train', Flow.TNumber, parseNaNs(output.mse_train)),
                    createVector('mse_valid', Flow.TNumber, parseNaNs(output.mse_valid))
                ];
                return createDataframe('output', vectors, lodash.range(size), null, {
                    description: 'Output for GBM model \'' + model.key.name + '\'',
                    origin: 'getModel ' + Flow.Prelude.stringify(model.key.name)
                });
            };
        };
        inspectKMeansModelOutput = function (model) {
            return function () {
                var output, vectors;
                output = model.output;
                vectors = [
                    createVector('avg_between_ss', Flow.TNumber, [output.avg_between_ss]),
                    createVector('avg_ss', Flow.TNumber, [output.avg_ss]),
                    createVector('avg_within_ss', Flow.TNumber, [output.avg_within_ss]),
                    createVector('categorical_column_count', Flow.TNumber, [output.categorical_column_count]),
                    createVector('iterations', Flow.TNumber, [output.iterations]),
                    createFactor('model_category', Flow.TString, [output.model_category])
                ];
                return createDataframe('output', vectors, lodash.range(1), null, {
                    description: 'Output for k-means model \'' + model.key.name + '\'',
                    origin: 'getModel ' + Flow.Prelude.stringify(model.key.name)
                });
            };
        };
        inspectKmeansModelClusters = function (model) {
            return function () {
                var output, vectors;
                output = model.output;
                vectors = [
                    createFactor('cluster', Flow.TString, lodash.head(output.centers.data)),
                    createVector('size', Flow.TNumber, output.size),
                    createVector('within_mse', Flow.TNumber, output.within_mse)
                ];
                return createDataframe('clusters', vectors, lodash.range(output.size.length), null, {
                    description: 'Clusters for k-means model \'' + model.key.name + '\'',
                    origin: 'getModel ' + Flow.Prelude.stringify(model.key.name)
                });
            };
        };
        inspectKmeansModelClusterMeans = function (model) {
            return function () {
                return convertTableToFrame(model.output.centers, {
                    description: 'Cluster means for k-means model \'' + model.key.name + '\'',
                    origin: 'getModel ' + Flow.Prelude.stringify(model.key.name)
                });
            };
        };
        extendKMeansModel = function (model) {
            return inspect_(model, {
                parameters: inspectModelParameters(model),
                output: inspectKMeansModelOutput(model),
                clusters: inspectKmeansModelClusters(model),
                'Cluster means': inspectKmeansModelClusterMeans(model)
            });
        };
        extendDeepLearningModel = function (model) {
            var inspections, modelCategory, origin, table, tables, trainMetrics, validMetrics, variableImportances;
            origin = 'getModel ' + Flow.Prelude.stringify(model.key.name);
            inspections = {};
            inspections.parameters = inspectModelParameters(model);
            modelCategory = model.output.model_category;
            if (modelCategory === 'Binomial' || modelCategory === 'Multinomial' || modelCategory === 'Regression' || modelCategory === 'AutoEncoder') {
                tables = [
                    model.output.model_summary,
                    model.output.scoring_history
                ];
                tables.forEach(function (table) {
                    return inspections[table.name] = function () {
                        return convertTableToFrame(table, {
                            description: table.name,
                            origin: origin,
                            plot: 'plot inspect \'' + table.name + '\', ' + origin
                        });
                    };
                });
                if (variableImportances = model.output.variable_importances) {
                    inspections[variableImportances.name] = function () {
                        return convertTableToFrame(variableImportances, {
                            description: variableImportances.name,
                            origin: origin,
                            plot: 'plot inspect \'' + variableImportances.name + '\', ' + origin
                        });
                    };
                }
            }
            if (modelCategory === 'Binomial') {
                if (trainMetrics = model.output.train_metrics) {
                    trainMetrics.thresholds_and_metric_scores.name = 'Training ' + trainMetrics.thresholds_and_metric_scores.name;
                    trainMetrics.max_criteria_and_metric_scores.name = 'Training ' + trainMetrics.max_criteria_and_metric_scores.name;
                    inspections['Training Metrics'] = inspectBinomialPrediction2('Training Metrics', trainMetrics);
                    inspections[trainMetrics.thresholds_and_metric_scores.name] = function () {
                        return convertTableToFrame(trainMetrics.thresholds_and_metric_scores, {
                            description: trainMetrics.thresholds_and_metric_scores.name,
                            origin: origin,
                            plot: 'plot inspect \'' + trainMetrics.thresholds_and_metric_scores.name + '\', ' + origin
                        });
                    };
                    inspections[trainMetrics.max_criteria_and_metric_scores.name] = function () {
                        return convertTableToFrame(trainMetrics.max_criteria_and_metric_scores, {
                            description: trainMetrics.max_criteria_and_metric_scores.name,
                            origin: origin,
                            plot: 'plot inspect \'' + trainMetrics.max_criteria_and_metric_scores.name + '\', ' + origin
                        });
                    };
                    inspections['Training Confusion Matrices'] = inspectBinomialConfusionMatrices2('Training Confusion Matrices', trainMetrics);
                }
                if (validMetrics = model.output.valid_metrics) {
                    validMetrics.thresholds_and_metric_scores.name = 'Validation ' + validMetrics.thresholds_and_metric_scores.name;
                    validMetrics.max_criteria_and_metric_scores.name = 'Validation ' + validMetrics.max_criteria_and_metric_scores.name;
                    inspections['Validation Metrics'] = inspectBinomialPrediction2('Validation Metrics', validMetrics);
                    inspections[validMetrics.thresholds_and_metric_scores.name] = function () {
                        return convertTableToFrame(validMetrics.thresholds_and_metric_scores, {
                            description: validMetrics.thresholds_and_metric_scores.name,
                            origin: origin,
                            plot: 'plot inspect \'' + validMetrics.thresholds_and_metric_scores.name + '\', ' + origin
                        });
                    };
                    inspections[validMetrics.max_criteria_and_metric_scores.name] = function () {
                        return convertTableToFrame(validMetrics.max_criteria_and_metric_scores, {
                            description: validMetrics.max_criteria_and_metric_scores.name,
                            origin: origin,
                            plot: 'plot inspect \'' + validMetrics.max_criteria_and_metric_scores.name + '\', ' + origin
                        });
                    };
                    inspections['Validation Confusion Matrices'] = inspectBinomialConfusionMatrices2('Validation Confusion Matrices', validMetrics);
                }
            } else if (modelCategory === 'Multinomial') {
                if (trainMetrics = model.output.train_metrics) {
                    inspections['Training Metrics'] = inspectMultinomialPrediction2('Training Metrics', trainMetrics);
                    if (table = trainMetrics.cm.table) {
                        inspectMultinomialConfusionMatrix('Training Confusion Matrix', table, origin, inspections);
                    }
                }
                if (validMetrics = model.output.valid_metrics) {
                    inspections['Validation Metrics'] = inspectMultinomialPrediction2('Validation Metrics', validMetrics);
                    if (table = validMetrics.cm.table) {
                        inspectMultinomialConfusionMatrix('Validation Confusion Matrix', table, origin, inspections);
                    }
                }
            } else if (modelCategory === 'Regression') {
                if (trainMetrics = model.output.train_metrics) {
                    inspections['Training Metrics'] = inspectRegressionPrediction2('Training Metrics', trainMetrics);
                }
                if (validMetrics = model.output.valid_metrics) {
                    inspections['Validation Metrics'] = inspectRegressionPrediction2('Validation Metrics', validMetrics);
                }
            }
            return inspect_(model, inspections);
        };
        extendGBMModel = function (model) {
            var inspections, origin, variableImportances;
            origin = 'getModel ' + Flow.Prelude.stringify(model.key.name);
            inspections = {};
            inspections.parameters = inspectModelParameters(model);
            inspections.output = inspectGBMModelOutput(model);
            if (variableImportances = model.output.variable_importances) {
                inspections[variableImportances.name] = function () {
                    return convertTableToFrame(variableImportances, {
                        description: variableImportances.name,
                        origin: origin,
                        plot: 'plot inspect \'' + variableImportances.name + '\', ' + origin
                    });
                };
            }
            return inspect_(model, inspections);
        };
        extendGLMModel = function (model) {
            var inspections;
            inspections = {};
            inspections.parameters = inspectModelParameters(model);
            inspections.output = inspectGLMModelOutput(model);
            if (model.output.coefficients_magnitude) {
                inspections[model.output.coefficients_magnitude.name] = inspectGLMCoefficientsMagnitude(model);
            }
            if (model.output.coefficients_table) {
                inspections[model.output.coefficients_table.name] = inspectGLMCoefficientsTable(model);
            }
            return inspect_(model, inspections);
        };
        extendJob = function (job) {
            return render_(job, H2O.JobOutput, job);
        };
        extendJobs = function (jobs) {
            var job, _i, _len;
            for (_i = 0, _len = jobs.length; _i < _len; _i++) {
                job = jobs[_i];
                extendJob(job);
            }
            return render_(jobs, H2O.JobsOutput, jobs);
        };
        extendDeletedKeys = function (keys) {
            return render_(keys, H2O.DeleteObjectsOutput, keys);
        };
        extendModel = function (model) {
            switch (model.algo) {
            case 'kmeans':
                extendKMeansModel(model);
                break;
            case 'deeplearning':
                extendDeepLearningModel(model);
                break;
            case 'gbm':
            case 'drf':
                extendGBMModel(model);
                break;
            case 'glm':
                extendGLMModel(model);
            }
            return render_(model, H2O.ModelOutput, model);
        };
        extendModels = function (models) {
            var algos, inspections, model, modelCategories, _i, _len;
            for (_i = 0, _len = models.length; _i < _len; _i++) {
                model = models[_i];
                extendModel(model);
            }
            inspections = {};
            algos = lodash.unique(function () {
                var _j, _len1, _results;
                _results = [];
                for (_j = 0, _len1 = models.length; _j < _len1; _j++) {
                    model = models[_j];
                    _results.push(model.algo);
                }
                return _results;
            }());
            if (algos.length === 1) {
                inspections.parameters = inspectParametersAcrossModels(models);
            }
            modelCategories = lodash.unique(function () {
                var _j, _len1, _results;
                _results = [];
                for (_j = 0, _len1 = models.length; _j < _len1; _j++) {
                    model = models[_j];
                    _results.push(model.output.model_category);
                }
                return _results;
            }());
            inspect_(models, inspections);
            return render_(models, H2O.ModelsOutput, models);
        };
        read = function (value) {
            if (value === 'NaN') {
                return null;
            } else {
                return value;
            }
        };
        inspectMultinomialPrediction2 = function (frameLabel, prediction) {
            return function () {
                var frame, model, origin, vectors;
                frame = prediction.frame, model = prediction.model;
                origin = 'getModel ' + Flow.Prelude.stringify(prediction.model.name);
                vectors = [
                    createFactor('model_category', Flow.TString, [prediction.model_category]),
                    createVector('mse', Flow.TNumber, [prediction.mse]),
                    createVector('logloss', Flow.TNumber, [prediction.logloss]),
                    createVector('duration_in_ms', Flow.TNumber, [prediction.duration_in_ms]),
                    createVector('scoring_time', Flow.TNumber, [prediction.scoring_time])
                ];
                return createDataframe(frameLabel, vectors, lodash.range(1), null, {
                    description: frameLabel,
                    origin: origin
                });
            };
        };
        inspectRegressionPrediction2 = function (frameLabel, prediction) {
            return function () {
                var frame, model, origin, vectors;
                frame = prediction.frame, model = prediction.model;
                origin = 'getModel ' + Flow.Prelude.stringify(prediction.model.name);
                vectors = [
                    createFactor('model_category', Flow.TString, [prediction.model_category]),
                    createVector('mse', Flow.TNumber, [prediction.mse]),
                    createVector('sigma', Flow.TNumber, [prediction.sigma]),
                    createVector('logloss', Flow.TNumber, [prediction.logloss]),
                    createVector('duration_in_ms', Flow.TNumber, [prediction.duration_in_ms]),
                    createVector('scoring_time', Flow.TNumber, [prediction.scoring_time])
                ];
                return createDataframe(frameLabel, vectors, lodash.range(1), null, {
                    description: frameLabel,
                    origin: origin
                });
            };
        };
        inspectRegressionPrediction = function (prediction) {
            return function () {
                var frame, model, vectors;
                frame = prediction.frame, model = prediction.model;
                vectors = [
                    createFactor('key', Flow.TString, [model.name]),
                    createFactor('frame', Flow.TString, [frame.name]),
                    createFactor('model_category', Flow.TString, [prediction.model_category]),
                    createVector('mse', Flow.TNumber, [prediction.mse]),
                    createVector('sigma', Flow.TNumber, [prediction.sigma]),
                    createVector('logloss', Flow.TNumber, [prediction.logloss]),
                    createVector('duration_in_ms', Flow.TNumber, [prediction.duration_in_ms]),
                    createVector('scoring_time', Flow.TNumber, [prediction.scoring_time])
                ];
                return createDataframe('prediction', vectors, lodash.range(1), null, {
                    description: 'Prediction output for model \'' + model.name + '\' on frame \'' + frame.name + '\'',
                    origin: 'getPrediction model: ' + Flow.Prelude.stringify(model.name) + ', frame: ' + Flow.Prelude.stringify(frame.name)
                });
            };
        };
        inspectBinomialPrediction2 = function (frameLabel, prediction) {
            return function () {
                var frame, model, origin, vectors;
                origin = 'getModel ' + Flow.Prelude.stringify(prediction.model.name);
                frame = prediction.frame, model = prediction.model;
                vectors = [
                    createFactor('model_category', Flow.TString, [prediction.model_category]),
                    createVector('AUC', Flow.TNumber, [prediction.AUC]),
                    createVector('Gini', Flow.TNumber, [prediction.Gini]),
                    createVector('mse', Flow.TNumber, [prediction.mse]),
                    createVector('logloss', Flow.TNumber, [prediction.logloss]),
                    createVector('duration_in_ms', Flow.TNumber, [prediction.duration_in_ms]),
                    createVector('scoring_time', Flow.TNumber, [prediction.scoring_time])
                ];
                return createDataframe(frameLabel, vectors, lodash.range(1), null, {
                    description: frameLabel,
                    origin: origin
                });
            };
        };
        inspectBinomialPrediction = function (prediction) {
            return function () {
                var frame, model, vectors;
                frame = prediction.frame, model = prediction.model;
                vectors = [
                    createFactor('key', Flow.TString, [model.name]),
                    createFactor('frame', Flow.TString, [frame.name]),
                    createFactor('model_category', Flow.TString, [prediction.model_category]),
                    createVector('AUC', Flow.TNumber, [prediction.AUC]),
                    createVector('Gini', Flow.TNumber, [prediction.Gini]),
                    createVector('mse', Flow.TNumber, [prediction.mse]),
                    createVector('logloss', Flow.TNumber, [prediction.logloss]),
                    createVector('duration_in_ms', Flow.TNumber, [prediction.duration_in_ms]),
                    createVector('scoring_time', Flow.TNumber, [prediction.scoring_time])
                ];
                return createDataframe('Prediction', vectors, lodash.range(1), null, {
                    description: 'Prediction output for model \'' + model.name + '\' on frame \'' + frame.name + '\'',
                    origin: 'getPrediction model: ' + Flow.Prelude.stringify(model.name) + ', frame: ' + Flow.Prelude.stringify(frame.name)
                });
            };
        };
        inspectMultinomialConfusionMatrix = function (name, table, origin, inspections) {
            table.name = name;
            return inspections[table.name] = function () {
                return convertTableToFrame(table, {
                    description: table.name,
                    origin: origin
                });
            };
        };
        inspectBinomialConfusionMatrices2 = function (frameLabel, prediction) {
            return function () {
                var origin, vectors;
                origin = 'getModel ' + Flow.Prelude.stringify(prediction.model.name);
                vectors = [
                    createList('CM', prediction.confusion_matrices, formatConfusionMatrix),
                    createVector('TPR', Flow.TNumber, lodash.map(prediction.confusion_matrices, computeTruePositiveRate)),
                    createVector('FPR', Flow.TNumber, lodash.map(prediction.confusion_matrices, computeFalsePositiveRate))
                ];
                return createDataframe(frameLabel, vectors, lodash.range(prediction.confusion_matrices.length), null, {
                    description: frameLabel,
                    origin: origin,
                    plot: 'plot inspect \'' + frameLabel + '\', ' + origin
                });
            };
        };
        inspectBinomialConfusionMatrices = function (opts, predictions) {
            return function () {
                var prediction, vectors;
                vectors = [
                    createList('CM', concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.confusion_matrices);
                        }
                        return _results;
                    }()), formatConfusionMatrix),
                    createVector('TPR', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(lodash.map(prediction.confusion_matrices, computeTruePositiveRate));
                        }
                        return _results;
                    }())),
                    createVector('FPR', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(lodash.map(prediction.confusion_matrices, computeFalsePositiveRate));
                        }
                        return _results;
                    }())),
                    createFactor('key', Flow.TString, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(repeatValues(prediction.confusion_matrices.length, prediction.model.name + ' on ' + prediction.frame.name));
                        }
                        return _results;
                    }()))
                ];
                return createDataframe('Confusion Matrices', vectors, lodash.range(lodash.head(vectors).count()), null, {
                    description: 'Confusion matrices for the selected predictions',
                    origin: formulateGetPredictionsOrigin(opts),
                    plot: 'plot inspect \'Confusion Matrices\', ' + formulateGetPredictionsOrigin(opts)
                });
            };
        };
        inspectBinomialMetrics = function (opts, predictions) {
            return function () {
                var inspectionFrame, prediction;
                inspectionFrame = combineTables(function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                        prediction = predictions[_i];
                        _results.push(prediction.max_criteria_and_metric_scores);
                    }
                    return _results;
                }());
                return convertTableToFrame(inspectionFrame, {
                    description: 'Metrics for the selected predictions',
                    origin: formulateGetPredictionsOrigin(opts),
                    plot: 'plot inspect \'' + inspectionFrame.label + '\', ' + formulateGetPredictionsOrigin(opts)
                });
            };
        };
        inspectBinomialPredictions = function (opts, predictions) {
            return function () {
                var prediction, vectors;
                vectors = [
                    createFactor('key', Flow.TString, function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.model.name + ' on ' + prediction.frame.name);
                        }
                        return _results;
                    }()),
                    createFactor('frame', Flow.TString, function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.frame.name);
                        }
                        return _results;
                    }()),
                    createFactor('model_category', Flow.TString, function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.model_category);
                        }
                        return _results;
                    }()),
                    createVector('AUC', Flow.TNumber, function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.AUC);
                        }
                        return _results;
                    }()),
                    createVector('Gini', Flow.TNumber, function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.Gini);
                        }
                        return _results;
                    }()),
                    createVector('mse', Flow.TNumber, function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.mse);
                        }
                        return _results;
                    }()),
                    createVector('logloss', Flow.TNumber, function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.logloss);
                        }
                        return _results;
                    }()),
                    createVector('duration_in_ms', Flow.TNumber, function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.duration_in_ms);
                        }
                        return _results;
                    }()),
                    createVector('scoring_time', Flow.TNumber, function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.scoring_time);
                        }
                        return _results;
                    }())
                ];
                return createDataframe('predictions', vectors, lodash.range(predictions.length), null, {
                    description: 'Prediction output for selected predictions.',
                    origin: formulateGetPredictionsOrigin(opts),
                    plot: 'plot inspect \'predictions\', ' + formulateGetPredictionsOrigin(opts)
                });
            };
        };
        extendPredictions = function (opts, predictions) {
            var inspections;
            render_(predictions, H2O.PredictsOutput, opts, predictions);
            if (predictions.length) {
                if (lodash.every(predictions, function (prediction) {
                        return prediction.model_category === 'Binomial';
                    })) {
                    inspections = {};
                    inspections['Prediction'] = inspectBinomialPredictions(opts, predictions);
                    inspections[lodash.head(predictions).thresholds_and_metric_scores.name] = inspectBinomialScores(opts, predictions);
                    inspections[lodash.head(predictions).max_criteria_and_metric_scores.name] = inspectBinomialMetrics(opts, predictions);
                    inspect_(predictions, inspections);
                } else {
                    inspect_(predictions, { prediction: inspectBinomialPredictions(opts, predictions) });
                }
            }
            return predictions;
        };
        inspectBinomialScores = function (opts, predictions) {
            return function () {
                var inspectionFrame, prediction;
                inspectionFrame = combineTables(function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                        prediction = predictions[_i];
                        _results.push(prediction.thresholds_and_metric_scores);
                    }
                    return _results;
                }());
                return convertTableToFrame(inspectionFrame, {
                    description: 'Scores for the selected predictions',
                    origin: formulateGetPredictionsOrigin(opts),
                    plot: 'plot inspect \'' + inspectionFrame.label + '\', ' + formulateGetPredictionsOrigin(opts)
                });
            };
        };
        extendPrediction = function (modelKey, frameKey, prediction) {
            var inspections, opts;
            opts = {
                model: modelKey,
                frame: frameKey
            };
            render_(prediction, H2O.PredictOutput, prediction);
            inspections = {};
            switch (prediction.model_category) {
            case 'Regression':
            case 'Clustering':
                inspections.prediction = inspectRegressionPrediction(prediction);
                break;
            case 'Multinomial':
                inspections.prediction = inspectRegressionPrediction(prediction);
                inspectMultinomialConfusionMatrix('Confusion Matrix', prediction.cm.table, 'getPrediction model: ' + Flow.Prelude.stringify(modelKey) + ', frame: ' + Flow.Prelude.stringify(frameKey), inspections);
                break;
            default:
                inspections['Prediction'] = inspectBinomialPrediction(prediction);
                inspections[prediction.thresholds_and_metric_scores.name] = inspectBinomialScores(opts, [prediction]);
                inspections[prediction.max_criteria_and_metric_scores.name] = inspectBinomialMetrics(opts, [prediction]);
            }
            return inspect_(prediction, inspections);
        };
        inspectFrameColumns = function (tableLabel, frameKey, frame, frameColumns) {
            return function () {
                var attrs, column, domain, vectors;
                attrs = [
                    'label',
                    'missing_count',
                    'zero_count',
                    'positive_infinity_count',
                    'negative_infinity_count',
                    'min',
                    'max',
                    'mean',
                    'sigma',
                    'type',
                    'cardinality'
                ];
                vectors = function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = attrs.length; _i < _len; _i++) {
                        name = attrs[_i];
                        switch (name) {
                        case 'min':
                            _results.push(createVector(name, Flow.TNumber, function () {
                                var _j, _len1, _results1;
                                _results1 = [];
                                for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                                    column = frameColumns[_j];
                                    _results1.push(lodash.head(column.mins));
                                }
                                return _results1;
                            }()));
                            break;
                        case 'max':
                            _results.push(createVector(name, Flow.TNumber, function () {
                                var _j, _len1, _results1;
                                _results1 = [];
                                for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                                    column = frameColumns[_j];
                                    _results1.push(lodash.head(column.maxs));
                                }
                                return _results1;
                            }()));
                            break;
                        case 'cardinality':
                            _results.push(createVector(name, Flow.TNumber, function () {
                                var _j, _len1, _results1;
                                _results1 = [];
                                for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                                    column = frameColumns[_j];
                                    _results1.push((domain = column.domain) ? domain.length : void 0);
                                }
                                return _results1;
                            }()));
                            break;
                        case 'label':
                        case 'type':
                            _results.push(createFactor(name, Flow.TString, function () {
                                var _j, _len1, _results1;
                                _results1 = [];
                                for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                                    column = frameColumns[_j];
                                    _results1.push(column[name]);
                                }
                                return _results1;
                            }()));
                            break;
                        default:
                            _results.push(createVector(name, Flow.TNumber, function () {
                                var _j, _len1, _results1;
                                _results1 = [];
                                for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                                    column = frameColumns[_j];
                                    _results1.push(column[name]);
                                }
                                return _results1;
                            }()));
                        }
                    }
                    return _results;
                }();
                return createDataframe(tableLabel, vectors, lodash.range(frameColumns.length), null, {
                    description: 'A list of ' + tableLabel + ' in the H2O Frame.',
                    origin: 'getFrameSummary ' + Flow.Prelude.stringify(frameKey),
                    plot: 'plot inspect \'' + tableLabel + '\', getFrameSummary ' + Flow.Prelude.stringify(frameKey)
                });
            };
        };
        inspectFrameData = function (frameKey, frame) {
            return function () {
                var column, domain, frameColumns, index, rowIndex, vectors;
                frameColumns = frame.columns;
                vectors = function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = frameColumns.length; _i < _len; _i++) {
                        column = frameColumns[_i];
                        switch (column.type) {
                        case 'int':
                        case 'real':
                            _results.push(createVector(column.label, Flow.TNumber, parseNaNs(column.data)));
                            break;
                        case 'enum':
                            domain = column.domain;
                            _results.push(createFactor(column.label, Flow.TString, function () {
                                var _j, _len1, _ref1, _results1;
                                _ref1 = column.data;
                                _results1 = [];
                                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                                    index = _ref1[_j];
                                    _results1.push(index != null ? domain[index] : void 0);
                                }
                                return _results1;
                            }()));
                            break;
                        case 'time':
                            _results.push(createVector(column.label, Flow.TNumber, parseNaNs(column.data)));
                            break;
                        case 'string':
                            _results.push(createList(column.label, parseNulls(column.string_data)));
                            break;
                        default:
                            _results.push(createList(column.label, parseNulls(column.data)));
                        }
                    }
                    return _results;
                }();
                vectors.unshift(createVector('Row', Flow.TNumber, function () {
                    var _i, _ref1, _ref2, _results;
                    _results = [];
                    for (rowIndex = _i = _ref1 = frame.row_offset, _ref2 = frame.row_count; _ref1 <= _ref2 ? _i < _ref2 : _i > _ref2; rowIndex = _ref1 <= _ref2 ? ++_i : --_i) {
                        _results.push(rowIndex + 1);
                    }
                    return _results;
                }()));
                return createDataframe('data', vectors, lodash.range(frame.row_count - frame.row_offset), null, {
                    description: 'A partial list of rows in the H2O Frame.',
                    origin: 'getFrame ' + Flow.Prelude.stringify(frameKey)
                });
            };
        };
        extendFrame = function (frameKey, frame) {
            var column, enumColumns, inspections;
            inspections = {
                columns: inspectFrameColumns('columns', frameKey, frame, frame.columns),
                data: inspectFrameData(frameKey, frame)
            };
            enumColumns = function () {
                var _i, _len, _ref1, _results;
                _ref1 = frame.columns;
                _results = [];
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
            inspect_(frame, inspections);
            return render_(frame, H2O.FrameOutput, frame);
        };
        extendColumnSummary = function (frameKey, frame, columnName) {
            var column, inspectCharacteristics, inspectDistribution, inspectDomain, inspectPercentiles, inspectSummary, inspections, rowCount;
            column = lodash.head(frame.columns);
            rowCount = frame.rows;
            inspectPercentiles = function () {
                var vectors;
                vectors = [
                    createVector('percentile', Flow.TNumber, frame.default_percentiles),
                    createVector('value', Flow.TNumber, column.percentiles)
                ];
                return createDataframe('percentiles', vectors, lodash.range(frame.default_percentiles.length), null, {
                    description: 'Percentiles for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName)
                });
            };
            inspectDistribution = function () {
                var base, binCount, binIndex, bins, count, countData, i, interval, intervalData, m, minBinCount, n, rows, stride, vectors, width, widthData, _i, _j, _k, _len;
                minBinCount = 32;
                base = column.histogram_base, stride = column.histogram_stride, bins = column.histogram_bins;
                width = Math.floor(bins.length / minBinCount);
                interval = stride * width;
                rows = [];
                if (width > 0) {
                    binCount = minBinCount + (bins.length % width > 0 ? 1 : 0);
                    intervalData = new Array(binCount);
                    widthData = new Array(binCount);
                    countData = new Array(binCount);
                    for (i = _i = 0; 0 <= binCount ? _i < binCount : _i > binCount; i = 0 <= binCount ? ++_i : --_i) {
                        m = i * width;
                        n = m + width;
                        count = 0;
                        for (binIndex = _j = m; m <= n ? _j < n : _j > n; binIndex = m <= n ? ++_j : --_j) {
                            if (n < bins.length) {
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
                vectors = [
                    createFactor('interval', Flow.TString, intervalData),
                    createVector('width', Flow.TNumber, widthData),
                    createVector('count', Flow.TNumber, countData)
                ];
                return createDataframe('distribution', vectors, lodash.range(binCount), null, {
                    description: 'Distribution for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName),
                    plot: 'plot inspect \'distribution\', getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName)
                });
            };
            inspectCharacteristics = function () {
                var characteristicData, count, countData, missing_count, negative_infinity_count, other, percentData, positive_infinity_count, vectors, zero_count;
                missing_count = column.missing_count, zero_count = column.zero_count, positive_infinity_count = column.positive_infinity_count, negative_infinity_count = column.negative_infinity_count;
                other = rowCount - missing_count - zero_count - positive_infinity_count - negative_infinity_count;
                characteristicData = [
                    'Missing',
                    '-Inf',
                    'Zero',
                    '+Inf',
                    'Other'
                ];
                countData = [
                    missing_count,
                    negative_infinity_count,
                    zero_count,
                    positive_infinity_count,
                    other
                ];
                percentData = function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = countData.length; _i < _len; _i++) {
                        count = countData[_i];
                        _results.push(100 * count / rowCount);
                    }
                    return _results;
                }();
                vectors = [
                    createFactor('characteristic', Flow.TString, characteristicData),
                    createVector('count', Flow.TNumber, countData),
                    createVector('percent', Flow.TNumber, percentData)
                ];
                return createDataframe('characteristics', vectors, lodash.range(characteristicData.length), null, {
                    description: 'Characteristics for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName),
                    plot: 'plot inspect \'characteristics\', getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName)
                });
            };
            inspectSummary = function () {
                var defaultPercentiles, maximum, mean, minimum, outliers, percentiles, q1, q2, q3, vectors;
                defaultPercentiles = frame.default_percentiles;
                percentiles = column.percentiles;
                mean = column.mean;
                q1 = percentiles[defaultPercentiles.indexOf(0.25)];
                q2 = percentiles[defaultPercentiles.indexOf(0.5)];
                q3 = percentiles[defaultPercentiles.indexOf(0.75)];
                outliers = lodash.unique(column.mins.concat(column.maxs));
                minimum = lodash.head(column.mins);
                maximum = lodash.head(column.maxs);
                vectors = [
                    createFactor('column', Flow.TString, [columnName]),
                    createVector('mean', Flow.TNumber, [mean]),
                    createVector('q1', Flow.TNumber, [q1]),
                    createVector('q2', Flow.TNumber, [q2]),
                    createVector('q3', Flow.TNumber, [q3]),
                    createVector('min', Flow.TNumber, [minimum]),
                    createVector('max', Flow.TNumber, [maximum])
                ];
                return createDataframe('summary', vectors, lodash.range(1), null, {
                    description: 'Summary for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName),
                    plot: 'plot inspect \'summary\', getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName)
                });
            };
            inspectDomain = function () {
                var counts, i, labels, level, levels, percents, sortedLevels, top15Levels, vectors, _i, _len, _ref1;
                levels = lodash.map(column.histogram_bins, function (count, index) {
                    return {
                        count: count,
                        index: index
                    };
                });
                sortedLevels = lodash.sortBy(levels, function (level) {
                    return -level.count;
                });
                top15Levels = lodash.head(sortedLevels, 15);
                _ref1 = createArrays(3, top15Levels.length), labels = _ref1[0], counts = _ref1[1], percents = _ref1[2];
                for (i = _i = 0, _len = top15Levels.length; _i < _len; i = ++_i) {
                    level = top15Levels[i];
                    labels[i] = column.domain[level.index];
                    counts[i] = level.count;
                    percents[i] = 100 * level.count / rowCount;
                }
                vectors = [
                    createFactor('label', Flow.TString, labels),
                    createVector('count', Flow.TNumber, counts),
                    createVector('percent', Flow.TNumber, percents)
                ];
                return createDataframe('domain', vectors, lodash.range(top15Levels.length), null, {
                    description: 'Domain for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName),
                    plot: 'plot inspect \'domain\', getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName)
                });
            };
            inspections = { characteristics: inspectCharacteristics };
            if (column.type === 'int' || column.type === 'real') {
                inspections.summary = inspectSummary;
                inspections.distribution = inspectDistribution;
                inspections.percentiles = inspectPercentiles;
            } else {
                inspections.domain = inspectDomain;
            }
            inspect_(frame, inspections);
            return render_(frame, H2O.ColumnSummaryOutput, frameKey, frame, columnName);
        };
        requestFrame = function (frameKey, go) {
            return _.requestFrame(frameKey, function (error, frame) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendFrame(frameKey, frame));
                }
            });
        };
        requestFrameSummary = function (frameKey, go) {
            return _.requestFrameSummary(frameKey, function (error, frame) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendFrame(frameKey, frame));
                }
            });
        };
        requestColumnSummary = function (frameKey, columnName, go) {
            return _.requestColumnSummary(frameKey, columnName, function (error, frame) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendColumnSummary(frameKey, frame, columnName));
                }
            });
        };
        requestFrames = function (go) {
            return _.requestFrames(function (error, frames) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendFrames(frames));
                }
            });
        };
        requestCreateFrame = function (opts, go) {
            return _.requestCreateFrame(opts, function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return _.requestJob(result.key.name, function (error, job) {
                        if (error) {
                            return go(error);
                        } else {
                            return go(null, extendJob(job));
                        }
                    });
                }
            });
        };
        computeSplits = function (ratios, keys) {
            var i, key, part, parts, ratio, splits, sum, _i, _j, _len, _len1, _ref1, _ref2;
            parts = [];
            sum = 0;
            _ref1 = keys.slice(0, ratios.length);
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
            splits = [];
            sum = 0;
            _ref2 = lodash.sortBy(parts, function (part) {
                return part.ratio;
            });
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                part = _ref2[_j];
                splits.push({
                    min: sum,
                    max: sum + part.ratio,
                    key: part.key
                });
                sum += part.ratio;
            }
            console.log(splits);
            return splits;
        };
        requestSplitFrame = function (frameKey, splitRatios, splitKeys, go) {
            var frameExpr, randomVecKey, splits;
            if (splitRatios.length === splitKeys.length - 1) {
                splits = computeSplits(splitRatios, splitKeys);
                frameExpr = JSON.stringify(frameKey);
                randomVecKey = createTempKey();
                return _.requestExec('(= !' + randomVecKey + ' (h2o.runif ' + frameExpr + ' #-1))', function (error, result) {
                    var exprs, futures, g, i, l, part, sliceExpr;
                    if (error) {
                        return go(error);
                    } else {
                        exprs = function () {
                            var _i, _len, _results;
                            _results = [];
                            for (i = _i = 0, _len = splits.length; _i < _len; i = ++_i) {
                                part = splits[i];
                                g = i !== 0 ? '(G %' + randomVecKey + ' #' + part.min + ')' : null;
                                l = i !== splits.length - 1 ? '(l %' + randomVecKey + ' #' + part.max + ')' : null;
                                sliceExpr = g && l ? '(& ' + g + ' ' + l + ')' : l ? l : g;
                                _results.push('(= !' + JSON.stringify(part.key) + ' ([ %' + frameExpr + ' ' + sliceExpr + ' "null"))');
                            }
                            return _results;
                        }();
                        futures = lodash.map(exprs, function (expr) {
                            return _fork(_.requestExec, expr);
                        });
                        return Flow.Async.join(futures, function (error, results) {
                            if (error) {
                                return go(error);
                            } else {
                                return _.requestDeleteFrame(randomVecKey, function (error, result) {
                                    if (error) {
                                        return go(error);
                                    } else {
                                        return go(null, extendSplitFrameResult({
                                            keys: splitKeys,
                                            ratios: splitRatios
                                        }));
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                return go(new Flow.Error('The number of split ratios should be one less than the number of split keys'));
            }
        };
        createFrame = function (opts) {
            if (opts) {
                return _fork(requestCreateFrame, opts);
            } else {
                return assist(createFrame);
            }
        };
        splitFrame = function (frameKey, splitRatios, splitKeys) {
            if (frameKey && splitRatios && splitKeys) {
                return _fork(requestSplitFrame, frameKey, splitRatios, splitKeys);
            } else {
                return assist(splitFrame);
            }
        };
        getFrames = function () {
            return _fork(requestFrames);
        };
        getFrame = function (frameKey) {
            switch (Flow.Prelude.typeOf(frameKey)) {
            case 'String':
                return _fork(requestFrame, frameKey);
            default:
                return assist(getFrame);
            }
        };
        getFrameSummary = function (frameKey) {
            switch (Flow.Prelude.typeOf(frameKey)) {
            case 'String':
                return _fork(requestFrameSummary, frameKey);
            default:
                return assist(getFrameSummary);
            }
        };
        requestDeleteFrame = function (frameKey, go) {
            return _.requestDeleteFrame(frameKey, function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendDeletedKeys([frameKey]));
                }
            });
        };
        deleteFrame = function (frameKey) {
            if (frameKey) {
                return _fork(requestDeleteFrame, frameKey);
            } else {
                return assist(deleteFrame);
            }
        };
        requestDeleteFrames = function (frameKeys, go) {
            var futures;
            futures = lodash.map(frameKeys, function (frameKey) {
                return _fork(_.requestDeleteFrame, frameKey);
            });
            return Flow.Async.join(futures, function (error, results) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendDeletedKeys(frameKeys));
                }
            });
        };
        deleteFrames = function (frameKeys) {
            switch (frameKeys.length) {
            case 0:
                return assist(deleteFrames);
            case 1:
                return deleteFrame(lodash.head(frameKeys));
            default:
                return _fork(requestDeleteFrames, frameKeys);
            }
        };
        getColumnSummary = function (frameKey, columnName) {
            return _fork(requestColumnSummary, frameKey, columnName);
        };
        requestModels = function (go) {
            return _.requestModels(function (error, models) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendModels(models));
                }
            });
        };
        requestModelsByKeys = function (modelKeys, go) {
            var futures;
            futures = lodash.map(modelKeys, function (key) {
                return _fork(_.requestModel, key);
            });
            return Flow.Async.join(futures, function (error, models) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendModels(models));
                }
            });
        };
        getModels = function (modelKeys) {
            if (lodash.isArray(modelKeys)) {
                if (modelKeys.length) {
                    return _fork(requestModelsByKeys, modelKeys);
                } else {
                    return _fork(requestModels);
                }
            } else {
                return _fork(requestModels);
            }
        };
        requestModel = function (modelKey, go) {
            return _.requestModel(modelKey, function (error, model) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendModel(model));
                }
            });
        };
        getModel = function (modelKey) {
            switch (Flow.Prelude.typeOf(modelKey)) {
            case 'String':
                return _fork(requestModel, modelKey);
            default:
                return assist(getModel);
            }
        };
        requestDeleteModel = function (modelKey, go) {
            return _.requestDeleteModel(modelKey, function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendDeletedKeys([modelKey]));
                }
            });
        };
        deleteModel = function (modelKey) {
            if (modelKey) {
                return _fork(requestDeleteModel, modelKey);
            } else {
                return assist(deleteModel);
            }
        };
        requestDeleteModels = function (modelKeys, go) {
            var futures;
            futures = lodash.map(modelKeys, function (modelKey) {
                return _fork(_.requestDeleteModel, modelKey);
            });
            return Flow.Async.join(futures, function (error, results) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendDeletedKeys(modelKeys));
                }
            });
        };
        deleteModels = function (modelKeys) {
            switch (modelKeys.length) {
            case 0:
                return assist(deleteModels);
            case 1:
                return deleteModel(lodash.head(modelKeys));
            default:
                return _fork(requestDeleteModels, modelKeys);
            }
        };
        requestJob = function (key, go) {
            return _.requestJob(key, function (error, job) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendJob(job));
                }
            });
        };
        requestJobs = function (go) {
            return _.requestJobs(function (error, jobs) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendJobs(jobs));
                }
            });
        };
        getJobs = function () {
            return _fork(requestJobs);
        };
        getJob = function (arg) {
            switch (Flow.Prelude.typeOf(arg)) {
            case 'String':
                return _fork(requestJob, arg);
            case 'Object':
                if (arg.key != null) {
                    return getJob(arg.key);
                } else {
                    return assist(getJob);
                }
                break;
            default:
                return assist(getJob);
            }
        };
        extendImportResults = function (importResults) {
            return render_(importResults, H2O.ImportFilesOutput, importResults);
        };
        requestImportFiles = function (paths, go) {
            return _.requestImportFiles(paths, function (error, importResults) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendImportResults(importResults));
                }
            });
        };
        importFiles = function (paths) {
            switch (Flow.Prelude.typeOf(paths)) {
            case 'Array':
                return _fork(requestImportFiles, paths);
            default:
                return assist(importFiles);
            }
        };
        extendParseSetupResults = function (args, parseSetupResults) {
            return render_(parseSetupResults, H2O.SetupParseOutput, args, parseSetupResults);
        };
        requestImportAndParseSetup = function (paths, go) {
            return _.requestImportFiles(paths, function (error, importResults) {
                var sourceKeys;
                if (error) {
                    return go(error);
                } else {
                    sourceKeys = lodash.flatten(lodash.compact(lodash.map(importResults, function (result) {
                        return result.keys;
                    })));
                    return _.requestParseSetup(sourceKeys, function (error, parseSetupResults) {
                        if (error) {
                            return go(error);
                        } else {
                            return go(null, extendParseSetupResults({ paths: paths }, parseSetupResults));
                        }
                    });
                }
            });
        };
        requestParseSetup = function (sourceKeys, go) {
            return _.requestParseSetup(sourceKeys, function (error, parseSetupResults) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendParseSetupResults({ source_keys: sourceKeys }, parseSetupResults));
                }
            });
        };
        setupParse = function (args) {
            if (args.paths && lodash.isArray(args.paths)) {
                return _fork(requestImportAndParseSetup, args.paths);
            } else if (args.source_keys && lodash.isArray(args.source_keys)) {
                return _fork(requestParseSetup, args.source_keys);
            } else {
                return assist(setupParse);
            }
        };
        extendParseResult = function (parseResult) {
            return render_(parseResult, H2O.JobOutput, parseResult.job);
        };
        requestImportAndParseFiles = function (paths, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) {
            return _.requestImportFiles(paths, function (error, importResults) {
                var sourceKeys;
                if (error) {
                    return go(error);
                } else {
                    sourceKeys = lodash.flatten(lodash.compact(lodash.map(importResults, function (result) {
                        return result.keys;
                    })));
                    return _.requestParseFiles(sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, function (error, parseResult) {
                        if (error) {
                            return go(error);
                        } else {
                            return go(null, extendParseResult(parseResult));
                        }
                    });
                }
            });
        };
        requestParseFiles = function (sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) {
            return _.requestParseFiles(sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, function (error, parseResult) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendParseResult(parseResult));
                }
            });
        };
        parseFiles = function (opts) {
            var checkHeader, chunkSize, columnCount, columnNames, columnTypes, deleteOnDone, destinationKey, parseType, separator, useSingleQuotes;
            destinationKey = opts.destination_key;
            parseType = opts.parse_type;
            separator = opts.separator;
            columnCount = opts.number_columns;
            useSingleQuotes = opts.single_quotes;
            columnNames = opts.column_names;
            columnTypes = opts.column_types;
            deleteOnDone = opts.delete_on_done;
            checkHeader = opts.check_header;
            chunkSize = opts.chunk_size;
            if (opts.paths) {
                return _fork(requestImportAndParseFiles, opts.paths, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize);
            } else {
                return _fork(requestParseFiles, opts.source_keys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize);
            }
        };
        requestModelBuild = function (algo, opts, go) {
            return _.requestModelBuild(algo, opts, function (error, result) {
                var messages, validation;
                if (error) {
                    return go(error);
                } else {
                    if (result.validation_error_count > 0) {
                        messages = function () {
                            var _i, _len, _ref1, _results;
                            _ref1 = result.validation_messages;
                            _results = [];
                            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                                validation = _ref1[_i];
                                _results.push(validation.message);
                            }
                            return _results;
                        }();
                        return go(new Flow.Error('Model build failure: ' + messages.join('; ')));
                    } else {
                        return go(null, extendJob(result.job));
                    }
                }
            });
        };
        buildModel = function (algo, opts) {
            if (algo && opts && lodash.keys(opts).length > 1) {
                return _fork(requestModelBuild, algo, opts);
            } else {
                return assist(buildModel, algo, opts);
            }
        };
        requestPredict = function (destinationKey, modelKey, frameKey, go) {
            return _.requestPredict(destinationKey, modelKey, frameKey, function (error, prediction) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendPrediction(modelKey, frameKey, prediction));
                }
            });
        };
        requestPredicts = function (opts, go) {
            var futures;
            futures = lodash.map(opts, function (opt) {
                var frameKey, modelKey;
                modelKey = opt.model, frameKey = opt.frame;
                return _fork(_.requestPredict, null, modelKey, frameKey);
            });
            return Flow.Async.join(futures, function (error, predictions) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendPredictions(opts, predictions));
                }
            });
        };
        predict = function (opts) {
            var combos, destination_key, frame, frames, model, models, _i, _j, _len, _len1;
            if (opts == null) {
                opts = {};
            }
            destination_key = opts.destination_key, model = opts.model, models = opts.models, frame = opts.frame, frames = opts.frames;
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
                } else {
                    return assist(predict, {
                        destination_key: destination_key,
                        models: models,
                        frames: frames
                    });
                }
            } else {
                if (model && frame) {
                    return _fork(requestPredict, destination_key, model, frame);
                } else {
                    return assist(predict, {
                        destination_key: destination_key,
                        model: model,
                        frame: frame
                    });
                }
            }
        };
        requestPrediction = function (modelKey, frameKey, go) {
            return _.requestPrediction(modelKey, frameKey, function (error, prediction) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendPrediction(modelKey, frameKey, prediction));
                }
            });
        };
        requestPredictions = function (opts, go) {
            var frameKey, futures, modelKey;
            if (lodash.isArray(opts)) {
                futures = lodash.map(opts, function (opt) {
                    var frameKey, modelKey;
                    modelKey = opt.model, frameKey = opt.frame;
                    return _fork(_.requestPredictions, modelKey, frameKey);
                });
                return Flow.Async.join(futures, function (error, predictions) {
                    var uniquePredictions;
                    if (error) {
                        return go(error);
                    } else {
                        uniquePredictions = lodash.values(lodash.indexBy(lodash.flatten(predictions, true), function (prediction) {
                            return prediction.model.name + prediction.frame.name;
                        }));
                        return go(null, extendPredictions(opts, uniquePredictions));
                    }
                });
            } else {
                modelKey = opts.model, frameKey = opts.frame;
                return _.requestPredictions(modelKey, frameKey, function (error, predictions) {
                    if (error) {
                        return go(error);
                    } else {
                        return go(null, extendPredictions(opts, predictions));
                    }
                });
            }
        };
        getPrediction = function (opts) {
            var destination_key, frame, model;
            if (opts == null) {
                opts = {};
            }
            destination_key = opts.destination_key, model = opts.model, frame = opts.frame;
            if (model && frame) {
                return _fork(requestPrediction, model, frame);
            } else {
                return assist(getPrediction, {
                    destination_key: destination_key,
                    model: model,
                    frame: frame
                });
            }
        };
        getPredictions = function (opts) {
            if (opts == null) {
                opts = {};
            }
            return _fork(requestPredictions, opts);
        };
        requestCloud = function (go) {
            return _.requestCloud(function (error, cloud) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendCloud(cloud));
                }
            });
        };
        getCloud = function () {
            return _fork(requestCloud);
        };
        requestTimeline = function (go) {
            return _.requestTimeline(function (error, timeline) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendTimeline(timeline));
                }
            });
        };
        getTimeline = function () {
            return _fork(requestTimeline);
        };
        requestStackTrace = function (go) {
            return _.requestStackTrace(function (error, stackTrace) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendStackTrace(stackTrace));
                }
            });
        };
        getStackTrace = function () {
            return _fork(requestStackTrace);
        };
        requestCurrentNodeIndex = function (nodeIndex, go) {
            if (nodeIndex < 0) {
                return _.requestCloud(function (error, cloud) {
                    if (error) {
                        return go(error);
                    } else {
                        return go(null, cloud.node_idx);
                    }
                });
            } else {
                return go(null, nodeIndex);
            }
        };
        requestLogFile = function (nodeIndex, fileType, go) {
            return _.requestCloud(function (error, cloud) {
                if (error) {
                    return go(error);
                } else {
                    if (nodeIndex < 0 || nodeIndex >= cloud.nodes.length) {
                        nodeIndex = cloud.node_idx;
                    }
                    return _.requestLogFile(nodeIndex, fileType, function (error, logFile) {
                        if (error) {
                            return go(error);
                        } else {
                            return go(null, extendLogFile(cloud, nodeIndex, fileType, logFile));
                        }
                    });
                }
            });
        };
        getLogFile = function (nodeIndex, fileType) {
            if (nodeIndex == null) {
                nodeIndex = -1;
            }
            if (fileType == null) {
                fileType = 'info';
            }
            return _fork(requestLogFile, nodeIndex, fileType);
        };
        requestNetworkTest = function (go) {
            return _.requestNetworkTest(function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendNetworkTest(result));
                }
            });
        };
        testNetwork = function () {
            return _fork(requestNetworkTest);
        };
        requestRemoveAll = function (go) {
            return _.requestRemoveAll(function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendDeletedKeys([]));
                }
            });
        };
        deleteAll = function () {
            return _fork(requestRemoveAll);
        };
        extendRDDs = function (rdds) {
            render_(rdds, H2O.RDDsOutput, rdds);
            return rdds;
        };
        requestRDDs = function (go) {
            return _.requestRDDs(function (error, rdds) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendRDDs(rdds));
                }
            });
        };
        getRDDs = function () {
            return _fork(requestRDDs);
        };
        requestProfile = function (depth, go) {
            return _.requestProfile(depth, function (error, profile) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendProfile(profile));
                }
            });
        };
        getProfile = function (opts) {
            if (!opts) {
                opts = { depth: 10 };
            }
            return _fork(requestProfile, opts.depth);
        };
        loadScript = function (path, go) {
            var onDone, onFail;
            onDone = function (script, status) {
                return go(null, {
                    script: script,
                    status: status
                });
            };
            onFail = function (jqxhr, settings, error) {
                return go(error);
            };
            return $.getScript(path).done(onDone).fail(onFail);
        };
        dumpFuture = function (result, go) {
            if (result == null) {
                result = {};
            }
            console.debug(result);
            return go(null, render_(result, Flow.ObjectBrowser, 'dump', result));
        };
        dump = function (f) {
            if (f != null ? f.isFuture : void 0) {
                return _fork(dumpFuture, f);
            } else {
                return Flow.Async.async(function () {
                    return f;
                });
            }
        };
        assist = function () {
            var args, func;
            func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            if (func === void 0) {
                return _fork(proceed, H2O.Assist, [_assistance]);
            } else {
                switch (func) {
                case importFiles:
                    return _fork(proceed, H2O.ImportFilesInput, []);
                case buildModel:
                    return _fork(proceed, H2O.ModelInput, args);
                case predict:
                case getPrediction:
                    return _fork(proceed, H2O.PredictInput, args);
                case createFrame:
                    return _fork(proceed, H2O.CreateFrameInput, args);
                case splitFrame:
                    return _fork(proceed, H2O.SplitFrameInput, args);
                default:
                    return _fork(proceed, H2O.NoAssist, []);
                }
            }
        };
        Flow.Dataflow.link(_.ready, function () {
            Flow.Dataflow.link(_.inspect, inspect);
            Flow.Dataflow.link(_.plot, function (plot) {
                return plot(lightning);
            });
            Flow.Dataflow.link(_.grid, function (frame) {
                return lightning(lightning.select(), lightning.from(frame));
            });
            return Flow.Dataflow.link(_.enumerate, function (frame) {
                return lightning(lightning.select(0), lightning.from(frame));
            });
        });
        Flow.Dataflow.link(_.initialized, function () {
            return _.requestEndpoints(function (error, response) {
                var route, _i, _len, _ref1, _results;
                if (!error) {
                    _ref1 = response.routes;
                    _results = [];
                    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                        route = _ref1[_i];
                        if (route.url_pattern === '/3/RDDs') {
                            _results.push(_assistance.getRDDs = {
                                description: 'Get a list of RDDs in H<sub>2</sub>O',
                                icon: 'database'
                            });
                        } else {
                            _results.push(void 0);
                        }
                    }
                    return _results;
                }
            });
        });
        return {
            fork: _fork,
            join: _join,
            call: _call,
            apply: _apply,
            isFuture: _isFuture,
            signal: Flow.Dataflow.signal,
            signals: Flow.Dataflow.signals,
            isSignal: Flow.Dataflow.isSignal,
            act: Flow.Dataflow.act,
            react: Flow.Dataflow.react,
            lift: Flow.Dataflow.lift,
            merge: Flow.Dataflow.merge,
            dump: dump,
            inspect: inspect,
            plot: plot,
            grid: grid,
            get: _get,
            assist: assist,
            gui: gui,
            loadScript: loadScript,
            getJobs: getJobs,
            getJob: getJob,
            importFiles: importFiles,
            setupParse: setupParse,
            parseFiles: parseFiles,
            createFrame: createFrame,
            splitFrame: splitFrame,
            getFrames: getFrames,
            getFrame: getFrame,
            getFrameSummary: getFrameSummary,
            deleteFrames: deleteFrames,
            deleteFrame: deleteFrame,
            getRDDs: getRDDs,
            getColumnSummary: getColumnSummary,
            buildModel: buildModel,
            getModels: getModels,
            getModel: getModel,
            deleteModels: deleteModels,
            deleteModel: deleteModel,
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
    };
}.call(this));
(function () {
    var getFileBaseName, validateFileExtension;
    validateFileExtension = function (filename, extension) {
        return -1 !== filename.indexOf(extension, filename.length - extension.length);
    };
    getFileBaseName = function (filename, extension) {
        return Flow.Util.sanitizeName(filename.substr(0, filename.length - extension.length));
    };
    H2O.Util = {
        validateFileExtension: validateFileExtension,
        getFileBaseName: getFileBaseName
    };
}.call(this));
(function () {
    H2O.Assist = function (_, _go, _items) {
        var createAssistItem, item, name;
        createAssistItem = function (name, item) {
            return {
                name: name,
                description: item.description,
                icon: 'fa fa-' + item.icon + ' flow-icon',
                execute: function () {
                    return _.insertAndExecuteCell('cs', name);
                }
            };
        };
        lodash.defer(_go);
        return {
            routines: function () {
                var _results;
                _results = [];
                for (name in _items) {
                    item = _items[name];
                    _results.push(createAssistItem(name, item));
                }
                return _results;
            }(),
            template: 'flow-assist'
        };
    };
}.call(this));
(function () {
    H2O.CloudOutput = function (_, _go, _cloud) {
        var avg, createGrid, createNodeRow, createTotalRow, format3f, formatMilliseconds, formatThreads, prettyPrintBytes, refresh, sum, toggleExpansion, toggleRefresh, updateCloud, _exception, _hasConsensus, _headers, _isBusy, _isExpanded, _isHealthy, _isLive, _isLocked, _name, _nodeCounts, _nodes, _size, _sizes, _uptime, _version;
        _exception = Flow.Dataflow.signal(null);
        _isLive = Flow.Dataflow.signal(false);
        _isBusy = Flow.Dataflow.signal(false);
        _isExpanded = Flow.Dataflow.signal(false);
        _name = Flow.Dataflow.signal();
        _size = Flow.Dataflow.signal();
        _uptime = Flow.Dataflow.signal();
        _version = Flow.Dataflow.signal();
        _nodeCounts = Flow.Dataflow.signal();
        _hasConsensus = Flow.Dataflow.signal();
        _isLocked = Flow.Dataflow.signal();
        _isHealthy = Flow.Dataflow.signal();
        _nodes = Flow.Dataflow.signals();
        formatMilliseconds = function (ms) {
            return Flow.Util.fromNow(new Date(new Date().getTime() - ms));
        };
        format3f = d3.format('.3f');
        _sizes = [
            'B',
            'KB',
            'MB',
            'GB',
            'TB',
            'PB',
            'EB',
            'ZB',
            'YB'
        ];
        prettyPrintBytes = function (bytes) {
            var i;
            if (bytes === 0) {
                return '-';
            }
            i = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + _sizes[i];
        };
        formatThreads = function (fjs) {
            var i, max_lo, s, _i, _j, _k, _ref;
            for (max_lo = _i = 120; _i > 0; max_lo = --_i) {
                if (fjs[max_lo - 1] !== -1) {
                    break;
                }
            }
            s = '[';
            for (i = _j = 0; 0 <= max_lo ? _j < max_lo : _j > max_lo; i = 0 <= max_lo ? ++_j : --_j) {
                s += Math.max(fjs[i], 0);
                s += '/';
            }
            s += '.../';
            for (i = _k = 120, _ref = fjs.length - 1; 120 <= _ref ? _k < _ref : _k > _ref; i = 120 <= _ref ? ++_k : --_k) {
                s += fjs[i];
                s += '/';
            }
            s += fjs[fjs.length - 1];
            s += ']';
            return s;
        };
        sum = function (nodes, attrOf) {
            var node, total, _i, _len;
            total = 0;
            for (_i = 0, _len = nodes.length; _i < _len; _i++) {
                node = nodes[_i];
                total += attrOf(node);
            }
            return total;
        };
        avg = function (nodes, attrOf) {
            return sum(nodes, attrOf) / nodes.length;
        };
        _headers = [
            [
                '&nbsp;',
                true
            ],
            [
                'Name',
                true
            ],
            [
                'Ping',
                true
            ],
            [
                'Cores',
                true
            ],
            [
                'Load',
                true
            ],
            [
                'Data (Used/Total)',
                true
            ],
            [
                'Data (% Cached)',
                true
            ],
            [
                'GC (Free / Total / Max)',
                true
            ],
            [
                'Disk (Free / Max)',
                true
            ],
            [
                'Disk (% Free)',
                true
            ],
            [
                'PID',
                false
            ],
            [
                'Keys',
                false
            ],
            [
                'TCP',
                false
            ],
            [
                'FD',
                false
            ],
            [
                'RPCs',
                false
            ],
            [
                'Threads',
                false
            ],
            [
                'Tasks',
                false
            ]
        ];
        createNodeRow = function (node) {
            return [
                node.healthy,
                node.ip_port,
                moment(new Date(node.last_ping)).fromNow(),
                node.num_cpus,
                format3f(node.sys_load),
                '' + prettyPrintBytes(node.mem_value_size) + ' / ' + prettyPrintBytes(node.total_value_size),
                '' + Math.floor(node.mem_value_size * 100 / node.total_value_size) + '%',
                '' + prettyPrintBytes(node.free_mem) + ' / ' + prettyPrintBytes(node.tot_mem) + ' / ' + prettyPrintBytes(node.max_mem),
                '' + prettyPrintBytes(node.free_disk) + ' / ' + prettyPrintBytes(node.max_disk),
                '' + Math.floor(node.free_disk * 100 / node.max_disk) + '%',
                node.pid,
                node.num_keys,
                node.tcps_active,
                node.open_fds,
                node.rpcs_active,
                formatThreads(node.fjthrds),
                formatThreads(node.fjqueue)
            ];
        };
        createTotalRow = function (cloud) {
            var nodes;
            nodes = cloud.nodes;
            return [
                cloud.cloud_healthy,
                'TOTAL',
                '-',
                sum(nodes, function (node) {
                    return node.num_cpus;
                }),
                format3f(sum(nodes, function (node) {
                    return node.sys_load;
                })),
                '' + prettyPrintBytes(sum(nodes, function (node) {
                    return node.mem_value_size;
                })) + ' / ' + prettyPrintBytes(sum(nodes, function (node) {
                    return node.total_value_size;
                })),
                '' + Math.floor(avg(nodes, function (node) {
                    return node.mem_value_size * 100 / node.total_value_size;
                })) + '%',
                '' + prettyPrintBytes(sum(nodes, function (node) {
                    return node.free_mem;
                })) + ' / ' + prettyPrintBytes(sum(nodes, function (node) {
                    return node.tot_mem;
                })) + ' / ' + prettyPrintBytes(sum(nodes, function (node) {
                    return node.max_mem;
                })),
                '' + prettyPrintBytes(sum(nodes, function (node) {
                    return node.free_disk;
                })) + ' / ' + prettyPrintBytes(sum(nodes, function (node) {
                    return node.max_disk;
                })),
                '' + Math.floor(avg(nodes, function (node) {
                    return node.free_disk * 100 / node.max_disk;
                })) + '%',
                '-',
                sum(nodes, function (node) {
                    return node.num_keys;
                }),
                sum(nodes, function (node) {
                    return node.tcps_active;
                }),
                sum(nodes, function (node) {
                    return node.open_fds;
                }),
                sum(nodes, function (node) {
                    return node.rpcs_active;
                }),
                '-',
                '-'
            ];
        };
        createGrid = function (cloud, isExpanded) {
            var caption, cell, danger, grid, i, nodeRows, row, showAlways, success, table, tbody, td, tds, th, thead, ths, tr, trs, _ref;
            _ref = Flow.HTML.template('.grid', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'i.fa.fa-check-circle.text-success', 'i.fa.fa-exclamation-circle.text-danger'), grid = _ref[0], table = _ref[1], thead = _ref[2], tbody = _ref[3], tr = _ref[4], th = _ref[5], td = _ref[6], success = _ref[7], danger = _ref[8];
            nodeRows = lodash.map(cloud.nodes, createNodeRow);
            nodeRows.push(createTotalRow(cloud));
            ths = function () {
                var _i, _len, _ref1, _results;
                _results = [];
                for (_i = 0, _len = _headers.length; _i < _len; _i++) {
                    _ref1 = _headers[_i], caption = _ref1[0], showAlways = _ref1[1];
                    if (showAlways || isExpanded) {
                        _results.push(th(caption));
                    }
                }
                return _results;
            }();
            trs = function () {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = nodeRows.length; _i < _len; _i++) {
                    row = nodeRows[_i];
                    tds = function () {
                        var _j, _len1, _results1;
                        _results1 = [];
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
            return Flow.HTML.render('div', grid([table([
                    thead(tr(ths)),
                    tbody(trs)
                ])]));
        };
        updateCloud = function (cloud, isExpanded) {
            _name(cloud.cloud_name);
            _version(cloud.version);
            _hasConsensus(cloud.consensus);
            _uptime(formatMilliseconds(cloud.cloud_uptime_millis));
            _nodeCounts('' + (cloud.cloud_size - cloud.bad_nodes) + ' / ' + cloud.cloud_size);
            _isLocked(cloud.locked);
            _isHealthy(cloud.cloud_healthy);
            return _nodes(createGrid(cloud, isExpanded));
        };
        toggleRefresh = function () {
            return _isLive(!_isLive());
        };
        refresh = function () {
            _isBusy(true);
            return _.requestCloud(function (error, cloud) {
                _isBusy(false);
                if (error) {
                    _exception(Flow.Failure(_, new Flow.Error('Error fetching cloud status', error)));
                    return _isLive(false);
                } else {
                    updateCloud(_cloud = cloud, _isExpanded());
                    if (_isLive()) {
                        return lodash.delay(refresh, 2000);
                    }
                }
            });
        };
        Flow.Dataflow.act(_isLive, function (isLive) {
            if (isLive) {
                return refresh();
            }
        });
        toggleExpansion = function () {
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
    };
}.call(this));
(function () {
    H2O.ColumnSummaryOutput = function (_, _go, frameKey, frame, columnName) {
        var column, inspect, renderPlot, table, _characteristicsPlot, _distributionPlot, _domainPlot, _summaryPlot;
        column = lodash.head(frame.columns);
        console.debug(frame);
        _characteristicsPlot = Flow.Dataflow.signal(null);
        _summaryPlot = Flow.Dataflow.signal(null);
        _distributionPlot = Flow.Dataflow.signal(null);
        _domainPlot = Flow.Dataflow.signal(null);
        renderPlot = function (target, render) {
            return render(function (error, vis) {
                if (error) {
                    return console.debug(error);
                } else {
                    return target(vis.element);
                }
            });
        };
        if (table = _.inspect('characteristics', frame)) {
            renderPlot(_characteristicsPlot, _.plot(function (g) {
                return g(g.rect(g.position(g.stack(g.avg('percent'), 0), 'All'), g.fillColor('characteristic')), g.groupBy(g.factor(g.value('All')), 'characteristic'), g.from(table));
            }));
        }
        if (table = _.inspect('distribution', frame)) {
            renderPlot(_distributionPlot, _.plot(function (g) {
                return g(g.rect(g.position('interval', 'count'), g.width(g.value(1))), g.from(table));
            }));
        }
        if (table = _.inspect('summary', frame)) {
            renderPlot(_summaryPlot, _.plot(function (g) {
                return g(g.schema(g.position('min', 'q1', 'q2', 'q3', 'max', 'column')), g.from(table));
            }));
        }
        if (table = _.inspect('domain', frame)) {
            renderPlot(_domainPlot, _.plot(function (g) {
                return g(g.rect(g.position('count', 'label')), g.from(table));
            }));
        }
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName));
        };
        lodash.defer(_go);
        return {
            label: column.label,
            characteristicsPlot: _characteristicsPlot,
            summaryPlot: _summaryPlot,
            distributionPlot: _distributionPlot,
            domainPlot: _domainPlot,
            inspect: inspect,
            template: 'flow-column-summary-output'
        };
    };
}.call(this));
(function () {
    H2O.CreateFrameInput = function (_, _go) {
        var createFrame, _binaryFraction, _categoricalFraction, _columns, _factors, _hasResponse, _integerFraction, _integerRange, _key, _missingFraction, _randomize, _realRange, _responseFactors, _rows, _seed, _value;
        _key = Flow.Dataflow.signal('');
        _rows = Flow.Dataflow.signal(10000);
        _columns = Flow.Dataflow.signal(100);
        _seed = Flow.Dataflow.signal(7595850248774472000);
        _randomize = Flow.Dataflow.signal(true);
        _value = Flow.Dataflow.signal(0);
        _realRange = Flow.Dataflow.signal(100);
        _categoricalFraction = Flow.Dataflow.signal(0.1);
        _factors = Flow.Dataflow.signal(5);
        _integerFraction = Flow.Dataflow.signal(0.5);
        _binaryFraction = Flow.Dataflow.signal(0.1);
        _integerRange = Flow.Dataflow.signal(1);
        _missingFraction = Flow.Dataflow.signal(0.01);
        _responseFactors = Flow.Dataflow.signal(2);
        _hasResponse = Flow.Dataflow.signal(false);
        createFrame = function () {
            var opts;
            opts = {
                dest: _key(),
                rows: _rows(),
                cols: _columns(),
                seed: _seed(),
                randomize: _randomize(),
                value: _value(),
                real_range: _realRange(),
                categorical_fraction: _categoricalFraction(),
                factors: _factors(),
                integer_fraction: _integerFraction(),
                binary_fraction: _binaryFraction(),
                integer_range: _integerRange(),
                missing_fraction: _missingFraction(),
                response_factors: _responseFactors(),
                has_response: _hasResponse()
            };
            return _.insertAndExecuteCell('cs', 'createFrame ' + Flow.Prelude.stringify(opts));
        };
        lodash.defer(_go);
        return {
            key: _key,
            rows: _rows,
            columns: _columns,
            seed: _seed,
            randomize: _randomize,
            value: _value,
            realRange: _realRange,
            categoricalFraction: _categoricalFraction,
            factors: _factors,
            integerFraction: _integerFraction,
            binaryFraction: _binaryFraction,
            integerRange: _integerRange,
            missingFraction: _missingFraction,
            responseFactors: _responseFactors,
            hasResponse: _hasResponse,
            createFrame: createFrame,
            template: 'flow-create-frame-input'
        };
    };
}.call(this));
(function () {
    H2O.DeleteObjectsOutput = function (_, _go, _keys) {
        lodash.defer(_go);
        return {
            hasKeys: _keys.length > 0,
            keys: _keys,
            template: 'flow-delete-objects-output'
        };
    };
}.call(this));
(function () {
    Flow.FileOpenDialog = function (_, _go) {
        var accept, checkIfNameIsInUse, decline, uploadFile, _canAccept, _file, _form, _overwrite;
        _overwrite = Flow.Dataflow.signal(false);
        _form = Flow.Dataflow.signal(null);
        _file = Flow.Dataflow.signal(null);
        _canAccept = Flow.Dataflow.lift(_file, function (file) {
            if (file != null ? file.name : void 0) {
                return H2O.Util.validateFileExtension(file.name, '.flow');
            } else {
                return false;
            }
        });
        checkIfNameIsInUse = function (name, go) {
            return _.requestObject('notebook', name, function (error) {
                return go(error ? false : true);
            });
        };
        uploadFile = function (basename) {
            return _.requestUploadObject('notebook', basename, new FormData(_form()), function (error, filename) {
                return _go({
                    error: error,
                    filename: filename
                });
            });
        };
        accept = function () {
            var basename, file;
            if (file = _file()) {
                basename = H2O.Util.getFileBaseName(file.name, '.flow');
                if (_overwrite()) {
                    return uploadFile(basename);
                } else {
                    return checkIfNameIsInUse(basename, function (isNameInUse) {
                        if (isNameInUse) {
                            return _overwrite(true);
                        } else {
                            return uploadFile(basename);
                        }
                    });
                }
            }
        };
        decline = function () {
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
    };
}.call(this));
(function () {
    Flow.FileUploadDialog = function (_, _go) {
        var accept, decline, uploadFile, _file, _form;
        _form = Flow.Dataflow.signal(null);
        _file = Flow.Dataflow.signal(null);
        uploadFile = function (key) {
            return _.requestUploadFile(key, new FormData(_form()), function (error, result) {
                return _go({
                    error: error,
                    result: result
                });
            });
        };
        accept = function () {
            var file;
            if (file = _file()) {
                return uploadFile(file.name);
            }
        };
        decline = function () {
            return _go(null);
        };
        return {
            form: _form,
            file: _file,
            accept: accept,
            decline: decline,
            template: 'file-upload-dialog'
        };
    };
}.call(this));
(function () {
    H2O.FrameOutput = function (_, _go, _frame) {
        var createGrid, createModel, deleteFrame, download, inspect, inspectData, predict, _grid;
        createGrid = function (data) {
            var action, el, grid, i, table, tbody, td, tdr, tds, th, thead, thr, ths, tr, trs, value, vector, vectorIndex, _ref;
            _ref = Flow.HTML.template('.grid', 'table', 'thead', 'tbody', 'tr', 'th', 'th.rt', 'td', 'td.rt', 'a data-action=\'summary\' data-index=\'$1\' class=\'action\' href=\'#\''), grid = _ref[0], table = _ref[1], thead = _ref[2], tbody = _ref[3], tr = _ref[4], th = _ref[5], thr = _ref[6], td = _ref[7], tdr = _ref[8], action = _ref[9];
            ths = function () {
                var _i, _len, _ref1, _results;
                _ref1 = data.vectors;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                    vector = _ref1[_i];
                    switch (vector.type) {
                    case Flow.TNumber:
                        _results.push(thr(lodash.escape(vector.label)));
                        break;
                    default:
                        _results.push(th(lodash.escape(vector.label)));
                    }
                }
                return _results;
            }();
            ths.push(th('Actions'));
            trs = function () {
                var _i, _len, _ref1, _results;
                _ref1 = data.indices;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                    i = _ref1[_i];
                    tds = function () {
                        var _j, _len1, _ref2, _results1;
                        _ref2 = data.vectors;
                        _results1 = [];
                        for (vectorIndex = _j = 0, _len1 = _ref2.length; _j < _len1; vectorIndex = ++_j) {
                            vector = _ref2[vectorIndex];
                            value = vector.format(i);
                            switch (vector.type) {
                            case Flow.TString:
                                _results1.push(td(value !== void 0 ? lodash.escape(value) : '-'));
                                break;
                            case Flow.TNumber:
                                _results1.push(tdr(value !== void 0 ? value : '-'));
                                break;
                            default:
                                _results1.push(td('?'));
                            }
                        }
                        return _results1;
                    }();
                    tds.push(td(action('Summary...', i)));
                    _results.push(tr(tds));
                }
                return _results;
            }();
            el = Flow.HTML.render('div', grid([table([
                    thead(tr(ths)),
                    tbody(trs)
                ])]));
            $('a.action', el).click(function (e) {
                var $link, index;
                e.preventDefault();
                $link = $(this);
                action = $link.attr('data-action');
                index = parseInt($link.attr('data-index'), 10);
                if (index >= 0) {
                    switch (action) {
                    case 'summary':
                        return _.insertAndExecuteCell('cs', 'getColumnSummary ' + Flow.Prelude.stringify(_frame.key.name) + ', ' + Flow.Prelude.stringify(data.schema.label.valueAt(index)));
                    }
                }
            });
            return el;
        };
        createModel = function () {
            return _.insertAndExecuteCell('cs', 'assist buildModel, null, training_frame: ' + Flow.Prelude.stringify(_frame.key.name));
        };
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getFrameSummary ' + Flow.Prelude.stringify(_frame.key.name));
        };
        inspectData = function () {
            return _.insertAndExecuteCell('cs', 'grid inspect \'data\', getFrame ' + Flow.Prelude.stringify(_frame.key.name));
        };
        predict = function () {
            return _.insertAndExecuteCell('cs', 'predict frame: ' + Flow.Prelude.stringify(_frame.key.name));
        };
        download = function () {
            return window.open('/3/DownloadDataset?key=' + encodeURIComponent(_frame.key.name), '_blank');
        };
        deleteFrame = function () {
            return _.confirm('Are you sure you want to delete this frame?', {
                acceptCaption: 'Delete Frame',
                declineCaption: 'Cancel'
            }, function (accept) {
                if (accept) {
                    return _.insertAndExecuteCell('cs', 'deleteFrame ' + Flow.Prelude.stringify(_frame.key.name));
                }
            });
        };
        _grid = createGrid(_.inspect('columns', _frame));
        lodash.defer(_go);
        return {
            key: _frame.key.name,
            rowCount: _frame.rows,
            columnCount: _frame.columns.length,
            size: Flow.Util.formatBytes(_frame.byte_size),
            grid: _grid,
            inspect: inspect,
            createModel: createModel,
            inspectData: inspectData,
            predict: predict,
            download: download,
            deleteFrame: deleteFrame,
            template: 'flow-frame-output'
        };
    };
}.call(this));
(function () {
    H2O.FramesOutput = function (_, _go, _frames) {
        var collectSelectedKeys, createFrameView, deleteFrames, importFiles, predictOnFrames, _checkAllFrames, _frameViews, _hasSelectedFrames, _isCheckingAll;
        _frameViews = Flow.Dataflow.signal([]);
        _checkAllFrames = Flow.Dataflow.signal(false);
        _hasSelectedFrames = Flow.Dataflow.signal(false);
        _isCheckingAll = false;
        Flow.Dataflow.react(_checkAllFrames, function (checkAll) {
            var view, _i, _len, _ref;
            _isCheckingAll = true;
            _ref = _frameViews();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                view = _ref[_i];
                view.isChecked(checkAll);
            }
            _hasSelectedFrames(checkAll);
            _isCheckingAll = false;
        });
        createFrameView = function (frame) {
            var columnLabels, createModel, description, inspect, predict, view, _isChecked;
            _isChecked = Flow.Dataflow.signal(false);
            Flow.Dataflow.react(_isChecked, function () {
                var checkedViews, view;
                if (_isCheckingAll) {
                    return;
                }
                checkedViews = function () {
                    var _i, _len, _ref, _results;
                    _ref = _frameViews();
                    _results = [];
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
            columnLabels = lodash.head(lodash.map(frame.columns, function (column) {
                return column.label;
            }), 15);
            description = 'Columns: ' + columnLabels.join(', ') + (frame.columns.length > columnLabels.length ? '... (' + (frame.columns.length - columnLabels.length) + ' more columns)' : '');
            view = function () {
                if (frame.is_text) {
                    return _.insertAndExecuteCell('cs', 'setupParse source_keys: [ ' + Flow.Prelude.stringify(frame.key.name) + ' ]');
                } else {
                    return _.insertAndExecuteCell('cs', 'getFrameSummary ' + Flow.Prelude.stringify(frame.key.name));
                }
            };
            predict = function () {
                return _.insertAndExecuteCell('cs', 'predict frame: ' + Flow.Prelude.stringify(frame.key.name));
            };
            inspect = function () {
                return _.insertAndExecuteCell('cs', 'inspect getFrameSummary ' + Flow.Prelude.stringify(frame.key.name));
            };
            createModel = function () {
                return _.insertAndExecuteCell('cs', 'assist buildModel, null, training_frame: ' + Flow.Prelude.stringify(frame.key.name));
            };
            return {
                key: frame.key.name,
                isChecked: _isChecked,
                description: description,
                size: Flow.Util.formatBytes(frame.byte_size),
                rowCount: frame.rows,
                columnCount: frame.columns.length,
                isText: frame.is_text,
                view: view,
                predict: predict,
                inspect: inspect,
                createModel: createModel
            };
        };
        importFiles = function () {
            return _.insertAndExecuteCell('cs', 'importFiles');
        };
        collectSelectedKeys = function () {
            var view, _i, _len, _ref, _results;
            _ref = _frameViews();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                view = _ref[_i];
                if (view.isChecked()) {
                    _results.push(view.key);
                }
            }
            return _results;
        };
        predictOnFrames = function () {
            return _.insertAndExecuteCell('cs', 'predict frames: ' + Flow.Prelude.stringify(collectSelectedKeys()));
        };
        deleteFrames = function () {
            return _.confirm('Are you sure you want to delete these frames?', {
                acceptCaption: 'Delete Frames',
                declineCaption: 'Cancel'
            }, function (accept) {
                if (accept) {
                    return _.insertAndExecuteCell('cs', 'deleteFrames ' + Flow.Prelude.stringify(collectSelectedKeys()));
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
    };
}.call(this));
(function () {
    H2O.ImportFilesInput = function (_, _go) {
        var createFileItem, createFileItems, createSelectedFileItem, deselectAllFiles, importFiles, importSelectedFiles, listPathHints, processImportResult, selectAllFiles, tryImportFiles, _exception, _hasErrorMessage, _hasImportedFiles, _hasSelectedFiles, _hasUnselectedFiles, _importedFileCount, _importedFiles, _selectedFileCount, _selectedFiles, _selectedFilesDictionary, _specifiedPath;
        _specifiedPath = Flow.Dataflow.signal('');
        _exception = Flow.Dataflow.signal('');
        _hasErrorMessage = Flow.Dataflow.lift(_exception, function (exception) {
            if (exception) {
                return true;
            } else {
                return false;
            }
        });
        tryImportFiles = function () {
            var specifiedPath;
            specifiedPath = _specifiedPath();
            return _.requestFileGlob(specifiedPath, -1, function (error, result) {
                if (error) {
                    return _exception(error.data.errmsg);
                } else {
                    _exception('');
                    return processImportResult(result);
                }
            });
        };
        _importedFiles = Flow.Dataflow.signals([]);
        _importedFileCount = Flow.Dataflow.lift(_importedFiles, function (files) {
            if (files.length) {
                return 'Found ' + Flow.Util.describeCount(files.length, 'file') + ':';
            } else {
                return '';
            }
        });
        _hasImportedFiles = Flow.Dataflow.lift(_importedFiles, function (files) {
            return files.length > 0;
        });
        _hasUnselectedFiles = Flow.Dataflow.lift(_importedFiles, function (files) {
            return lodash.some(files, function (file) {
                return !file.isSelected();
            });
        });
        _selectedFiles = Flow.Dataflow.signals([]);
        _selectedFilesDictionary = Flow.Dataflow.lift(_selectedFiles, function (files) {
            var dictionary, file, _i, _len;
            dictionary = {};
            for (_i = 0, _len = files.length; _i < _len; _i++) {
                file = files[_i];
                dictionary[file.path] = true;
            }
            return dictionary;
        });
        _selectedFileCount = Flow.Dataflow.lift(_selectedFiles, function (files) {
            return '' + Flow.Util.describeCount(files.length, 'file') + ' selected:';
        });
        _hasSelectedFiles = Flow.Dataflow.lift(_selectedFiles, function (files) {
            return files.length > 0;
        });
        importFiles = function (files) {
            var paths;
            paths = lodash.map(files, function (file) {
                return Flow.Prelude.stringify(file.path);
            });
            return _.insertAndExecuteCell('cs', 'importFiles [ ' + paths.join(',') + ' ]');
        };
        importSelectedFiles = function () {
            return importFiles(_selectedFiles());
        };
        createSelectedFileItem = function (path) {
            var self;
            return self = {
                path: path,
                deselect: function () {
                    var file, _i, _len, _ref;
                    _selectedFiles.remove(self);
                    _ref = _importedFiles();
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        file = _ref[_i];
                        if (file.path === path) {
                            file.isSelected(false);
                        }
                    }
                }
            };
        };
        createFileItem = function (path, isSelected) {
            var self;
            self = {
                path: path,
                isSelected: Flow.Dataflow.signal(isSelected),
                select: function () {
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
        createFileItems = function (result) {
            return lodash.map(result.matches, function (path) {
                return createFileItem(path, _selectedFilesDictionary()[path]);
            });
        };
        listPathHints = function (query, process) {
            return _.requestFileGlob(query, 10, function (error, result) {
                if (!error) {
                    return process(lodash.map(result.matches, function (value) {
                        return { value: value };
                    }));
                }
            });
        };
        selectAllFiles = function () {
            var file, _i, _len, _ref;
            _selectedFiles(lodash.map(_importedFiles(), function (file) {
                return createSelectedFileItem(file.path);
            }));
            _ref = _importedFiles();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                file = _ref[_i];
                file.isSelected(true);
            }
        };
        deselectAllFiles = function () {
            var file, _i, _len, _ref;
            _selectedFiles([]);
            _ref = _importedFiles();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                file = _ref[_i];
                file.isSelected(false);
            }
        };
        processImportResult = function (result) {
            var files;
            files = createFileItems(result);
            return _importedFiles(files);
        };
        lodash.defer(_go);
        return {
            specifiedPath: _specifiedPath,
            hasErrorMessage: _hasErrorMessage,
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
    };
}.call(this));
(function () {
    H2O.ImportFilesOutput = function (_, _go, _importResults) {
        var createImportView, parse, _allPaths, _canParse, _importViews, _title;
        _allPaths = lodash.flatten(lodash.compact(lodash.map(_importResults, function (result) {
            return result.files;
        })));
        _canParse = _allPaths.length > 0;
        _title = '' + _allPaths.length + ' / ' + _importResults.length + ' files imported.';
        createImportView = function (result) {
            return {
                files: result.files,
                template: 'flow-import-file-output'
            };
        };
        _importViews = lodash.map(_importResults, createImportView);
        parse = function () {
            var paths;
            paths = lodash.map(_allPaths, Flow.Prelude.stringify);
            return _.insertAndExecuteCell('cs', 'setupParse paths: [ ' + paths.join(',') + ' ]');
        };
        lodash.defer(_go);
        return {
            title: _title,
            importViews: _importViews,
            canParse: _canParse,
            parse: parse,
            template: 'flow-import-files-output',
            templateOf: function (view) {
                return view.template;
            }
        };
    };
}.call(this));
(function () {
    H2O.InspectOutput = function (_, _go, _frame) {
        var plot, view;
        view = function () {
            return _.insertAndExecuteCell('cs', 'grid inspect ' + Flow.Prelude.stringify(_frame.label) + ', ' + _frame.metadata.origin);
        };
        plot = function () {
            return _.insertAndExecuteCell('cs', _frame.metadata.plot);
        };
        lodash.defer(_go);
        return {
            label: _frame.label,
            vectors: _frame.vectors,
            view: view,
            canPlot: _frame.metadata.plot ? true : false,
            plot: plot,
            template: 'flow-inspect-output'
        };
    };
}.call(this));
(function () {
    H2O.InspectsOutput = function (_, _go, _tables) {
        var createTableView;
        createTableView = function (table) {
            var grid, inspect, plot;
            inspect = function () {
                return _.insertAndExecuteCell('cs', 'inspect ' + Flow.Prelude.stringify(table.label) + ', ' + table.metadata.origin);
            };
            grid = function () {
                return _.insertAndExecuteCell('cs', 'grid inspect ' + Flow.Prelude.stringify(table.label) + ', ' + table.metadata.origin);
            };
            plot = function () {
                return _.insertAndExecuteCell('cs', table.metadata.plot);
            };
            return {
                label: table.label,
                description: table.metadata.description,
                inspect: inspect,
                grid: grid,
                canPlot: table.metadata.plot ? true : false,
                plot: plot
            };
        };
        lodash.defer(_go);
        return {
            hasTables: _tables.length > 0,
            tables: lodash.map(_tables, createTableView),
            template: 'flow-inspects-output'
        };
    };
}.call(this));
(function () {
    var getJobOutputStatusColor, getJobProgressPercent, jobOutputStatusColors;
    jobOutputStatusColors = {
        failed: '#d9534f',
        done: '#ccc',
        running: '#f0ad4e'
    };
    getJobOutputStatusColor = function (status) {
        switch (status) {
        case 'DONE':
            return jobOutputStatusColors.done;
        case 'CREATED':
        case 'RUNNING':
            return jobOutputStatusColors.running;
        default:
            return jobOutputStatusColors.failed;
        }
    };
    getJobProgressPercent = function (progress) {
        return '' + Math.ceil(100 * progress) + '%';
    };
    H2O.JobOutput = function (_, _go, _job) {
        var cancel, initialize, isJobRunning, refresh, updateJob, view, _canCancel, _canView, _description, _destinationKey, _destinationType, _exception, _isBusy, _isLive, _key, _progress, _progressMessage, _runTime, _status, _statusColor;
        _isBusy = Flow.Dataflow.signal(false);
        _isLive = Flow.Dataflow.signal(false);
        _key = _job.key.name;
        _description = _job.description;
        _destinationKey = _job.dest.name;
        _destinationType = function () {
            switch (_job.dest.type) {
            case 'Key<Frame>':
                return 'Frame';
            case 'Key<Model>':
                return 'Model';
            default:
                return 'Unknown';
            }
        }();
        _runTime = Flow.Dataflow.signal(null);
        _progress = Flow.Dataflow.signal(null);
        _progressMessage = Flow.Dataflow.signal(null);
        _status = Flow.Dataflow.signal(null);
        _statusColor = Flow.Dataflow.signal(null);
        _exception = Flow.Dataflow.signal(null);
        _canView = Flow.Dataflow.signal(false);
        _canCancel = Flow.Dataflow.signal(false);
        isJobRunning = function (job) {
            return job.status === 'CREATED' || job.status === 'RUNNING';
        };
        updateJob = function (job) {
            _runTime(Flow.Util.formatMilliseconds(job.msec));
            _progress(getJobProgressPercent(job.progress));
            _progressMessage(job.progress_msg);
            _status(job.status);
            _statusColor(getJobOutputStatusColor(job.status));
            _exception(job.exception ? Flow.Failure(_, new Flow.Error('Job failure.', new Error(job.exception))) : null);
            _canView(!isJobRunning(job));
            return _canCancel(isJobRunning(job));
        };
        refresh = function () {
            _isBusy(true);
            return _.requestJob(_key, function (error, job) {
                _isBusy(false);
                if (error) {
                    _exception(Flow.Failure(_, new Flow.Error('Error fetching jobs', error)));
                    return _isLive(false);
                } else {
                    updateJob(job);
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
                }
            });
        };
        Flow.Dataflow.act(_isLive, function (isLive) {
            if (isLive) {
                return refresh();
            }
        });
        view = function () {
            if (!_canView()) {
                return;
            }
            switch (_destinationType) {
            case 'Frame':
                return _.insertAndExecuteCell('cs', 'getFrameSummary ' + Flow.Prelude.stringify(_destinationKey));
            case 'Model':
                return _.insertAndExecuteCell('cs', 'getModel ' + Flow.Prelude.stringify(_destinationKey));
            }
        };
        cancel = function () {
            return _.requestCancelJob(_key, function (error, result) {
                if (error) {
                    return console.debug(error);
                } else {
                    return updateJob(_job);
                }
            });
        };
        initialize = function (job) {
            updateJob(job);
            if (isJobRunning(job)) {
                return _isLive(true);
            } else {
                if (_go) {
                    return lodash.defer(_go);
                }
            }
        };
        initialize(_job);
        return {
            key: _key,
            description: _description,
            destinationKey: _destinationKey,
            destinationType: _destinationType,
            runTime: _runTime,
            progress: _progress,
            progressMessage: _progressMessage,
            status: _status,
            statusColor: _statusColor,
            exception: _exception,
            isLive: _isLive,
            canView: _canView,
            canCancel: _canCancel,
            cancel: cancel,
            view: view,
            template: 'flow-job-output'
        };
    };
}.call(this));
(function () {
    H2O.JobsOutput = function (_, _go, jobs) {
        var createJobView, initialize, refresh, toggleRefresh, _exception, _hasJobViews, _isBusy, _isLive, _jobViews;
        _jobViews = Flow.Dataflow.signals([]);
        _hasJobViews = Flow.Dataflow.lift(_jobViews, function (jobViews) {
            return jobViews.length > 0;
        });
        _isLive = Flow.Dataflow.signal(false);
        _isBusy = Flow.Dataflow.signal(false);
        _exception = Flow.Dataflow.signal(null);
        createJobView = function (job) {
            var type, view;
            view = function () {
                return _.insertAndExecuteCell('cs', 'getJob ' + Flow.Prelude.stringify(job.key.name));
            };
            type = function () {
                switch (job.dest.type) {
                case 'Key<Frame>':
                    return 'Frame';
                case 'Key<Model>':
                    return 'Model';
                default:
                    return 'Unknown';
                }
            }();
            return {
                destination: job.dest.name,
                type: type,
                description: job.description,
                startTime: Flow.Format.Time(new Date(job.start_time)),
                endTime: Flow.Format.Time(new Date(job.start_time + job.msec)),
                elapsedTime: Flow.Util.formatMilliseconds(job.msec),
                status: job.status,
                view: view
            };
        };
        toggleRefresh = function () {
            return _isLive(!_isLive());
        };
        refresh = function () {
            _isBusy(true);
            return _.requestJobs(function (error, jobs) {
                _isBusy(false);
                if (error) {
                    _exception(Flow.Failure(_, new Flow.Error('Error fetching jobs', error)));
                    return _isLive(false);
                } else {
                    _jobViews(lodash.map(jobs, createJobView));
                    if (_isLive()) {
                        return lodash.delay(refresh, 2000);
                    }
                }
            });
        };
        Flow.Dataflow.act(_isLive, function (isLive) {
            if (isLive) {
                return refresh();
            }
        });
        initialize = function () {
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
    };
}.call(this));
(function () {
    H2O.LogFileOutput = function (_, _go, _cloud, _nodeIndex, _fileType, _logFile) {
        var createNode, initialize, refresh, refreshActiveView, _activeFileType, _activeNode, _contents, _exception, _fileTypes, _nodes;
        _exception = Flow.Dataflow.signal(null);
        _contents = Flow.Dataflow.signal('');
        _nodes = Flow.Dataflow.signal([]);
        _activeNode = Flow.Dataflow.signal(null);
        _fileTypes = Flow.Dataflow.signal([
            'trace',
            'debug',
            'info',
            'warn',
            'error',
            'fatal',
            'httpd',
            'stdout',
            'stderr'
        ]);
        _activeFileType = Flow.Dataflow.signal(null);
        createNode = function (node, index) {
            return {
                name: node.ip_port,
                index: index
            };
        };
        refreshActiveView = function (node, fileType) {
            if (node) {
                return _.requestLogFile(node.index, fileType, function (error, logFile) {
                    if (error) {
                        return _contents('Error fetching log file: ' + error.message);
                    } else {
                        return _contents(logFile.log);
                    }
                });
            } else {
                return _contents('');
            }
        };
        refresh = function () {
            return refreshActiveView(_activeNode(), _activeFileType());
        };
        initialize = function (cloud, nodeIndex, fileType, logFile) {
            var i, node, nodes;
            _activeFileType(fileType);
            _contents(logFile.log);
            _nodes(nodes = function () {
                var _i, _len, _ref, _results;
                _ref = cloud.nodes;
                _results = [];
                for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                    node = _ref[i];
                    _results.push(createNode(node, i));
                }
                return _results;
            }());
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
    };
}.call(this));
(function () {
    var createCheckboxControl, createControl, createControlFromParameter, createDropdownControl, createListControl, createTextboxControl;
    createControl = function (kind, parameter) {
        var _hasError, _hasInfo, _hasMessage, _hasWarning, _isVisible, _message;
        _hasError = Flow.Dataflow.signal(false);
        _hasWarning = Flow.Dataflow.signal(false);
        _hasInfo = Flow.Dataflow.signal(false);
        _message = Flow.Dataflow.signal('');
        _hasMessage = Flow.Dataflow.lift(_message, function (message) {
            if (message) {
                return true;
            } else {
                return false;
            }
        });
        _isVisible = Flow.Dataflow.signal(true);
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
            isVisible: _isVisible
        };
    };
    createTextboxControl = function (parameter, type) {
        var control, isArrayValued, isInt, isReal, _ref, _ref1, _text, _value;
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
        }
        _text = Flow.Dataflow.signal(isArrayValued ? ((_ref = parameter.actual_value) != null ? _ref : []).join(', ') : (_ref1 = parameter.actual_value) != null ? _ref1 : '');
        _value = Flow.Dataflow.lift(_text, function (text) {
            var parsed, vals, value, _i, _len, _ref2;
            if (isArrayValued) {
                vals = [];
                _ref2 = text.split(/\s*,\s*/g);
                for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                    value = _ref2[_i];
                    if (isInt) {
                        if (!lodash.isNaN(parsed = parseInt(value, 10))) {
                            vals.push(parsed);
                        }
                    } else if (isReal) {
                        if (!lodash.isNaN(parsed = parseFloat(value))) {
                            vals.push(parsed);
                        }
                    } else {
                        vals.push(value);
                    }
                }
                return vals;
            } else {
                return text;
            }
        });
        control = createControl('textbox', parameter);
        control.text = _text;
        control.value = _value;
        control.isArrayValued = isArrayValued;
        return control;
    };
    createDropdownControl = function (parameter) {
        var control, _value;
        _value = Flow.Dataflow.signal(parameter.actual_value);
        control = createControl('dropdown', parameter);
        control.values = Flow.Dataflow.signals(parameter.values);
        control.value = _value;
        return control;
    };
    createListControl = function (parameter) {
        var control, createValueView, excludeAll, includeAll, view, _availableSearchTerm, _availableValues, _availableValuesCaption, _i, _len, _ref, _searchAvailable, _searchSelected, _selectedSearchTerm, _selectedValues, _selectedValuesCaption, _value, _values, _views;
        _availableSearchTerm = Flow.Dataflow.signal('');
        _selectedSearchTerm = Flow.Dataflow.signal('');
        createValueView = function (_arg) {
            var exclude, include, label, self, value, _canExclude, _canInclude, _isAvailable;
            label = _arg.label, value = _arg.value;
            _isAvailable = Flow.Dataflow.signal(true);
            _canInclude = Flow.Dataflow.signal(true);
            _canExclude = Flow.Dataflow.signal(true);
            include = function () {
                self.isAvailable(false);
                return _selectedValues.push(self);
            };
            exclude = function () {
                self.isAvailable(true);
                return _selectedValues.remove(self);
            };
            return self = {
                label: label,
                value: value,
                include: include,
                exclude: exclude,
                canInclude: _canInclude,
                canExclude: _canExclude,
                isAvailable: _isAvailable
            };
        };
        _values = Flow.Dataflow.signals(lodash.map(parameter.values, function (value) {
            return {
                label: value,
                value: value
            };
        }));
        _availableValues = Flow.Dataflow.lift(_values, function (vals) {
            return lodash.map(vals, createValueView);
        });
        _views = {};
        _ref = _availableValues();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            view = _ref[_i];
            _views[view.value] = view;
        }
        _selectedValues = Flow.Dataflow.signals(lodash.map(parameter.actual_value, function (selectedValue) {
            view = _views[selectedValue];
            view.isAvailable(false);
            return view;
        }));
        _value = Flow.Dataflow.lift(_selectedValues, function (views) {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = views.length; _j < _len1; _j++) {
                view = views[_j];
                _results.push(view.value);
            }
            return _results;
        });
        _availableValuesCaption = Flow.Dataflow.signal('0 items hidden');
        _selectedValuesCaption = Flow.Dataflow.signal('0 items hidden');
        includeAll = function () {
            var _j, _len1, _ref1;
            _ref1 = _availableValues();
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                view = _ref1[_j];
                if (view.canInclude() && view.isAvailable()) {
                    view.include();
                }
            }
        };
        excludeAll = function () {
            var selectedValues, _j, _len1;
            selectedValues = Flow.Prelude.copy(_selectedValues());
            for (_j = 0, _len1 = selectedValues.length; _j < _len1; _j++) {
                view = selectedValues[_j];
                view.exclude();
            }
        };
        _searchAvailable = function () {
            var hiddenCount, term, _j, _len1, _ref1;
            hiddenCount = 0;
            _ref1 = _availableValues();
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                view = _ref1[_j];
                term = _availableSearchTerm().trim();
                if (term === '' || 0 <= view.value.toLowerCase().indexOf(term.toLowerCase())) {
                    view.canInclude(true);
                } else {
                    view.canInclude(false);
                    hiddenCount++;
                }
            }
            _availableValuesCaption('' + hiddenCount + ' items hidden');
        };
        _searchSelected = function () {
            var hiddenCount, term, _j, _len1, _ref1;
            hiddenCount = 0;
            _ref1 = _availableValues();
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                view = _ref1[_j];
                term = _selectedSearchTerm().trim();
                if (term === '' || 0 <= view.value.toLowerCase().indexOf(term.toLowerCase())) {
                    view.canExclude(true);
                } else {
                    view.canExclude(false);
                    if (!view.isAvailable()) {
                        hiddenCount++;
                    }
                }
            }
            _selectedValuesCaption('' + hiddenCount + ' items hidden');
        };
        Flow.Dataflow.react(_availableSearchTerm, lodash.throttle(_searchAvailable, 500));
        Flow.Dataflow.react(_selectedSearchTerm, lodash.throttle(_searchSelected, 500));
        Flow.Dataflow.react(_selectedValues, lodash.throttle(_searchSelected, 500));
        control = createControl('list', parameter);
        control.values = _values;
        control.availableValues = _availableValues;
        control.selectedValues = _selectedValues;
        control.value = _value;
        control.availableSearchTerm = _availableSearchTerm;
        control.selectedSearchTerm = _selectedSearchTerm;
        control.availableValuesCaption = _availableValuesCaption;
        control.selectedValuesCaption = _selectedValuesCaption;
        control.includeAll = includeAll;
        control.excludeAll = excludeAll;
        return control;
    };
    createCheckboxControl = function (parameter) {
        var control, _value;
        _value = Flow.Dataflow.signal(parameter.actual_value);
        control = createControl('checkbox', parameter);
        control.clientId = lodash.uniqueId();
        control.value = _value;
        return control;
    };
    createControlFromParameter = function (parameter) {
        switch (parameter.type) {
        case 'enum':
        case 'Key<Frame>':
        case 'VecSpecifier':
            return createDropdownControl(parameter);
        case 'string[]':
            return createListControl(parameter);
        case 'boolean':
            return createCheckboxControl(parameter);
        case 'Key<Model>':
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
    };
    H2O.ModelBuilderForm = function (_, _algorithm, _parameters) {
        var collectParameters, control, createModel, criticalControls, expertControls, findControl, findFormField, parameterTemplateOf, performValidations, revalidate, secondaryControls, _controlGroups, _exception, _form, _hasValidationFailures, _i, _j, _k, _len, _len1, _len2, _parametersByLevel, _revalidate, _validationFailureMessage;
        _exception = Flow.Dataflow.signal(null);
        _validationFailureMessage = Flow.Dataflow.signal('');
        _hasValidationFailures = Flow.Dataflow.lift(_validationFailureMessage, Flow.Prelude.isTruthy);
        _parametersByLevel = lodash.groupBy(_parameters, function (parameter) {
            return parameter.level;
        });
        _controlGroups = lodash.map([
            'critical',
            'secondary',
            'expert'
        ], function (type) {
            return lodash.filter(lodash.map(_parametersByLevel[type], createControlFromParameter), function (a) {
                if (a) {
                    return true;
                } else {
                    return false;
                }
            });
        });
        criticalControls = _controlGroups[0], secondaryControls = _controlGroups[1], expertControls = _controlGroups[2];
        _form = [];
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
        findControl = function (name) {
            var controls, _l, _len3, _len4, _m;
            for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
                controls = _controlGroups[_l];
                for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
                    control = controls[_m];
                    if (control.name === name) {
                        return control;
                    }
                }
            }
        };
        parameterTemplateOf = function (control) {
            return 'flow-' + control.kind + '-model-parameter';
        };
        findFormField = function (name) {
            return lodash.find(_form, function (field) {
                return field.name === name;
            });
        };
        (function () {
            var ignoredColumnsParameter, responseColumnParameter, trainingFrameParameter, validationFrameParameter, _ref;
            _ref = lodash.map([
                'training_frame',
                'validation_frame',
                'response_column',
                'ignored_columns'
            ], findFormField), trainingFrameParameter = _ref[0], validationFrameParameter = _ref[1], responseColumnParameter = _ref[2], ignoredColumnsParameter = _ref[3];
            if (trainingFrameParameter) {
                if (responseColumnParameter || ignoredColumnsParameter) {
                    return Flow.Dataflow.act(trainingFrameParameter.value, function (frameKey) {
                        if (frameKey) {
                            _.requestFrame(frameKey, function (error, frame) {
                                var columnLabels, columnValues;
                                if (!error) {
                                    columnValues = lodash.map(frame.columns, function (column) {
                                        return column.label;
                                    });
                                    columnLabels = lodash.map(frame.columns, function (column) {
                                        var missingPercent, na;
                                        missingPercent = 100 * column.missing_count / frame.rows;
                                        na = missingPercent === 0 ? '' : ' (' + Math.round(missingPercent) + '% NA)';
                                        return {
                                            label: '' + column.label + na,
                                            value: column.label
                                        };
                                    });
                                    if (responseColumnParameter) {
                                        responseColumnParameter.values(columnValues);
                                    }
                                    if (ignoredColumnsParameter) {
                                        return ignoredColumnsParameter.values(columnLabels);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        }());
        collectParameters = function (includeUnchangedParameters) {
            var controls, parameters, value, _l, _len3, _len4, _m;
            if (includeUnchangedParameters == null) {
                includeUnchangedParameters = false;
            }
            parameters = {};
            for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
                controls = _controlGroups[_l];
                for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
                    control = controls[_m];
                    value = control.value();
                    if (includeUnchangedParameters || control.isRequired || control.defaultValue !== value) {
                        switch (control.kind) {
                        case 'dropdown':
                            if (value) {
                                parameters[control.name] = value;
                            }
                            break;
                        case 'list':
                            if (value.length) {
                                parameters[control.name] = value;
                            }
                            break;
                        default:
                            parameters[control.name] = value;
                        }
                    }
                }
            }
            return parameters;
        };
        performValidations = function (checkForErrors, go) {
            var parameters;
            _exception(null);
            parameters = collectParameters(true);
            _validationFailureMessage('');
            return _.requestModelInputValidation(_algorithm, parameters, function (error, modelBuilder) {
                var controls, hasErrors, validation, validations, validationsByControlName, _l, _len3, _len4, _len5, _m, _n;
                if (error) {
                    return _exception(Flow.Failure(_, new Flow.Error('Error fetching initial model builder state', error)));
                } else {
                    hasErrors = false;
                    if (modelBuilder.validation_messages.length) {
                        validationsByControlName = lodash.groupBy(modelBuilder.validation_messages, function (validation) {
                            return validation.field_name;
                        });
                        for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
                            controls = _controlGroups[_l];
                            for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
                                control = controls[_m];
                                if (validations = validationsByControlName[control.name]) {
                                    for (_n = 0, _len5 = validations.length; _n < _len5; _n++) {
                                        validation = validations[_n];
                                        if (validation.message_type === 'HIDE') {
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
                                                case 'ERROR':
                                                    control.hasError(true);
                                                    control.message(validation.message);
                                                    hasErrors = true;
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
                        return _validationFailureMessage('Your model parameters have one or more errors. Please fix them and try again.');
                    } else {
                        _validationFailureMessage('');
                        return go();
                    }
                }
            });
        };
        createModel = function () {
            _exception(null);
            return performValidations(true, function () {
                var parameters;
                parameters = collectParameters(false);
                return _.insertAndExecuteCell('cs', 'buildModel \'' + _algorithm + '\', ' + Flow.Prelude.stringify(parameters));
            });
        };
        _revalidate = function (value) {
            if (value !== void 0) {
                return performValidations(false, function () {
                });
            }
        };
        revalidate = lodash.throttle(_revalidate, 100, { leading: false });
        performValidations(false, function () {
            var controls, _l, _len3, _len4, _m;
            for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
                controls = _controlGroups[_l];
                for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
                    control = controls[_m];
                    Flow.Dataflow.react(control.value, revalidate);
                }
            }
        });
        return {
            form: _form,
            exception: _exception,
            parameterTemplateOf: parameterTemplateOf,
            createModel: createModel,
            hasValidationFailures: _hasValidationFailures,
            validationFailureMessage: _validationFailureMessage
        };
    };
    H2O.ModelInput = function (_, _go, _algo, _opts) {
        var createModel, populateFramesAndColumns, _algorithm, _algorithms, _canCreateModel, _exception, _modelForm;
        _exception = Flow.Dataflow.signal(null);
        _algorithms = Flow.Dataflow.signal([]);
        _algorithm = Flow.Dataflow.signal(null);
        _canCreateModel = Flow.Dataflow.lift(_algorithm, function (algorithm) {
            if (algorithm) {
                return true;
            } else {
                return false;
            }
        });
        _modelForm = Flow.Dataflow.signal(null);
        populateFramesAndColumns = function (frameKey, algorithm, parameters, go) {
            var classificationParameter, destinationKeyParameter;
            destinationKeyParameter = lodash.find(parameters, function (parameter) {
                return parameter.name === 'destination_key';
            });
            if (destinationKeyParameter && !destinationKeyParameter.actual_value) {
                destinationKeyParameter.actual_value = '' + algorithm + '-' + Flow.Util.uuid();
            }
            classificationParameter = lodash.find(parameters, function (parameter) {
                return parameter.name === 'do_classification';
            });
            if (classificationParameter) {
                classificationParameter.actual_value = true;
            }
            return _.requestFrames(function (error, frames) {
                var frame, frameKeys, frameParameters, parameter, _i, _len;
                if (error) {
                } else {
                    frameKeys = function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = frames.length; _i < _len; _i++) {
                            frame = frames[_i];
                            _results.push(frame.key.name);
                        }
                        return _results;
                    }();
                    frameParameters = lodash.filter(parameters, function (parameter) {
                        return parameter.type === 'Key<Frame>';
                    });
                    for (_i = 0, _len = frameParameters.length; _i < _len; _i++) {
                        parameter = frameParameters[_i];
                        parameter.values = frameKeys;
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
        };
        (function () {
            return _.requestModelBuilders(function (error, result) {
                var frameKey, key, modelBuilders;
                modelBuilders = error ? [] : result.model_builders;
                _algorithms(function () {
                    var _i, _len, _ref, _results;
                    _ref = lodash.keys(modelBuilders);
                    _results = [];
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        key = _ref[_i];
                        if (key !== 'example') {
                            _results.push(key);
                        }
                    }
                    return _results;
                }());
                _algorithm(_algo);
                frameKey = _opts != null ? _opts.training_frame : void 0;
                return Flow.Dataflow.act(_algorithm, function (algorithm) {
                    if (algorithm) {
                        return _.requestModelBuilder(algorithm, function (error, result) {
                            var parameters;
                            if (error) {
                                return _exception(Flow.Failure(_, new Flow.Error('Error fetching model builder', error)));
                            } else {
                                parameters = result.model_builders[algorithm].parameters;
                                return populateFramesAndColumns(frameKey, algorithm, parameters, function () {
                                    return _modelForm(H2O.ModelBuilderForm(_, algorithm, parameters));
                                });
                            }
                        });
                    } else {
                        return _modelForm(null);
                    }
                });
            });
        }());
        createModel = function () {
            return _modelForm().createModel();
        };
        lodash.defer(_go);
        return {
            parentException: _exception,
            algorithms: _algorithms,
            algorithm: _algorithm,
            modelForm: _modelForm,
            canCreateModel: _canCreateModel,
            createModel: createModel,
            template: 'flow-model-input'
        };
    };
}.call(this));
(function () {
    H2O.ModelOutput = function (_, _go, _model) {
        var cloneModel, deleteModel, inspect, predict, renderPlot, table, toggle, _inputParameters, _isExpanded, _plots;
        _isExpanded = Flow.Dataflow.signal(false);
        _plots = Flow.Dataflow.signals([]);
        _inputParameters = lodash.map(_model.parameters, function (parameter) {
            var actual_value, default_value, help, label, type, value;
            type = parameter.type, default_value = parameter.default_value, actual_value = parameter.actual_value, label = parameter.label, help = parameter.help;
            value = function () {
                switch (type) {
                case 'Key<Frame>':
                case 'Key<Model>':
                    if (actual_value) {
                        return actual_value.name;
                    } else {
                        return null;
                    }
                    break;
                case 'VecSpecifier':
                    if (actual_value) {
                        return actual_value.column_name;
                    } else {
                        return null;
                    }
                    break;
                case 'string[]':
                    if (actual_value) {
                        return actual_value.join(', ');
                    } else {
                        return null;
                    }
                    break;
                default:
                    return actual_value;
                }
            }();
            return {
                label: label,
                value: value,
                help: help,
                isModified: default_value === actual_value
            };
        });
        renderPlot = function (title, render) {
            var container;
            container = Flow.Dataflow.signal(null);
            render(function (error, vis) {
                if (error) {
                    return console.debug(error);
                } else {
                    return container(vis.element);
                }
            });
            return _plots.push({
                title: title,
                plot: container
            });
        };
        switch (_model.algo) {
        case 'glm':
            if (table = _.inspect('output', _model)) {
                renderPlot('Output', _.plot(function (g) {
                    return g(g.select(), g.from(table));
                }));
            }
            if (table = _.inspect('Normalized Coefficient Magnitudes', _model)) {
                renderPlot('Normalized Coefficient Magnitudes', _.plot(function (g) {
                    return g(g.rect(g.position('Scaled', 'Variable')), g.from(table), g.limit(25));
                }));
            }
            break;
        case 'deeplearning':
            if (table = _.inspect('Status of Neuron Layers', _model)) {
                renderPlot('Status of Neuron Layers', _.plot(function (g) {
                    return g(g.select(), g.from(table));
                }));
            }
            if (table = _.inspect('Training Metrics', _model)) {
                renderPlot('Training Metrics', _.plot(function (g) {
                    return g(g.select(), g.from(table));
                }));
            }
            if (table = _.inspect('Training Confusion Matrix', _model)) {
                renderPlot('Training Confusion Matrix', _.plot(function (g) {
                    return g(g.select(), g.from(table));
                }));
            }
            if (table = _.inspect('Validation Metrics', _model)) {
                renderPlot('Validation Metrics', _.plot(function (g) {
                    return g(g.select(), g.from(table));
                }));
            }
            if (table = _.inspect('Validation Confusion Matrix', _model)) {
                renderPlot('Validation Confusion Matrix', _.plot(function (g) {
                    return g(g.select(), g.from(table));
                }));
            }
            if (table = _.inspect('Variable Importances', _model)) {
                renderPlot('Variable Importances', _.plot(function (g) {
                    return g(g.rect(g.position('Scaled Importance', 'Variable')), g.from(table), g.limit(25));
                }));
            }
            if (table = _.inspect('Scoring History', _model)) {
                renderPlot('Scoring History', _.plot(function (g) {
                    return g(g.select(), g.from(table));
                }));
            }
            break;
        case 'gbm':
        case 'drf':
            if (table = _.inspect('output', _model)) {
                renderPlot('Output', _.plot(function (g) {
                    return g(g.path(g.position('tree', 'mse_train'), g.strokeColor(g.value('#1f77b4'))), g.path(g.position('tree', 'mse_valid'), g.strokeColor(g.value('#ff7f0e'))), g.point(g.position('tree', 'mse_train'), g.strokeColor(g.value('#1f77b4'))), g.point(g.position('tree', 'mse_valid'), g.strokeColor(g.value('#ff7f0e'))), g.from(table));
                }));
            }
            if (table = _.inspect('Variable Importances', _model)) {
                renderPlot('Variable Importances', _.plot(function (g) {
                    return g(g.rect(g.position('Scaled Importance', 'Variable')), g.from(table), g.limit(25));
                }));
            }
        }
        toggle = function () {
            return _isExpanded(!_isExpanded());
        };
        cloneModel = function () {
            return alert('Not implemented');
        };
        predict = function () {
            return _.insertAndExecuteCell('cs', 'predict model: ' + Flow.Prelude.stringify(_model.key.name));
        };
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getModel ' + Flow.Prelude.stringify(_model.key.name));
        };
        deleteModel = function () {
            return _.confirm('Are you sure you want to delete this model?', {
                acceptCaption: 'Delete Model',
                declineCaption: 'Cancel'
            }, function (accept) {
                if (accept) {
                    return _.insertAndExecuteCell('cs', 'deleteModel ' + Flow.Prelude.stringify(_model.key.name));
                }
            });
        };
        lodash.defer(_go);
        return {
            key: _model.key,
            algo: _model.algo,
            plots: _plots,
            inputParameters: _inputParameters,
            isExpanded: _isExpanded,
            toggle: toggle,
            cloneModel: cloneModel,
            predict: predict,
            inspect: inspect,
            deleteModel: deleteModel,
            template: 'flow-model-output'
        };
    };
}.call(this));
(function () {
    H2O.ModelsOutput = function (_, _go, _models) {
        var buildModel, collectSelectedKeys, compareModels, createModelView, deleteModels, initialize, inspectAll, predictUsingModels, _canCompareModels, _checkAllModels, _checkedModelCount, _hasSelectedModels, _isCheckingAll, _modelViews;
        _modelViews = Flow.Dataflow.signal([]);
        _checkAllModels = Flow.Dataflow.signal(false);
        _checkedModelCount = Flow.Dataflow.signal(0);
        _canCompareModels = Flow.Dataflow.lift(_checkedModelCount, function (count) {
            return count > 1;
        });
        _hasSelectedModels = Flow.Dataflow.lift(_checkedModelCount, function (count) {
            return count > 0;
        });
        _isCheckingAll = false;
        Flow.Dataflow.react(_checkAllModels, function (checkAll) {
            var view, views, _i, _len;
            _isCheckingAll = true;
            views = _modelViews();
            for (_i = 0, _len = views.length; _i < _len; _i++) {
                view = views[_i];
                view.isChecked(checkAll);
            }
            _checkedModelCount(checkAll ? views.length : 0);
            _isCheckingAll = false;
        });
        createModelView = function (model) {
            var cloneModel, inspect, predict, view, _isChecked;
            _isChecked = Flow.Dataflow.signal(false);
            Flow.Dataflow.react(_isChecked, function () {
                var checkedViews, view;
                if (_isCheckingAll) {
                    return;
                }
                checkedViews = function () {
                    var _i, _len, _ref, _results;
                    _ref = _modelViews();
                    _results = [];
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
            predict = function () {
                return _.insertAndExecuteCell('cs', 'predict model: ' + Flow.Prelude.stringify(model.key.name));
            };
            cloneModel = function () {
                return alert('Not implemented');
                return _.insertAndExecuteCell('cs', 'cloneModel ' + Flow.Prelude.stringify(model.key.name));
            };
            view = function () {
                return _.insertAndExecuteCell('cs', 'getModel ' + Flow.Prelude.stringify(model.key.name));
            };
            inspect = function () {
                return _.insertAndExecuteCell('cs', 'inspect getModel ' + Flow.Prelude.stringify(model.key.name));
            };
            return {
                key: model.key.name,
                algo: model.algo,
                isChecked: _isChecked,
                predict: predict,
                clone: cloneModel,
                inspect: inspect,
                view: view
            };
        };
        buildModel = function () {
            return _.insertAndExecuteCell('cs', 'buildModel');
        };
        collectSelectedKeys = function () {
            var view, _i, _len, _ref, _results;
            _ref = _modelViews();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                view = _ref[_i];
                if (view.isChecked()) {
                    _results.push(view.key);
                }
            }
            return _results;
        };
        compareModels = function () {
            return _.insertAndExecuteCell('cs', 'inspect getModels ' + Flow.Prelude.stringify(collectSelectedKeys()));
        };
        predictUsingModels = function () {
            return _.insertAndExecuteCell('cs', 'predict models: ' + Flow.Prelude.stringify(collectSelectedKeys()));
        };
        deleteModels = function () {
            return _.confirm('Are you sure you want to delete these models?', {
                acceptCaption: 'Delete Models',
                declineCaption: 'Cancel'
            }, function (accept) {
                if (accept) {
                    return _.insertAndExecuteCell('cs', 'deleteModels ' + Flow.Prelude.stringify(collectSelectedKeys()));
                }
            });
        };
        inspectAll = function () {
            var allKeys, view;
            allKeys = function () {
                var _i, _len, _ref, _results;
                _ref = _modelViews();
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    view = _ref[_i];
                    _results.push(view.key);
                }
                return _results;
            }();
            return _.insertAndExecuteCell('cs', 'inspect getModels ' + Flow.Prelude.stringify(allKeys));
        };
        initialize = function (models) {
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
    };
}.call(this));
(function () {
    H2O.NetworkTestOutput = function (_, _go, _testResult) {
        var render, _result;
        _result = Flow.Dataflow.signal(null);
        render = _.plot(function (g) {
            return g(g.select(), g.from(_.inspect('result', _testResult)));
        });
        render(function (error, vis) {
            if (error) {
                return console.debug(error);
            } else {
                return _result(vis.element);
            }
        });
        lodash.defer(_go);
        return {
            result: _result,
            template: 'flow-network-test-output'
        };
    };
}.call(this));
(function () {
    H2O.NoAssist = function (_, _go) {
        lodash.defer(_go);
        return {
            showAssist: function () {
                return _.insertAndExecuteCell('cs', 'assist');
            },
            template: 'flow-no-assist'
        };
    };
}.call(this));
(function () {
    var dataTypes, parseDelimiters, parseTypes;
    parseTypes = lodash.map([
        'AUTO',
        'ARFF',
        'XLS',
        'XLSX',
        'CSV',
        'SVMLight'
    ], function (type) {
        return {
            type: type,
            caption: type
        };
    });
    parseDelimiters = function () {
        var characterDelimiters, createDelimiter, otherDelimiters, whitespaceDelimiters, whitespaceSeparators;
        whitespaceSeparators = [
            'NULL',
            'SOH (start of heading)',
            'STX (start of text)',
            'ETX (end of text)',
            'EOT (end of transmission)',
            'ENQ (enquiry)',
            'ACK (acknowledge)',
            'BEL \'\\a\' (bell)',
            'BS  \'\\b\' (backspace)',
            'HT  \'\\t\' (horizontal tab)',
            'LF  \'\\n\' (new line)',
            'VT  \'\\v\' (vertical tab)',
            'FF  \'\\f\' (form feed)',
            'CR  \'\\r\' (carriage ret)',
            'SO  (shift out)',
            'SI  (shift in)',
            'DLE (data link escape)',
            'DC1 (device control 1) ',
            'DC2 (device control 2)',
            'DC3 (device control 3)',
            'DC4 (device control 4)',
            'NAK (negative ack.)',
            'SYN (synchronous idle)',
            'ETB (end of trans. blk)',
            'CAN (cancel)',
            'EM  (end of medium)',
            'SUB (substitute)',
            'ESC (escape)',
            'FS  (file separator)',
            'GS  (group separator)',
            'RS  (record separator)',
            'US  (unit separator)',
            '\' \' SPACE'
        ];
        createDelimiter = function (caption, charCode) {
            return {
                charCode: charCode,
                caption: '' + caption + ': \'' + ('00' + charCode).slice(-2) + '\''
            };
        };
        whitespaceDelimiters = lodash.map(whitespaceSeparators, createDelimiter);
        characterDelimiters = lodash.times(126 - whitespaceSeparators.length, function (i) {
            var charCode;
            charCode = i + whitespaceSeparators.length;
            return createDelimiter(String.fromCharCode(charCode), charCode);
        });
        otherDelimiters = [{
                charCode: -1,
                caption: 'AUTO'
            }];
        return whitespaceDelimiters.concat(characterDelimiters, otherDelimiters);
    }();
    dataTypes = [
        'Unknown',
        'Numeric',
        'Enum',
        'Time',
        'UUID',
        'String',
        'Invalid'
    ];
    H2O.SetupParseOutput = function (_, _go, _inputs, _result) {
        var parseFiles, refreshPreview, _chunkSize, _columnCount, _columns, _deleteOnDone, _delimiter, _destinationKey, _hasColumns, _headerOption, _headerOptions, _inputKey, _parseType, _preview, _rows, _sourceKeys, _useSingleQuotes;
        _inputKey = _inputs.paths ? 'paths' : 'source_keys';
        _sourceKeys = lodash.map(_result.source_keys, function (src) {
            return src.name;
        });
        _parseType = Flow.Dataflow.signal(lodash.find(parseTypes, function (parseType) {
            return parseType.type === _result.parse_type;
        }));
        _delimiter = Flow.Dataflow.signal(lodash.find(parseDelimiters, function (delimiter) {
            return delimiter.charCode === _result.separator;
        }));
        _useSingleQuotes = Flow.Dataflow.signal(_result.single_quotes);
        _destinationKey = Flow.Dataflow.signal(_result.destination_key);
        _headerOptions = {
            auto: 0,
            header: 1,
            data: -1
        };
        _headerOption = Flow.Dataflow.signal(_result.check_header === 0 ? 'auto' : _result.check_header === -1 ? 'data' : 'header');
        _deleteOnDone = Flow.Dataflow.signal(true);
        _preview = Flow.Dataflow.signal(_result);
        refreshPreview = function () {
            var column, columnTypes;
            columnTypes = function () {
                var _i, _len, _ref, _results;
                _ref = _columns();
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    column = _ref[_i];
                    _results.push(column.type());
                }
                return _results;
            }();
            return _.requestParseSetupPreview(_sourceKeys, _parseType().type, _delimiter().charCode, _useSingleQuotes(), _headerOptions[_headerOption()], columnTypes, function (error, result) {
                if (!error) {
                    return _preview(result);
                }
            });
        };
        _columnCount = Flow.Dataflow.lift(_preview, function (preview) {
            return preview.number_columns;
        });
        _hasColumns = Flow.Dataflow.lift(_columnCount, function (count) {
            return count > 0;
        });
        _columns = Flow.Dataflow.lift(_preview, function (preview) {
            var columnNames, columnTypes, i, _i, _ref, _results;
            columnNames = preview.column_names;
            columnTypes = preview.column_types;
            _results = [];
            for (i = _i = 0, _ref = preview.number_columns; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                _results.push({
                    name: Flow.Dataflow.signal(columnNames ? columnNames[i] : ''),
                    type: Flow.Dataflow.signal(columnTypes[i])
                });
            }
            return _results;
        });
        Flow.Dataflow.act(_columns, function (columns) {
            return lodash.forEach(columns, function (column) {
                return Flow.Dataflow.react(column.type, refreshPreview);
            });
        });
        _rows = Flow.Dataflow.lift(_preview, function (preview) {
            return preview.data;
        });
        _chunkSize = Flow.Dataflow.lift(_preview, function (preview) {
            return preview.chunk_size;
        });
        Flow.Dataflow.react(_parseType, _delimiter, _useSingleQuotes, _headerOption, refreshPreview);
        parseFiles = function () {
            var column, columnNames, columnTypes, headerOption;
            columnNames = function () {
                var _i, _len, _ref, _results;
                _ref = _columns();
                _results = [];
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
            columnTypes = function () {
                var _i, _len, _ref, _results;
                _ref = _columns();
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    column = _ref[_i];
                    _results.push(column.type());
                }
                return _results;
            }();
            return _.insertAndExecuteCell('cs', 'parseFiles\n  ' + _inputKey + ': ' + Flow.Prelude.stringify(_inputs[_inputKey]) + '\n  destination_key: ' + Flow.Prelude.stringify(_destinationKey()) + '\n  parse_type: ' + Flow.Prelude.stringify(_parseType().type) + '\n  separator: ' + _delimiter().charCode + '\n  number_columns: ' + _columnCount() + '\n  single_quotes: ' + _useSingleQuotes() + '\n  ' + (columnNames ? 'column_names: ' + Flow.Prelude.stringify(columnNames) + '\n  ' : '') + 'column_types: ' + Flow.Prelude.stringify(columnTypes) + '\n  delete_on_done: ' + _deleteOnDone() + '\n  check_header: ' + headerOption + '\n  chunk_size: ' + _chunkSize());
        };
        lodash.defer(_go);
        return {
            sourceKeys: _inputs[_inputKey],
            parseTypes: parseTypes,
            dataTypes: dataTypes,
            delimiters: parseDelimiters,
            parseType: _parseType,
            delimiter: _delimiter,
            useSingleQuotes: _useSingleQuotes,
            columns: _columns,
            rows: _rows,
            columnCount: _columnCount,
            hasColumns: _hasColumns,
            destinationKey: _destinationKey,
            headerOption: _headerOption,
            deleteOnDone: _deleteOnDone,
            parseFiles: parseFiles,
            template: 'flow-parse-raw-input'
        };
    };
}.call(this));
(function () {
    H2O.PlotInput = function (_, _go, _frame) {
        var plot, vector, _canPlot, _color, _type, _types, _vectors, _x, _y;
        _types = [
            'point',
            'path',
            'rect'
        ];
        _vectors = function () {
            var _i, _len, _ref, _results;
            _ref = _frame.vectors;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                vector = _ref[_i];
                if (vector.type === Flow.TString || vector.type === Flow.TNumber) {
                    _results.push(vector.label);
                }
            }
            return _results;
        }();
        _type = Flow.Dataflow.signal(null);
        _x = Flow.Dataflow.signal(null);
        _y = Flow.Dataflow.signal(null);
        _color = Flow.Dataflow.signal(null);
        _canPlot = Flow.Dataflow.lift(_type, _x, _y, function (type, x, y) {
            return type && x && y;
        });
        plot = function () {
            var color, command;
            command = (color = _color()) ? 'plot (g) -> g(\n  g.' + _type() + '(\n    g.position ' + Flow.Prelude.stringify(_x()) + ', ' + Flow.Prelude.stringify(_y()) + '\n    g.color ' + Flow.Prelude.stringify(color) + '\n  )\n  g.from inspect ' + Flow.Prelude.stringify(_frame.label) + ', ' + _frame.metadata.origin + '\n)' : 'plot (g) -> g(\n  g.' + _type() + '(\n    g.position ' + Flow.Prelude.stringify(_x()) + ', ' + Flow.Prelude.stringify(_y()) + '\n  )\n  g.from inspect ' + Flow.Prelude.stringify(_frame.label) + ', ' + _frame.metadata.origin + '\n)';
            return _.insertAndExecuteCell('cs', command);
        };
        lodash.defer(_go);
        return {
            types: _types,
            type: _type,
            vectors: _vectors,
            x: _x,
            y: _y,
            color: _color,
            plot: plot,
            canPlot: _canPlot,
            template: 'flow-plot-input'
        };
    };
}.call(this));
(function () {
    H2O.PlotOutput = function (_, _go, _plot) {
        lodash.defer(_go);
        return {
            plot: _plot,
            template: 'flow-plot-output'
        };
    };
}.call(this));
(function () {
    H2O.PredictInput = function (_, _go, opt) {
        var predict, _canPredict, _destinationKey, _exception, _frames, _hasFrames, _hasModels, _models, _ref, _selectedFrame, _selectedFrames, _selectedFramesCaption, _selectedModel, _selectedModels, _selectedModelsCaption;
        _destinationKey = Flow.Dataflow.signal((_ref = opt.destination_key) != null ? _ref : 'prediction-' + Flow.Util.uuid());
        _selectedModels = opt.models ? opt.models : opt.model ? [opt.model] : [];
        _selectedFrames = opt.frames ? opt.frames : opt.frame ? [opt.frame] : [];
        _selectedModelsCaption = _selectedModels.join(', ');
        _selectedFramesCaption = _selectedFrames.join(', ');
        _exception = Flow.Dataflow.signal(null);
        _selectedFrame = Flow.Dataflow.signal(null);
        _selectedModel = Flow.Dataflow.signal(null);
        _hasFrames = _selectedFrames.length ? true : false;
        _hasModels = _selectedModels.length ? true : false;
        _canPredict = Flow.Dataflow.lift(_selectedFrame, _selectedModel, function (frame, model) {
            return frame && model || _hasFrames && model || _hasModels && frame;
        });
        _frames = Flow.Dataflow.signals([]);
        _models = Flow.Dataflow.signals([]);
        if (!_hasFrames) {
            _.requestFrames(function (error, frames) {
                var frame;
                if (error) {
                    return _exception(new Flow.Error('Error fetching frame list.', error));
                } else {
                    return _frames(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = frames.length; _i < _len; _i++) {
                            frame = frames[_i];
                            _results.push(frame.key.name);
                        }
                        return _results;
                    }());
                }
            });
        }
        if (!_hasModels) {
            _.requestModels(function (error, models) {
                var model;
                if (error) {
                    return _exception(new Flow.Error('Error fetching model list.', error));
                } else {
                    return _models(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = models.length; _i < _len; _i++) {
                            model = models[_i];
                            _results.push(model.key.name);
                        }
                        return _results;
                    }());
                }
            });
        }
        predict = function () {
            var destinationKey, frameArg, modelArg;
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
            destinationKey = _destinationKey();
            if (destinationKey) {
                return _.insertAndExecuteCell('cs', 'predict model: ' + Flow.Prelude.stringify(modelArg) + ', frame: ' + Flow.Prelude.stringify(frameArg) + ', destination_key: ' + Flow.Prelude.stringify(destinationKey));
            } else {
                return _.insertAndExecuteCell('cs', 'predict model: ' + Flow.Prelude.stringify(modelArg) + ', frame: ' + Flow.Prelude.stringify(frameArg));
            }
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
            template: 'flow-predict-input'
        };
    };
}.call(this));
(function () {
    H2O.PredictOutput = function (_, _go, prediction) {
        var frame, inspect, model, renderPlot, viewPredictionFrame, _isBinomial, _isClustering, _isMultinomial, _isRegression, _predictionRecord, _rocCurve;
        frame = prediction.frame, model = prediction.model;
        _isBinomial = Flow.Dataflow.signal(prediction.model_category === 'Binomial');
        _isMultinomial = Flow.Dataflow.signal(prediction.model_category === 'Multinomial');
        _isRegression = Flow.Dataflow.signal(prediction.model_category === 'Regression');
        _isClustering = Flow.Dataflow.signal(prediction.model_category === 'Clustering');
        _predictionRecord = Flow.Dataflow.signal(null);
        _rocCurve = Flow.Dataflow.signal(null);
        renderPlot = function (target, render) {
            return render(function (error, vis) {
                if (error) {
                    return console.debug(error);
                } else {
                    return target(vis.element);
                }
            });
        };
        if (_isBinomial()) {
            renderPlot(_predictionRecord, _.enumerate(_.inspect('Prediction', prediction)));
        }
        if (_isMultinomial()) {
            renderPlot(_predictionRecord, _.enumerate(_.inspect('prediction', prediction)));
        }
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getPrediction model: ' + Flow.Prelude.stringify(model.name) + ', frame: ' + Flow.Prelude.stringify(frame.name));
        };
        viewPredictionFrame = function () {
            return _.insertAndExecuteCell('cs', 'getFrameSummary ' + Flow.Prelude.stringify(prediction.predictions.key.name));
        };
        lodash.defer(_go);
        return {
            isBinomial: _isBinomial,
            isMultinomial: _isMultinomial,
            isRegression: _isRegression,
            isClustering: _isClustering,
            predictionRecord: _predictionRecord,
            rocCurve: _rocCurve,
            inspect: inspect,
            viewPredictionFrame: viewPredictionFrame,
            template: 'flow-predict-output'
        };
    };
}.call(this));
(function () {
    H2O.PredictsOutput = function (_, _go, opts, _predictions) {
        var arePredictionsComparable, comparePredictions, createPredictionView, initialize, inspectAll, plotMetrics, plotPredictions, plotScores, predict, _canComparePredictions, _checkAllPredictions, _isCheckingAll, _metricsTable, _predictionViews, _predictionsTable, _rocCurve, _scoresTable;
        _predictionViews = Flow.Dataflow.signal([]);
        _checkAllPredictions = Flow.Dataflow.signal(false);
        _canComparePredictions = Flow.Dataflow.signal(false);
        _rocCurve = Flow.Dataflow.signal(null);
        arePredictionsComparable = function (views) {
            if (views.length === 0) {
                return false;
            }
            return lodash.every(views, function (view) {
                return view.modelCategory === 'Binomial';
            });
        };
        _isCheckingAll = false;
        Flow.Dataflow.react(_checkAllPredictions, function (checkAll) {
            var view, _i, _len, _ref;
            _isCheckingAll = true;
            _ref = _predictionViews();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                view = _ref[_i];
                view.isChecked(checkAll);
            }
            _canComparePredictions(checkAll && arePredictionsComparable(_predictionViews()));
            _isCheckingAll = false;
        });
        createPredictionView = function (prediction) {
            var inspect, view, _frameKey, _isChecked, _modelKey;
            _modelKey = prediction.model.name;
            _frameKey = prediction.frame.name;
            _isChecked = Flow.Dataflow.signal(false);
            Flow.Dataflow.react(_isChecked, function () {
                var checkedViews, view;
                if (_isCheckingAll) {
                    return;
                }
                checkedViews = function () {
                    var _i, _len, _ref, _results;
                    _ref = _predictionViews();
                    _results = [];
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        view = _ref[_i];
                        if (view.isChecked()) {
                            _results.push(view);
                        }
                    }
                    return _results;
                }();
                return _canComparePredictions(arePredictionsComparable(checkedViews));
            });
            view = function () {
                return _.insertAndExecuteCell('cs', 'getPrediction model: ' + Flow.Prelude.stringify(_modelKey) + ', frame: ' + Flow.Prelude.stringify(_frameKey));
            };
            inspect = function () {
                return _.insertAndExecuteCell('cs', 'inspect getPrediction model: ' + Flow.Prelude.stringify(_modelKey) + ', frame: ' + Flow.Prelude.stringify(_frameKey));
            };
            return {
                modelKey: _modelKey,
                frameKey: _frameKey,
                modelCategory: prediction.model_category,
                isChecked: _isChecked,
                view: view,
                inspect: inspect
            };
        };
        _predictionsTable = _.inspect('predictions', _predictions);
        _metricsTable = _.inspect('metrics', _predictions);
        _scoresTable = _.inspect('scores', _predictions);
        comparePredictions = function () {
            var selectedKeys, view;
            selectedKeys = function () {
                var _i, _len, _ref, _results;
                _ref = _predictionViews();
                _results = [];
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
            return _.insertAndExecuteCell('cs', 'getPredictions ' + Flow.Prelude.stringify(selectedKeys));
        };
        plotPredictions = function () {
            return _.insertAndExecuteCell('cs', _predictionsTable.metadata.plot);
        };
        plotScores = function () {
            return _.insertAndExecuteCell('cs', _scoresTable.metadata.plot);
        };
        plotMetrics = function () {
            return _.insertAndExecuteCell('cs', _metricsTable.metadata.plot);
        };
        inspectAll = function () {
            return _.insertAndExecuteCell('cs', 'inspect ' + _predictionsTable.metadata.origin);
        };
        predict = function () {
            return _.insertAndExecuteCell('cs', 'predict');
        };
        initialize = function (predictions) {
            _predictionViews(lodash.map(predictions, createPredictionView));
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
    };
}.call(this));
(function () {
    H2O.ProfileOutput = function (_, _go, _profile) {
        var createNode, i, node, _activeNode, _nodes;
        _activeNode = Flow.Dataflow.signal(null);
        createNode = function (node) {
            var display, entries, entry, self;
            display = function () {
                return _activeNode(self);
            };
            entries = function () {
                var _i, _len, _ref, _results;
                _ref = node.entries;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    entry = _ref[_i];
                    _results.push({
                        stacktrace: entry.stacktrace,
                        caption: 'Count: ' + entry.count
                    });
                }
                return _results;
            }();
            return self = {
                name: node.node_name,
                caption: '' + node.node_name + ' at ' + new Date(node.timestamp),
                entries: entries,
                display: display
            };
        };
        _nodes = function () {
            var _i, _len, _ref, _results;
            _ref = _profile.nodes;
            _results = [];
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
    };
}.call(this));
(function () {
    H2O.RDDsOutput = function (_, _go, _rDDs) {
        var createRDDView, _rDDViews;
        _rDDViews = Flow.Dataflow.signal([]);
        createRDDView = function (rDD) {
            return {
                id: rDD.id,
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
    };
}.call(this));
(function () {
    H2O.SplitFrameInput = function (_, _go, frameKey) {
        var addSplit, collectKeys, collectRatios, computeSplits, createSplit, initialize, splitFrame, updateLastSplit, _frame, _frames, _lastSplitKey, _lastSplitRatio, _lastSplitRatioText, _splits, _validationMessage;
        _frames = Flow.Dataflow.signal([]);
        _frame = Flow.Dataflow.signal(null);
        _lastSplitRatio = Flow.Dataflow.signal(1);
        _lastSplitRatioText = Flow.Dataflow.lift(_lastSplitRatio, function (ratio) {
            return ratio;
        });
        _lastSplitKey = Flow.Dataflow.signal('');
        _splits = Flow.Dataflow.signals([]);
        _validationMessage = Flow.Dataflow.signal('');
        collectRatios = function () {
            var entry, _i, _len, _ref, _results;
            _ref = _splits();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                entry = _ref[_i];
                _results.push(entry.ratio());
            }
            return _results;
        };
        collectKeys = function () {
            var entry, splitKeys;
            splitKeys = function () {
                var _i, _len, _ref, _results;
                _ref = _splits();
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    entry = _ref[_i];
                    _results.push(entry.key().trim());
                }
                return _results;
            }();
            splitKeys.push(_lastSplitKey().trim());
            return splitKeys;
        };
        updateLastSplit = function () {
            var ratio, totalRatio, _i, _len, _ref;
            totalRatio = 0;
            _ref = collectRatios();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                ratio = _ref[_i];
                totalRatio += ratio;
            }
            return _lastSplitRatio(1 - totalRatio);
        };
        computeSplits = function (go) {
            var key, ratio, splitKeys, splitRatios, totalRatio, _i, _j, _len, _len1;
            if (!_frame()) {
                return go('Frame not specified.');
            }
            splitRatios = collectRatios();
            totalRatio = 0;
            for (_i = 0, _len = splitRatios.length; _i < _len; _i++) {
                ratio = splitRatios[_i];
                if (0 < ratio && ratio < 1) {
                    totalRatio += ratio;
                } else {
                    return go('One or more split ratios are invalid. Ratios should between 0 and 1.');
                }
            }
            if (totalRatio >= 1) {
                return go('Sum of ratios is >= 1.');
            }
            splitKeys = collectKeys();
            for (_j = 0, _len1 = splitKeys.length; _j < _len1; _j++) {
                key = splitKeys[_j];
                if (key === '') {
                    return go('One or more keys are empty or invalid.');
                }
            }
            if (splitKeys.length < 2) {
                return go('Pleas specify at least two splits.');
            }
            if (splitKeys.length !== lodash.unique(splitKeys).length) {
                return go('Duplicate keys specified.');
            }
            return go(null, splitRatios, splitKeys);
        };
        createSplit = function () {
            var self, _key, _ratio, _ratioText;
            _ratioText = Flow.Dataflow.signal('0');
            _key = Flow.Dataflow.signal('');
            _ratio = Flow.Dataflow.lift(_ratioText, function (text) {
                return parseFloat(text);
            });
            Flow.Dataflow.react(_ratioText, updateLastSplit);
            Flow.Prelude.remove = function () {
                return _splits.remove(self);
            };
            return self = {
                key: _key,
                ratioText: _ratioText,
                ratio: _ratio,
                remove: Flow.Prelude.remove
            };
        };
        addSplit = function () {
            return _splits.push(createSplit());
        };
        splitFrame = function () {
            return computeSplits(function (error, splitRatios, splitKeys) {
                if (error) {
                    return _validationMessage(error);
                } else {
                    _validationMessage('');
                    return _.insertAndExecuteCell('cs', 'splitFrame ' + Flow.Prelude.stringify(_frame()) + ', ' + Flow.Prelude.stringify(splitRatios) + ', ' + Flow.Prelude.stringify(splitKeys));
                }
            });
        };
        initialize = function () {
            _.requestFrames(function (error, frames) {
                var frame, frameKeys;
                if (error) {
                } else {
                    frameKeys = function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = frames.length; _i < _len; _i++) {
                            frame = frames[_i];
                            _results.push(frame.key.name);
                        }
                        return _results;
                    }();
                    frameKeys.sort();
                    return _frames(frameKeys);
                }
            });
            addSplit();
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
            addSplit: addSplit,
            splitFrame: splitFrame,
            validationMessage: _validationMessage,
            template: 'flow-split-frame-input'
        };
    };
}.call(this));
(function () {
    H2O.SplitFrameOutput = function (_, _go, _splitFrameResult) {
        var computeRatios, createFrameView, index, key, _frames, _ratios;
        computeRatios = function (sourceRatios) {
            var ratio, ratios, total;
            total = 0;
            ratios = function () {
                var _i, _len, _results;
                _results = [];
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
        createFrameView = function (key, ratio) {
            var self, view;
            view = function () {
                return _.insertAndExecuteCell('cs', 'getFrameSummary ' + Flow.Prelude.stringify(key));
            };
            return self = {
                key: key,
                ratio: ratio,
                view: view
            };
        };
        _ratios = computeRatios(_splitFrameResult.ratios);
        _frames = function () {
            var _i, _len, _ref, _results;
            _ref = _splitFrameResult.keys;
            _results = [];
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
    };
}.call(this));
(function () {
    H2O.StackTraceOutput = function (_, _go, _stackTrace) {
        var createNode, createThread, node, _activeNode, _nodes;
        _activeNode = Flow.Dataflow.signal(null);
        createThread = function (thread) {
            var lines;
            lines = thread.split('\n');
            return {
                title: lodash.head(lines),
                stackTrace: lodash.tail(lines).join('\n')
            };
        };
        createNode = function (node) {
            var display, self, thread;
            display = function () {
                return _activeNode(self);
            };
            return self = {
                name: node.node,
                timestamp: new Date(node.time),
                threads: function () {
                    var _i, _len, _ref, _results;
                    _ref = node.thread_traces;
                    _results = [];
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        thread = _ref[_i];
                        _results.push(createThread(thread));
                    }
                    return _results;
                }(),
                display: display
            };
        };
        _nodes = function () {
            var _i, _len, _ref, _results;
            _ref = _stackTrace.traces;
            _results = [];
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
    };
}.call(this));
(function () {
    H2O.TimelineOutput = function (_, _go, _timeline) {
        var createEvent, refresh, toggleRefresh, updateTimeline, _data, _headers, _isBusy, _isLive, _timestamp;
        _isLive = Flow.Dataflow.signal(false);
        _isBusy = Flow.Dataflow.signal(false);
        _headers = [
            'HH:MM:SS:MS',
            'nanosec',
            'Who',
            'I/O Type',
            'Event',
            'Bytes'
        ];
        _data = Flow.Dataflow.signal(null);
        _timestamp = Flow.Dataflow.signal(Date.now());
        createEvent = function (event) {
            switch (event.type) {
            case 'io':
                return [
                    event.date,
                    event.nanos,
                    event.node,
                    event.io_flavor || '-',
                    'I/O',
                    event.data
                ];
            case 'heartbeat':
                return [
                    event.date,
                    event.nanos,
                    'many &#8594;  many',
                    'UDP',
                    'heartbeat',
                    '' + event.sends + ' sent ' + event.recvs + ' received'
                ];
            case 'network_msg':
                return [
                    event.date,
                    event.nanos,
                    '' + event.from + ' &#8594; ' + event.to,
                    event.protocol,
                    event.msg_type,
                    event.data
                ];
            }
        };
        updateTimeline = function (timeline) {
            var cell, event, grid, header, table, tbody, td, th, thead, ths, tr, trs, _ref;
            _ref = Flow.HTML.template('.grid', 'table', 'thead', 'tbody', 'tr', 'th', 'td'), grid = _ref[0], table = _ref[1], thead = _ref[2], tbody = _ref[3], tr = _ref[4], th = _ref[5], td = _ref[6];
            ths = function () {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = _headers.length; _i < _len; _i++) {
                    header = _headers[_i];
                    _results.push(th(header));
                }
                return _results;
            }();
            trs = function () {
                var _i, _len, _ref1, _results;
                _ref1 = timeline.events;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                    event = _ref1[_i];
                    _results.push(tr(function () {
                        var _j, _len1, _ref2, _results1;
                        _ref2 = createEvent(event);
                        _results1 = [];
                        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                            cell = _ref2[_j];
                            _results1.push(td(cell));
                        }
                        return _results1;
                    }()));
                }
                return _results;
            }();
            return _data(Flow.HTML.render('div', grid([table([
                    thead(tr(ths)),
                    tbody(trs)
                ])])));
        };
        toggleRefresh = function () {
            return _isLive(!_isLive());
        };
        refresh = function () {
            _isBusy(true);
            return _.requestTimeline(function (error, timeline) {
                _isBusy(false);
                if (error) {
                    _exception(Flow.Failure(_, new Flow.Error('Error fetching timeline', error)));
                    return _isLive(false);
                } else {
                    updateTimeline(timeline);
                    if (_isLive()) {
                        return lodash.delay(refresh, 2000);
                    }
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
    };
}.call(this));}).call(this);
