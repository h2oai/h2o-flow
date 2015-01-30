"use strict";(function(){ var lodash = window._; window.Flow={}; window.H2O={};(function () {
    if ((typeof window !== 'undefined' && window !== null ? window.$ : void 0) != null) {
        $(function () {
            var context;
            context = {};
            window.flow = Flow.Application(context, H2O.Routines);
            H2O.Application(context);
            ko.applyBindings(window.flow);
            return context.ready();
        });
    }
}.call(this));
(function () {
    var FLOW_VERSION;
    FLOW_VERSION = '0.2.36';
    Flow.About = function (_) {
        var _properties;
        _properties = Flow.Dataflow.signals([]);
        Flow.Dataflow.link(_.ready, function () {
            if (Flow.Version) {
                return _properties(Flow.Version);
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
                        value: FLOW_VERSION
                    });
                    return _properties(Flow.Version = properties);
                });
            }
        });
        return { properties: _properties };
    };
}.call(this));
(function () {
    Flow.Browser = function (_) {
        var createDocView, loadNotebooks, storeNotebook, _docs, _hasDocs, _sortedDocs;
        _docs = Flow.Dataflow.signals([]);
        _sortedDocs = Flow.Dataflow.lift(_docs, function (docs) {
            return lodash.sortBy(docs, function (doc) {
                return -doc.date().getTime();
            });
        });
        _hasDocs = Flow.Dataflow.lift(_docs, function (docs) {
            return docs.length > 0;
        });
        createDocView = function (_arg) {
            var doc, id, load, purge, self, type, _date, _fromNow, _title;
            type = _arg[0], id = _arg[1], doc = _arg[2];
            _title = Flow.Dataflow.signal(doc.title);
            _date = Flow.Dataflow.signal(new Date(doc.modifiedDate));
            _fromNow = Flow.Dataflow.lift(_date, Flow.Util.fromNow);
            load = function () {
                return _.loadNotebook(id, doc);
            };
            purge = function () {
                return _.requestDeleteObject(type, id, function (error) {
                    if (error) {
                        return console.debug(error);
                    } else {
                        return _docs.remove(self);
                    }
                });
            };
            return self = {
                id: id,
                title: _title,
                doc: doc,
                date: _date,
                fromNow: _fromNow,
                load: load,
                purge: purge
            };
        };
        storeNotebook = function (id, doc, go) {
            if (id) {
                return _.requestPutObject('notebook', id, doc, function (error) {
                    var index, source, _i, _len, _ref;
                    if (error) {
                        return go(error);
                    } else {
                        _ref = _docs();
                        for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                            source = _ref[index];
                            if (source.id === id) {
                                break;
                            }
                        }
                        _docs.splice(index, 1, createDocView([
                            'notebook',
                            id,
                            doc
                        ]));
                        return go(null, id);
                    }
                });
            } else {
                id = uuid();
                return _.requestPutObject('notebook', id, doc, function (error) {
                    if (error) {
                        return go(error);
                    } else {
                        _docs.push(createDocView([
                            'notebook',
                            id,
                            doc
                        ]));
                        return go(null, id);
                    }
                });
            }
        };
        loadNotebooks = function () {
            return _.requestObjects('notebook', function (error, objs) {
                if (error) {
                    return console.debug(error);
                } else {
                    return _docs(lodash.map(objs, createDocView));
                }
            });
        };
        Flow.Dataflow.link(_.ready, function () {
            return loadNotebooks();
        });
        Flow.Dataflow.link(_.storeNotebook, storeNotebook);
        return {
            docs: _sortedDocs,
            hasDocs: _hasDocs,
            loadNotebooks: loadNotebooks
        };
    };
}.call(this));
(function () {
    Flow.Cell = function (_, _renderers, type, input) {
        var activate, clip, execute, navigate, select, self, _actions, _guid, _hasError, _hasInput, _hasOutput, _input, _isActive, _isBusy, _isCode, _isInputVisible, _isOutputHidden, _isReady, _isSelected, _outputs, _render, _result, _type;
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
        execute = function (go) {
            var render;
            input = _input().trim();
            if (!input) {
                if (go) {
                    return go();
                } else {
                    return void 0;
                }
            }
            render = _render();
            _isBusy(true);
            _result(null);
            _outputs([]);
            _hasError(false);
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
                        return _outputs.push(Flow.Failure(error));
                    } else {
                        return _outputs.push({
                            text: JSON.stringify(error, null, 2),
                            template: 'flow-raw'
                        });
                    }
                },
                end: function () {
                    _hasInput(render.isCode);
                    _isBusy(false);
                    if (go) {
                        return go();
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
            toggleInput: function () {
                return _isInputVisible(!_isInputVisible());
            },
            isOutputHidden: _isOutputHidden,
            toggleOutput: function () {
                return _isOutputHidden(!_isOutputHidden());
            },
            select: select,
            navigate: navigate,
            activate: activate,
            execute: execute,
            clip: clip,
            _actions: _actions,
            getCursorPosition: function () {
                return _actions.getCursorPosition();
            },
            autoResize: function () {
                return _actions.autoResize();
            },
            scrollIntoView: function () {
                return _actions.scrollIntoView();
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
        var addClip, createClip, emptyTrash, initialize, lengthOf, removeClip, _hasTrashClips, _hasUserClips, _systemClipCount, _systemClips, _trashClipCount, _trashClips, _userClipCount, _userClips;
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
                return _trashClips.push(createClip(_trashClips, clip.type, clip.input));
            } else {
                return _trashClips.remove(clip);
            }
        };
        emptyTrash = function () {
            return _trashClips.removeAll();
        };
        initialize = function () {
            _systemClips(lodash.map(SystemClips, function (input) {
                return createClip(_systemClips, 'cs', input, false);
            }));
            return Flow.Dataflow.link(_.ready, function () {
                return Flow.Dataflow.link(_.saveClip, function (category, type, input) {
                    input = input.trim();
                    if (input) {
                        if (category === 'user') {
                            return addClip(_userClips, type, input);
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
                            return output.error(new Flow.Error('Error evaluating cell', error));
                        } else {
                            if (ft.render) {
                                return ft.render(result, function (error, result) {
                                    if (error) {
                                        return output.error(new Flow.Error('Error rendering output', error));
                                    } else {
                                        return output.data(result);
                                    }
                                });
                            } else if (result != null ? (_ref = result._flow_) != null ? _ref.render : void 0 : void 0) {
                                return output.data(result._flow_.render());
                            } else {
                                return output.data(Flow.ObjectBrowser('output', result));
                            }
                        }
                    });
                } else {
                    return output.data(Flow.ObjectBrowser('output', ft));
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
                output.end();
                result = cellResult.result();
                if (lodash.isFunction(result)) {
                    if (isRoutine(result)) {
                        return print(result());
                    } else {
                        return evaluate(result);
                    }
                } else {
                    return output.close(Flow.ObjectBrowser('result', result));
                }
            });
        };
        render.isCode = true;
        return render;
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
    Flow.Failure = function (error) {
        var causes, message, toggleStack, _isStackVisible;
        causes = traceCauses(error, []);
        message = causes.shift();
        _isStackVisible = Flow.Dataflow.signal(false);
        toggleStack = function () {
            return _isStackVisible(!_isStackVisible());
        };
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
    Flow.Form = function (_, _form) {
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
    Flow.Help = function (_) {
        return {
            assist: function () {
                return _.insertAndExecuteCell('cs', 'assist');
            }
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
        var checkConsistency, clearAllCells, clearCell, cloneCell, convertCellToCode, convertCellToHeading, convertCellToMarkdown, convertCellToRaw, copyCell, createCell, createMenu, createMenuHeader, createMenuItem, createNotebook, createTool, cutCell, deleteCell, deserialize, displayAbout, displayDocumentation, displayKeyboardShortcuts, duplicateNotebook, editModeKeyboardShortcuts, editModeKeyboardShortcutsHelp, editTitle, executeCommand, goToUrl, initialize, insertAbove, insertBelow, insertCell, insertCellAbove, insertCellAboveAndRun, insertCellBelow, insertCellBelowAndRun, insertNewCellAbove, insertNewCellBelow, menuDivider, mergeCellAbove, mergeCellBelow, moveCellDown, moveCellUp, normalModeKeyboardShortcuts, normalModeKeyboardShortcutsHelp, notImplemented, pasteCellAbove, pasteCellBelow, pasteCellandReplace, printPreview, removeCell, runAllCells, runCell, runCellAndInsertBelow, runCellAndSelectBelow, saveNotebook, saveTitle, selectCell, selectNextCell, selectPreviousCell, serialize, setupKeyboardHandling, showBrowser, showClipboard, showHelp, showOutline, splitCell, startTour, switchToCommandMode, switchToEditMode, switchToPresentationMode, toKeyboardHelp, toggleAllInputs, toggleAllOutputs, toggleInput, toggleOutput, toggleSidebar, undoLastDelete, _about, _areInputsHidden, _areOutputsHidden, _cells, _clipboardCell, _createdDate, _id, _isEditingTitle, _isSidebarHidden, _lastDeletedCell, _menus, _modifiedDate, _selectedCell, _selectedCellIndex, _sidebar, _status, _title, _toolbar;
        _id = Flow.Dataflow.signal('');
        _title = Flow.Dataflow.signal('Untitled Flow');
        _createdDate = Flow.Dataflow.signal(new Date());
        _modifiedDate = Flow.Dataflow.signal(new Date());
        _isEditingTitle = Flow.Dataflow.signal(false);
        editTitle = function () {
            return _isEditingTitle(true);
        };
        saveTitle = function () {
            return _isEditingTitle(false);
        };
        _cells = Flow.Dataflow.signals([]);
        _selectedCell = null;
        _selectedCellIndex = -1;
        _clipboardCell = null;
        _lastDeletedCell = null;
        _areInputsHidden = Flow.Dataflow.signal(false);
        _areOutputsHidden = Flow.Dataflow.signal(false);
        _isSidebarHidden = Flow.Dataflow.signal(false);
        _status = Flow.Status(_);
        _sidebar = Flow.Sidebar(_, _cells);
        _about = Flow.About(_);
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
                title: _title(),
                cells: cells,
                createdDate: _createdDate().getTime(),
                modifiedDate: new Date().getTime()
            };
        };
        deserialize = function (id, doc) {
            var cell, cells, _i, _len, _ref;
            _id(id);
            _title(doc.title);
            _createdDate(new Date(doc.createdDate));
            _modifiedDate(new Date(doc.modifiedDate));
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
            _ref = _cells();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                cell = _ref[_i];
                if (!cell.isCode()) {
                    cell.execute();
                }
            }
            selectCell(lodash.head(cells));
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
        selectCell = function (target, scrollIntoView) {
            if (scrollIntoView == null) {
                scrollIntoView = true;
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
                lodash.defer(_selectedCell.scrollIntoView);
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
        saveNotebook = function () {
            return _.storeNotebook(_id(), serialize(), function (error, id) {
                if (error) {
                    return console.debug(error);
                } else {
                    return _id(id);
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
            return $('#keyboardShortcutsDialog').modal();
        };
        displayDocumentation = function () {
            var hash, hashEntry;
            hash = Flow.Version ? (hashEntry = lodash.find(Flow.Version, function (entry) {
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
        showHelp = function () {
            _isSidebarHidden(false);
            return _.showHelp();
        };
        createNotebook = function () {
            var currentTime;
            currentTime = new Date().getTime();
            return deserialize(null, {
                title: 'Untitled Flow',
                cells: [{
                        type: 'cs',
                        input: ''
                    }],
                createdDate: currentTime,
                modifiedDate: currentTime
            });
        };
        duplicateNotebook = function () {
            var doc;
            doc = serialize();
            doc.title = 'Copy of ' + doc.title;
            doc.createdDate = doc.modifiedDate;
            deserialize(null, doc);
            return saveNotebook();
        };
        goToUrl = function (url) {
            return function () {
                return window.open(url, '_blank');
            };
        };
        notImplemented = function () {
        };
        printPreview = notImplemented;
        pasteCellandReplace = notImplemented;
        mergeCellAbove = notImplemented;
        switchToPresentationMode = notImplemented;
        runAllCells = notImplemented;
        clearCell = notImplemented;
        clearAllCells = notImplemented;
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
                createMenuItem('Save', saveNotebook),
                menuDivider,
                createMenuItem('Duplicate', duplicateNotebook),
                menuDivider,
                createMenuItem('Print Preview', printPreview, true)
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
                createMenuItem('Files', showBrowser),
                createMenuItem('Clipboard', showClipboard),
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
                createMenuItem('Run All', runAllCells, true),
                menuDivider,
                createMenuItem('Clear Cell', clearCell, true),
                menuDivider,
                createMenuItem('Clear All', clearAllCells, true)
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
                createMenuHeader('Advanced Debugging'),
                createMenuItem('Stack Trace', executeCommand('getStackTrace')),
                createMenuItem('Profiler', executeCommand('getProfile depth: 10')),
                createMenuItem('Timeline', executeCommand('getTimeline'))
            ]),
            createMenu('Help', [
                createMenuItem('Tour', startTour, true),
                createMenuItem('Contents', showHelp),
                createMenuItem('Keyboard Shortcuts', displayKeyboardShortcuts),
                menuDivider,
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
            [createTool('save', 'Save', saveNotebook)],
            [
                createTool('plus', 'Insert Cell Below', insertNewCellBelow),
                createTool('arrow-up', 'Move Cell Up', moveCellUp),
                createTool('arrow-down', 'Move Cell Down', moveCellDown)
            ],
            [
                createTool('cut', 'Cut Cell', cutCell),
                createTool('copy', 'Copy Cell', copyCell),
                createTool('paste', 'Paste Cell Below', pasteCellBelow)
            ],
            [createTool('play', 'Run', runCell)]
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
            Flow.Dataflow.link(_.loadNotebook, deserialize);
            Flow.Dataflow.link(_.selectCell, selectCell);
            Flow.Dataflow.link(_.insertAndExecuteCell, function (type, input) {
                return lodash.defer(insertCellBelowAndRun, type, input);
            });
            return Flow.Dataflow.link(_.insertCell, function (type, input) {
                return lodash.defer(insertCellBelow, type, input);
            });
        };
        Flow.Dataflow.link(_.ready, initialize);
        return {
            title: _title,
            isEditingTitle: _isEditingTitle,
            editTitle: editTitle,
            saveTitle: saveTitle,
            menus: _menus,
            sidebar: _sidebar,
            status: _status,
            toolbar: _toolbar,
            cells: _cells,
            areInputsHidden: _areInputsHidden,
            areOutputsHidden: _areOutputsHidden,
            isSidebarHidden: _isSidebarHidden,
            shortcutsHelp: {
                normalMode: normalModeKeyboardShortcutsHelp,
                editMode: editModeKeyboardShortcutsHelp
            },
            about: _about,
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
    Flow.ObjectBrowser = function (key, object) {
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
            console.debug(category, type, data);
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
    Flow.ApplicationContext = function (_) {
        _.ready = Flow.Dataflow.slots();
        _.status = Flow.Dataflow.slot();
        _.selectCell = Flow.Dataflow.slot();
        _.insertCell = Flow.Dataflow.slot();
        _.insertAndExecuteCell = Flow.Dataflow.slot();
        _.showHelp = Flow.Dataflow.slot();
        _.showOutline = Flow.Dataflow.slot();
        _.showBrowser = Flow.Dataflow.slot();
        _.showClipboard = Flow.Dataflow.slot();
        _.saveClip = Flow.Dataflow.slot();
        _.loadNotebook = Flow.Dataflow.slot();
        return _.storeNotebook = Flow.Dataflow.slot();
    };
}.call(this));
(function () {
    Flow.Application = function (_, routines) {
        var _notebook, _renderers, _routines, _sandbox;
        Flow.ApplicationContext(_);
        _routines = routines(_);
        _sandbox = Flow.Sandbox(_, _routines);
        _renderers = Flow.Renderers(_, _sandbox);
        _notebook = Flow.Notebook(_, _renderers);
        return {
            context: _,
            sandbox: _sandbox,
            view: _notebook
        };
    };
}.call(this));
(function () {
    var createBuffer, iterate, pipe, renderable, _applicate, _async, _find, _find$2, _find$3, _fork, _get, _isFuture, _join, _noop, __slice = [].slice;
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
    renderable = function () {
        var args, f, ft, render, _i;
        f = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), render = arguments[_i++];
        ft = _fork(f, args);
        ft.render = render;
        return ft;
    };
    _fork = function (f, args) {
        var self;
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
                        _results.push([error]);
                    } else {
                        _results.push([
                            null,
                            result
                        ]);
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
        renderable: renderable,
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
        Date: formatDate
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
    var compile, _templateCache, __slice = [].slice;
    compile = function (template, type) {
        var attrs, beginTag, classes, closeTag, id, index, name, tmpl, _ref;
        if (0 <= (index = template.indexOf(' '))) {
            tmpl = template.substr(0, index);
            attrs = template.substr(index);
        } else {
            tmpl = template;
        }
        _ref = tmpl.split(/\.+/g), name = _ref[0], classes = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
        if (0 === name.indexOf('#')) {
            id = name.substr(1);
            name = 'div';
        }
        if (name === '') {
            name = 'div';
        }
        beginTag = '<' + name;
        if (id) {
            beginTag += ' id=\'' + id + '\'';
        }
        if (classes.length) {
            beginTag += ' class=\'' + classes.join(' ') + '\'';
        }
        if (attrs) {
            beginTag += attrs;
        }
        beginTag += '>';
        closeTag = '</' + name + '>';
        if (type === '=') {
            return function (content) {
                return beginTag + (content !== null && content !== void 0 ? content : '') + closeTag;
            };
        } else if (type === '+') {
            return function (content, arg0) {
                var tag;
                tag = beginTag.replace('{0}', arg0);
                return tag + content + closeTag;
            };
        } else {
            return function (contents) {
                return beginTag + contents.join('') + closeTag;
            };
        }
    };
    _templateCache = {};
    Flow.HTML = {
        template: function () {
            var cached, template, templates, type, _i, _len, _results;
            templates = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            _results = [];
            for (_i = 0, _len = templates.length; _i < _len; _i++) {
                template = templates[_i];
                if (cached = _templateCache[template]) {
                    _results.push(cached);
                } else {
                    type = template.charAt(0);
                    if (type === '=' || type === '+') {
                        _results.push(_templateCache[template] = compile(template.substr(1), type));
                    } else {
                        _results.push(_templateCache[template] = compile(template));
                    }
                }
            }
            return _results;
        },
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
                arg.scrollIntoView = function () {
                    var height, position, top;
                    position = $viewport.scrollTop();
                    top = $el.position().top + position;
                    height = $viewport.height();
                    if (top - 20 < position || top + 20 > position + height) {
                        return $viewport.animate({ scrollTop: top }, 'fast');
                    }
                };
            }
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
}.call(this));
(function () {
    var keyOf, list, purge, purgeAll, read, write, _ls;
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
        var i, key, _i, _len;
        lodash.keys = function () {
            var _i, _ref, _results;
            _results = [];
            for (i = _i = 0, _ref = _ls.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                _results.push(_ls.key(i));
            }
            return _results;
        }();
        for (_i = 0, _len = lodash.keys.length; _i < _len; _i++) {
            key = lodash.keys[_i];
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
                return lodash.head(arra.splice(index, 1));
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
    var describeCount, fromNow;
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
    Flow.Util = {
        describeCount: describeCount,
        fromNow: fromNow
    };
}.call(this));
(function () {
    H2O.ApplicationContext = function (_) {
        _.requestGet = Flow.Dataflow.slot();
        _.requestPost = Flow.Dataflow.slot();
        _.requestFileGlob = Flow.Dataflow.slot();
        _.requestCreateFrame = Flow.Dataflow.slot();
        _.requestImportFile = Flow.Dataflow.slot();
        _.requestImportFiles = Flow.Dataflow.slot();
        _.requestParseFiles = Flow.Dataflow.slot();
        _.requestInspect = Flow.Dataflow.slot();
        _.requestParseSetup = Flow.Dataflow.slot();
        _.requestFrames = Flow.Dataflow.slot();
        _.requestFrame = Flow.Dataflow.slot();
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
        _.requestJobs = Flow.Dataflow.slot();
        _.requestJob = Flow.Dataflow.slot();
        _.requestObjects = Flow.Dataflow.slot();
        _.requestObject = Flow.Dataflow.slot();
        _.requestDeleteObject = Flow.Dataflow.slot();
        _.requestPutObject = Flow.Dataflow.slot();
        _.requestCloud = Flow.Dataflow.slot();
        _.requestTimeline = Flow.Dataflow.slot();
        _.requestProfile = Flow.Dataflow.slot();
        _.requestStackTrace = Flow.Dataflow.slot();
        _.requestRemoveAll = Flow.Dataflow.slot();
        _.requestLogFile = Flow.Dataflow.slot();
        _.requestAbout = Flow.Dataflow.slot();
        _.inspect = Flow.Dataflow.slot();
        return _.plot = Flow.Dataflow.slot();
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
        var composePath, doGet, doPost, encodeArrayForPost, encodeObject, encodeObjectForPost, http, mapWithKey, patchUpModels, requestAbout, requestCloud, requestColumnSummary, requestCreateFrame, requestDeleteObject, requestFileGlob, requestFrame, requestFrames, requestImportFile, requestImportFiles, requestInspect, requestJob, requestJobs, requestLogFile, requestModel, requestModelBuild, requestModelBuilder, requestModelBuilders, requestModelInputValidation, requestModels, requestObject, requestObjects, requestParseFiles, requestParseSetup, requestPredict, requestPrediction, requestPredictions, requestProfile, requestPutObject, requestRemoveAll, requestStackTrace, requestTimeline, requestWithOpts;
        http = function (path, opts, go) {
            var req;
            _.status('server', 'request', path);
            req = opts ? $.post(path, opts) : $.getJSON(path);
            req.done(function (data, status, xhr) {
                var error;
                _.status('server', 'response', path);
                try {
                    return go(null, data);
                } catch (_error) {
                    error = _error;
                    return go(new Flow.Error(opts ? 'Error processing POST ' + path : 'Error processing GET ' + path, error));
                }
            });
            return req.fail(function (xhr, status, error) {
                var cause, response, serverError;
                _.status('server', 'error', path);
                response = xhr.responseJSON;
                cause = (response != null ? response.exception_msg : void 0) ? (serverError = new Flow.Error(response.exception_msg), serverError.stack = '' + response.dev_msg + ' (' + response.exception_type + ')' + '\n  ' + response.stacktrace.join('\n  '), serverError) : (error != null ? error.message : void 0) ? new Flow.Error(error.message) : status === 0 ? new Flow.Error('Could not connect to H2O') : new Flow.Error('Unknown error');
                return go(new Flow.Error(opts ? 'Error calling POST ' + path + ' with opts ' + JSON.stringify(opts) : 'Error calling GET ' + path, cause));
            });
        };
        doGet = function (path, go) {
            return http(path, null, go);
        };
        doPost = http;
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
            return '[' + lodash.map(array, function (element) {
                if (lodash.isNumber(element)) {
                    return element;
                } else {
                    return '"' + element + '"';
                }
            }).join(',') + ']';
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
        requestInspect = function (key, go) {
            var opts;
            opts = { key: encodeURIComponent(key) };
            return requestWithOpts('/1/Inspect.json', opts, go);
        };
        requestCreateFrame = function (opts, go) {
            return doPost('/2/CreateFrame.json', opts, go);
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
        requestParseSetup = function (sources, go) {
            var opts;
            opts = { srcs: encodeArrayForPost(sources) };
            return doPost('/2/ParseSetup.json', opts, go);
        };
        requestParseFiles = function (sourceKeys, destinationKey, parserType, separator, columnCount, useSingleQuotes, columnNames, deleteOnDone, checkHeader, go) {
            var opts;
            opts = {
                hex: destinationKey,
                srcs: encodeArrayForPost(sourceKeys),
                pType: parserType,
                sep: separator,
                ncols: columnCount,
                singleQuotes: useSingleQuotes,
                columnNames: encodeArrayForPost(columnNames),
                checkHeader: checkHeader,
                delete_on_done: deleteOnDone
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
            return doPost('/3/ModelBuilders.json/' + algo, encodeObjectForPost(parameters), go);
        };
        requestPredict = function (modelKey, frameKey, go) {
            return doPost('/3/Predictions.json/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), {}, function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, lodash.head(result.model_metrics));
                }
            });
        };
        requestPrediction = function (modelKey, frameKey, go) {
            return doPost('/3/Predictions.json/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), {}, function (error, result) {
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
                return doPost('/3/Predictions.json/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), {}, go);
            } else if (modelKey) {
                return doGet('/3/ModelMetrics.json/models/' + encodeURIComponent(modelKey), go);
            } else if (frameKey) {
                return doGet('/3/ModelMetrics.json/frames/' + encodeURIComponent(frameKey), go);
            } else {
                return doGet('/3/ModelMetrics.json', go);
            }
        };
        requestObjects = function (type, go) {
            return go(null, Flow.LocalStorage.list(type));
        };
        requestObject = function (type, id, go) {
            return go(null, Flow.LocalStorage.read(type, id));
        };
        requestDeleteObject = function (type, id, go) {
            return go(null, Flow.LocalStorage.purge(type, id));
        };
        requestPutObject = function (type, id, obj, go) {
            return go(null, Flow.LocalStorage.write(type, id, obj));
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
            return doGet('/3/RemoveAll.json', go);
        };
        requestLogFile = function (nodeIndex, go) {
            return doGet('/3/Logs.json/nodes/' + nodeIndex + '/files/default', go);
        };
        requestAbout = function (go) {
            return doGet('/3/About.json', go);
        };
        Flow.Dataflow.link(_.requestGet, doGet);
        Flow.Dataflow.link(_.requestPost, doPost);
        Flow.Dataflow.link(_.requestInspect, requestInspect);
        Flow.Dataflow.link(_.requestCreateFrame, requestCreateFrame);
        Flow.Dataflow.link(_.requestFrames, requestFrames);
        Flow.Dataflow.link(_.requestFrame, requestFrame);
        Flow.Dataflow.link(_.requestColumnSummary, requestColumnSummary);
        Flow.Dataflow.link(_.requestJobs, requestJobs);
        Flow.Dataflow.link(_.requestJob, requestJob);
        Flow.Dataflow.link(_.requestFileGlob, requestFileGlob);
        Flow.Dataflow.link(_.requestImportFiles, requestImportFiles);
        Flow.Dataflow.link(_.requestImportFile, requestImportFile);
        Flow.Dataflow.link(_.requestParseSetup, requestParseSetup);
        Flow.Dataflow.link(_.requestParseFiles, requestParseFiles);
        Flow.Dataflow.link(_.requestModels, requestModels);
        Flow.Dataflow.link(_.requestModel, requestModel);
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
        Flow.Dataflow.link(_.requestCloud, requestCloud);
        Flow.Dataflow.link(_.requestTimeline, requestTimeline);
        Flow.Dataflow.link(_.requestProfile, requestProfile);
        Flow.Dataflow.link(_.requestStackTrace, requestStackTrace);
        Flow.Dataflow.link(_.requestRemoveAll, requestRemoveAll);
        Flow.Dataflow.link(_.requestLogFile, requestLogFile);
        return Flow.Dataflow.link(_.requestAbout, requestAbout);
    };
}.call(this));
(function () {
    var computeFalsePositiveRate, computeTruePositiveRate, concatArrays, createArrays, createDataframe, createFactor, createList, createVector, formatConfusionMatrix, formulateGetPredictionsOrigin, lightning, parseFloats, parseInts, parseNaNs, parseNulls, repeatValues, toFrame, _assistance, __slice = [].slice;
    lightning = window.plot;
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
    parseInts = function (source) {
        var str, value, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = source.length; _i < _len; _i++) {
            str = source[_i];
            if (lodash.isNaN(value = parseInt(str, 10))) {
                _results.push(void 0);
            } else {
                _results.push(value);
            }
        }
        return _results;
    };
    parseFloats = function (source) {
        var str, value, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = source.length; _i < _len; _i++) {
            str = source[_i];
            if (lodash.isNaN(value = parseFloat(str))) {
                _results.push(void 0);
            } else {
                _results.push(value);
            }
        }
        return _results;
    };
    toFrame = function (table, metadata) {
        var column, data, i, size, vectors;
        size = table.data.length > 0 ? lodash.head(table.data).length : 0;
        vectors = function () {
            var _i, _len, _ref, _results;
            _ref = table.columns;
            _results = [];
            for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                column = _ref[i];
                data = table.data[i];
                switch (column.type) {
                case 'byte':
                case 'short':
                case 'int':
                case 'long':
                    _results.push(createVector(column.name, Flow.TNumber, parseInts(data)));
                    break;
                case 'float':
                case 'double':
                    _results.push(createVector(column.name, Flow.TNumber, parseFloats(data)));
                    break;
                case 'string':
                    _results.push(createFactor(column.name, Flow.TString, data));
                    break;
                default:
                    _results.push(createList(column.name, data));
                }
            }
            return _results;
        }();
        return createDataframe(table.name, vectors, lodash.range(size), null, metadata);
    };
    createArrays = function (length) {
        var i, _i, _results;
        _results = [];
        for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
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
        _ref2 = Flow.HTML.template('table.flow-matrix', 'tbody', 'tr', '=td'), table = _ref2[0], tbody = _ref2[1], tr = _ref2[2], td = _ref2[3];
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
        var assist, buildModel, createFrame, dump, dumpFuture, extendCloud, extendColumnSummary, extendDeepLearningModel, extendFrame, extendFrames, extendGBMModel, extendGLMModel, extendJob, extendKMeansModel, extendLogFile, extendModel, extendModels, extendPrediction, extendPredictions, extendProfile, extendStackTrace, extendTimeline, f, flow_, form, getCloud, getColumnSummary, getFrame, getFrames, getJob, getJobs, getLogFile, getModel, getModels, getPrediction, getPredictions, getProfile, getStackTrace, getTimeline, grid, gui, importFiles, inspect, inspect$1, inspect$2, inspectBinomialMetrics, inspectBinomialPrediction, inspectBinomialPredictions, inspectBinomialScores, inspectFrameColumns, inspectFrameData, inspectGBMModelOutput, inspectKMeansModelOutput, inspectKmeansModelClusterMeans, inspectKmeansModelClusters, inspectModelParameters, inspectMultimodelParameters, inspectRegressionPrediction, inspect_, loadScript, name, parseRaw, plot, predict, proceed, read, render_, renderable, requestCloud, requestColumnSummary, requestCreateFrame, requestFrame, requestFrames, requestLogFile, requestModel, requestModels, requestModelsByKeys, requestPredict, requestPrediction, requestPredictions, requestPredicts, requestProfile, requestStackTrace, requestTimeline, setupParse, _apply, _async, _call, _fork, _get, _isFuture, _join, _plot, _ref;
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
        renderable = Flow.Async.renderable;
        form = function (controls, go) {
            return go(null, Flow.Dataflow.signals(controls || []));
        };
        gui = function (controls) {
            return Flow.Async.renderable(form, controls, function (form, go) {
                return go(null, Flow.Form(_, form));
            });
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
                    render_(inspections, function () {
                        return H2O.InspectsOutput(_, inspections);
                    });
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
            render_(inspection, function () {
                return H2O.InspectOutput(_, inspection);
            });
            return inspection;
        };
        _plot = function (plot, go) {
            return plot(function (error, vis) {
                if (error) {
                    return go(new Flow.Error('Error rendering vis.', error));
                } else {
                    return go(null, vis);
                }
            });
        };
        plot = function (f) {
            if (_isFuture(f)) {
                return _fork(proceed, H2O.PlotInput, f);
            } else {
                return renderable(_plot, f(lightning), function (plot, go) {
                    return go(null, H2O.PlotOutput(_, plot.element));
                });
            }
        };
        grid = function (f) {
            return plot(function (g) {
                return g(g.table(), g.from(f));
            });
        };
        extendCloud = function (cloud) {
            return render_(cloud, function () {
                return H2O.CloudOutput(_, cloud);
            });
        };
        extendTimeline = function (timeline) {
            return render_(timeline, function () {
                return H2O.TimelineOutput(_, timeline);
            });
        };
        extendStackTrace = function (stackTrace) {
            return render_(stackTrace, function () {
                return H2O.StackTraceOutput(_, stackTrace);
            });
        };
        extendLogFile = function (nodeIndex, logFile) {
            return render_(logFile, function () {
                return H2O.LogFileOutput(_, nodeIndex, logFile);
            });
        };
        extendProfile = function (profile) {
            return render_(profile, function () {
                return H2O.ProfileOutput(_, profile);
            });
        };
        extendFrames = function (frames) {
            render_(frames, function () {
                return H2O.FramesOutput(_, frames);
            });
            return frames;
        };
        inspectMultimodelParameters = function (models) {
            return function () {
                var data, i, leader, model, modelKeys, value, vectors;
                leader = lodash.head(models);
                vectors = function () {
                    var _i, _ref1, _results;
                    _results = [];
                    for (i = _i = 0, _ref1 = leader.parameters.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
                        data = function () {
                            var _j, _len, _results1;
                            _results1 = [];
                            for (_j = 0, _len = models.length; _j < _len; _j++) {
                                model = models[_j];
                                value = model.parameters[i].actual_value;
                                if (value != null) {
                                    _results1.push(value);
                                } else {
                                    _results1.push(void 0);
                                }
                            }
                            return _results1;
                        }();
                        switch (parameter.type) {
                        case 'enum':
                        case 'Frame':
                        case 'string':
                        case 'string[]':
                        case 'byte[]':
                        case 'short[]':
                        case 'int[]':
                        case 'long[]':
                        case 'float[]':
                        case 'double[]':
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
                        _results.push(model.key);
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
                var attrs, data, i, parameter, parameters, type, vectors;
                parameters = model.parameters;
                attrs = [
                    [
                        'label',
                        Flow.TString
                    ],
                    [
                        'type',
                        Flow.TString
                    ],
                    [
                        'level',
                        Flow.TString
                    ],
                    [
                        'actual_value',
                        Flow.TObject
                    ],
                    [
                        'default_value',
                        Flow.TObject
                    ]
                ];
                vectors = function () {
                    var _i, _j, _len, _len1, _ref1, _results;
                    _results = [];
                    for (_i = 0, _len = attrs.length; _i < _len; _i++) {
                        _ref1 = attrs[_i], name = _ref1[0], type = _ref1[1];
                        data = new Array(parameters.length);
                        for (i = _j = 0, _len1 = parameters.length; _j < _len1; i = ++_j) {
                            parameter = parameters[i];
                            data[i] = parameter[name];
                        }
                        switch (type) {
                        case Flow.TString:
                            _results.push(createFactor(name, type, data));
                            break;
                        case Flow.TObject:
                            _results.push(createList(name, data, Flow.Prelude.stringify));
                            break;
                        default:
                            _results.push(void 0);
                        }
                    }
                    return _results;
                }();
                return createDataframe('parameters', vectors, lodash.range(parameters.length), null, {
                    description: 'Parameters for model \'' + model.key.name + '\'',
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
                return toFrame(model.output.centers, {
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
            return inspect_(model, { parameters: inspectModelParameters(model) });
        };
        extendGBMModel = function (model) {
            return inspect_(model, {
                parameters: inspectModelParameters(model),
                output: inspectGBMModelOutput(model)
            });
        };
        extendGLMModel = function (model) {
            return inspect_(model, { parameters: inspectModelParameters(model) });
        };
        extendJob = function (job) {
            return render_(job, function () {
                return H2O.JobOutput(_, job);
            });
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
                extendGBMModel(model);
                break;
            case 'glm':
                extendGLMModel(model);
            }
            return render_(model, function () {
                return H2O.ModelOutput(_, model);
            });
        };
        extendModels = function (models) {
            var algos, model, _i, _len;
            for (_i = 0, _len = models.length; _i < _len; _i++) {
                model = models[_i];
                extendModel(model);
            }
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
                inspect_(models, { parameters: inspectMultimodelParameters(models) });
            }
            return render_(models, function () {
                return H2O.ModelsOutput(_, models);
            });
        };
        read = function (value) {
            if (value === 'NaN') {
                return null;
            } else {
                return value;
            }
        };
        inspectRegressionPrediction = function (prediction) {
            return function () {
                var frame, model, predictions, vectors;
                frame = prediction.frame, model = prediction.model, predictions = prediction.predictions;
                vectors = [
                    createFactor('key', Flow.TString, [model.name]),
                    createFactor('frame', Flow.TString, [frame.name]),
                    createFactor('model_category', Flow.TString, [prediction.model_category]),
                    createVector('duration_in_ms', Flow.TString, [prediction.duration_in_ms]),
                    createVector('scoring_time', Flow.TString, [prediction.scoring_time])
                ];
                return createDataframe('prediction', vectors, lodash.range(1), null, {
                    description: 'Prediction output for model \'' + model.name + '\' on frame \'' + frame.name + '\'',
                    origin: 'getPrediction ' + Flow.Prelude.stringify(model.name) + ', ' + Flow.Prelude.stringify(frame.name)
                });
            };
        };
        inspectBinomialPrediction = function (prediction) {
            return function () {
                var auc, frame, model, vectors;
                frame = prediction.frame, model = prediction.model, auc = prediction.auc;
                vectors = [
                    createFactor('key', Flow.TString, [model.name]),
                    createFactor('frame', Flow.TString, [frame.name]),
                    createFactor('model_category', Flow.TString, [prediction.model_category]),
                    createVector('duration_in_ms', Flow.TNumber, [prediction.duration_in_ms]),
                    createVector('scoring_time', Flow.TNumber, [prediction.scoring_time]),
                    createVector('AUC', Flow.TNumber, [auc.AUC]),
                    createVector('Gini', Flow.TNumber, [auc.Gini]),
                    createFactor('threshold_criterion', Flow.TString, [auc.threshold_criterion])
                ];
                return createDataframe('prediction', vectors, lodash.range(1), null, {
                    description: 'Prediction output for model \'' + model.name + '\' on frame \'' + frame.name + '\'',
                    origin: 'getPrediction ' + Flow.Prelude.stringify(model.name) + ', ' + Flow.Prelude.stringify(frame.name)
                });
            };
        };
        inspectBinomialMetrics = function (opts, predictions) {
            return function () {
                var prediction, vectors;
                vectors = [
                    createFactor('criteria', Flow.TString, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.auc.threshold_criteria);
                        }
                        return _results;
                    }())),
                    createVector('threshold', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.threshold_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('F1', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.F1_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('F2', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.F2_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('F0point5', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.F0point5_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('accuracy', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.accuracy_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('error', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.error_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('precision', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.precision_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('recall', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.recall_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('specificity', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.specificity_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('mcc', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.max_per_class_error_for_criteria));
                        }
                        return _results;
                    }())),
                    createVector('max_per_class_error', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.max_per_class_error));
                        }
                        return _results;
                    }())),
                    createList('confusion_matrix', concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.auc.confusion_matrix_for_criteria);
                        }
                        return _results;
                    }()), formatConfusionMatrix),
                    createVector('TPR', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(lodash.map(prediction.auc.confusion_matrix_for_criteria, computeTruePositiveRate));
                        }
                        return _results;
                    }())),
                    createVector('FPR', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(lodash.map(prediction.auc.confusion_matrix_for_criteria, computeFalsePositiveRate));
                        }
                        return _results;
                    }())),
                    createFactor('key', Flow.TString, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(repeatValues(prediction.auc.threshold_criteria.length, prediction.model.name + ' on ' + prediction.frame.name));
                        }
                        return _results;
                    }())),
                    createFactor('model', Flow.TString, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(repeatValues(prediction.auc.threshold_criteria.length, prediction.model.name));
                        }
                        return _results;
                    }())),
                    createFactor('frame', Flow.TString, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(repeatValues(prediction.auc.threshold_criteria.length, prediction.frame.name));
                        }
                        return _results;
                    }()))
                ];
                return createDataframe('metrics', vectors, lodash.range(lodash.head(vectors).count()), null, {
                    description: 'Metrics for the selected predictions',
                    origin: formulateGetPredictionsOrigin(opts),
                    plot: 'plot inspect \'metrics\', ' + formulateGetPredictionsOrigin(opts)
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
            render_(predictions, function () {
                return H2O.PredictsOutput(_, opts, predictions);
            });
            if (lodash.every(predictions, function (prediction) {
                    return prediction.model_category === 'Binomial';
                })) {
                return inspect_(predictions, {
                    predictions: inspectBinomialPredictions(opts, predictions),
                    metrics: inspectBinomialMetrics(opts, predictions),
                    scores: inspectBinomialScores(opts, predictions)
                });
            } else {
                return inspect_(predictions, { predictions: inspectBinomialPredictions(opts, predictions) });
            }
        };
        inspectBinomialScores = function (opts, predictions) {
            return function () {
                var prediction, vectors;
                vectors = [
                    createVector('thresholds', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.thresholds));
                        }
                        return _results;
                    }())),
                    createVector('F1', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.F1));
                        }
                        return _results;
                    }())),
                    createVector('F2', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.F2));
                        }
                        return _results;
                    }())),
                    createVector('F0point5', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.F0point5));
                        }
                        return _results;
                    }())),
                    createVector('accuracy', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.accuracy));
                        }
                        return _results;
                    }())),
                    createVector('errorr', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.errorr));
                        }
                        return _results;
                    }())),
                    createVector('precision', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.precision));
                        }
                        return _results;
                    }())),
                    createVector('recall', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.recall));
                        }
                        return _results;
                    }())),
                    createVector('specificity', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.specificity));
                        }
                        return _results;
                    }())),
                    createVector('mcc', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.mcc));
                        }
                        return _results;
                    }())),
                    createVector('max_per_class_error', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(parseNaNs(prediction.auc.max_per_class_error));
                        }
                        return _results;
                    }())),
                    createList('confusion_matrices', concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(prediction.auc.confusion_matrices);
                        }
                        return _results;
                    }()), formatConfusionMatrix),
                    createVector('TPR', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(lodash.map(prediction.auc.confusion_matrices, computeTruePositiveRate));
                        }
                        return _results;
                    }())),
                    createVector('FPR', Flow.TNumber, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(lodash.map(prediction.auc.confusion_matrices, computeFalsePositiveRate));
                        }
                        return _results;
                    }())),
                    createFactor('key', Flow.TString, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(repeatValues(prediction.auc.thresholds.length, prediction.model.name + ' on ' + prediction.frame.name));
                        }
                        return _results;
                    }())),
                    createFactor('model', Flow.TString, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(repeatValues(prediction.auc.thresholds.length, prediction.model.name));
                        }
                        return _results;
                    }())),
                    createFactor('frame', Flow.TString, concatArrays(function () {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                            prediction = predictions[_i];
                            _results.push(repeatValues(prediction.auc.thresholds.length, prediction.frame.name));
                        }
                        return _results;
                    }()))
                ];
                return createDataframe('scores', vectors, lodash.range(lodash.head(vectors).count()), null, {
                    description: 'Scores for the selected predictions',
                    origin: formulateGetPredictionsOrigin(opts),
                    plot: 'plot inspect \'scores\', ' + formulateGetPredictionsOrigin(opts)
                });
            };
        };
        extendPrediction = function (modelKey, frameKey, prediction) {
            render_(prediction, function () {
                return H2O.PredictOutput(_, prediction);
            });
            switch (prediction.model_category) {
            case 'Regression':
            case 'Multinomial':
                return inspect_(prediction, { prediction: inspectRegressionPrediction(prediction) });
            default:
                return inspect_(prediction, {
                    prediction: inspectBinomialPrediction(prediction),
                    scores: inspectBinomialScores({
                        model: modelKey,
                        frame: frameKey
                    }, [prediction]),
                    metrics: inspectBinomialMetrics({
                        model: modelKey,
                        frame: frameKey
                    }, [prediction])
                });
            }
        };
        inspectFrameColumns = function (tableLabel, frameKey, frame, frameColumns) {
            return function () {
                var attrs, column, domain, vectors;
                attrs = [
                    'label',
                    'missing',
                    'zeros',
                    'pinfs',
                    'ninfs',
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
                    origin: 'getFrame ' + Flow.Prelude.stringify(frameKey),
                    plot: 'plot inspect \'' + tableLabel + '\', getFrame ' + Flow.Prelude.stringify(frameKey)
                });
            };
        };
        inspectFrameData = function (frameKey, frame) {
            return function () {
                var column, domain, frameColumns, index, vectors;
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
                            _results.push(createList(column.label, parseNulls(column.str_data)));
                            break;
                        default:
                            _results.push(createList(column.label, parseNulls(column.data)));
                        }
                    }
                    return _results;
                }();
                return createDataframe('data', vectors, lodash.range(frame.len - frame.off), null, {
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
            return render_(frame, function () {
                return H2O.FrameOutput(_, frame);
            });
        };
        extendColumnSummary = function (frameKey, frame, columnName) {
            var column, inspectCharacteristics, inspectDistribution, inspectDomain, inspectPercentiles, inspectSummary, inspections, rowCount;
            column = lodash.head(frame.columns);
            rowCount = frame.rows;
            inspectPercentiles = function () {
                var vectors;
                vectors = [
                    createVector('percentile', Flow.TNumber, frame.default_pctiles),
                    createVector('value', Flow.TNumber, column.pctiles)
                ];
                return createDataframe('percentiles', vectors, lodash.range(frame.default_pctiles.length), null, {
                    description: 'Percentiles for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName)
                });
            };
            inspectDistribution = function () {
                var base, binCount, binIndex, bins, count, countData, i, interval, intervalData, m, minBinCount, n, rows, stride, vectors, width, widthData, _i, _j, _k, _len;
                minBinCount = 32;
                base = column.base, stride = column.stride, bins = column.bins;
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
                    plot: 'plot (g) -> g(\n  g.rect(\n    g.position \'interval\', \'count\'\n    g.width g.value 1\n  )\n  g.from inspect \'distribution\', getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName) + '\n)'
                });
            };
            inspectCharacteristics = function () {
                var characteristicData, count, countData, missing, ninfs, other, percentData, pinfs, vectors, zeros;
                missing = column.missing, zeros = column.zeros, pinfs = column.pinfs, ninfs = column.ninfs;
                other = rowCount - missing - zeros - pinfs - ninfs;
                characteristicData = [
                    'Missing',
                    '-Inf',
                    'Zero',
                    '+Inf',
                    'Other'
                ];
                countData = [
                    missing,
                    ninfs,
                    zeros,
                    pinfs,
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
                    origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName)
                });
            };
            inspectSummary = function () {
                var defaultPercentiles, maximum, mean, minimum, outliers, percentiles, q1, q2, q3, vectors;
                defaultPercentiles = frame.default_pctiles;
                percentiles = column.pctiles;
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
                    plot: 'plot (g) -> g(\n  g.schema(\n    g.position \'min\', \'q1\', \'q2\', \'q3\', \'max\', \'column\'\n  )\n  g.from inspect \'summary\', getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName) + '\n)'
                });
            };
            inspectDomain = function () {
                var counts, i, labels, level, levels, percents, sortedLevels, vectors, _i, _len, _ref1;
                levels = lodash.map(column.bins, function (count, index) {
                    return {
                        count: count,
                        index: index
                    };
                });
                sortedLevels = lodash.sortBy(levels, function (level) {
                    return -level.count;
                });
                _ref1 = createArrays(sortedLevels.length), labels = _ref1[0], counts = _ref1[1], percents = _ref1[2];
                for (i = _i = 0, _len = sortedLevels.length; _i < _len; i = ++_i) {
                    level = sortedLevels[i];
                    labels[i] = column.domain[level.index];
                    counts[i] = level.count;
                    percents[i] = 100 * level.count / rowCount;
                }
                vectors = [
                    createFactor('label', Flow.TString, labels),
                    createVector('count', Flow.TNumber, counts),
                    createVector('percent', Flow.TNumber, percents)
                ];
                return createDataframe('domain', vectors, lodash.range(sortedLevels.length), null, {
                    description: 'Domain for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName),
                    plot: 'plot (g) -> g(\n  g.rect(\n    g.position \'count\', \'label\'\n  )\n  g.from inspect \'domain\', getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName) + '\n)'
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
            return render_(frame, function () {
                return go(null, H2O.ColumnSummaryOutput(_, frameKey, frame, columnName));
            });
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
        createFrame = function (opts) {
            if (opts) {
                return _fork(requestCreateFrame, opts);
            } else {
                return assist(createFrame);
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
        getJobs = function () {
            return renderable(_.requestJobs, function (jobs, go) {
                return go(null, H2O.JobsOutput(_, jobs));
            });
        };
        getJob = function (arg) {
            switch (Flow.Prelude.typeOf(arg)) {
            case 'String':
                return renderable(_.requestJob, arg, function (job, go) {
                    return go(null, H2O.JobOutput(_, job));
                });
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
        importFiles = function (paths) {
            switch (Flow.Prelude.typeOf(paths)) {
            case 'Array':
                return renderable(_.requestImportFiles, paths, function (importResults, go) {
                    return go(null, H2O.ImportFilesOutput(_, importResults));
                });
            default:
                return assist(importFiles);
            }
        };
        setupParse = function (sourceKeys) {
            switch (Flow.Prelude.typeOf(sourceKeys)) {
            case 'Array':
                return renderable(_.requestParseSetup, sourceKeys, function (parseSetupResults, go) {
                    return go(null, H2O.SetupParseOutput(_, parseSetupResults));
                });
            default:
                return assist(setupParse);
            }
        };
        parseRaw = function (opts) {
            var checkHeader, columnCount, columnNames, deleteOnDone, destinationKey, parserType, separator, sourceKeys, useSingleQuotes;
            sourceKeys = opts.srcs;
            destinationKey = opts.hex;
            parserType = opts.pType;
            separator = opts.sep;
            columnCount = opts.ncols;
            useSingleQuotes = opts.singleQuotes;
            columnNames = opts.columnNames;
            deleteOnDone = opts.delete_on_done;
            checkHeader = opts.checkHeader;
            return renderable(_.requestParseFiles, sourceKeys, destinationKey, parserType, separator, columnCount, useSingleQuotes, columnNames, deleteOnDone, checkHeader, function (parseResult, go) {
                return go(null, H2O.ParseOutput(_, parseResult));
            });
        };
        buildModel = function (algo, opts) {
            if (algo && opts && lodash.keys(opts).length > 1) {
                return renderable(_.requestModelBuild, algo, opts, function (result, go) {
                    var messages, validation;
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
                        return go(null, H2O.JobOutput(_, lodash.head(result.jobs)));
                    }
                });
            } else {
                return assist(buildModel, algo, opts);
            }
        };
        requestPredict = function (modelKey, frameKey, go) {
            return _.requestPredict(modelKey, frameKey, function (error, prediction) {
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
                return _fork(_.requestPredict, modelKey, frameKey);
            });
            return Flow.Async.join(futures, function (error, predictions) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendPredictions(opts, predictions));
                }
            });
        };
        predict = function (model, frame) {
            var frameKey, modelKey, opts, _i, _j, _len, _len1;
            if (model && frame) {
                if (lodash.isString(model) && lodash.isString(frame)) {
                    return _fork(requestPredict, model, frame);
                } else {
                    if (lodash.isString(model)) {
                        model = [model];
                    }
                    if (lodash.isString(frame)) {
                        frame = [frame];
                    }
                    opts = [];
                    for (_i = 0, _len = model.length; _i < _len; _i++) {
                        modelKey = model[_i];
                        for (_j = 0, _len1 = frame.length; _j < _len1; _j++) {
                            frameKey = frame[_j];
                            opts.push({
                                model: modelKey,
                                frame: frameKey
                            });
                        }
                    }
                    return _fork(requestPredicts, opts);
                }
            } else {
                return assist(predict, model, frame);
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
        getPrediction = function (modelKey, frameKey) {
            if (modelKey && frameKey) {
                return _fork(requestPrediction, modelKey, frameKey);
            } else {
                return assist(getPrediction, modelKey, frameKey);
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
        requestLogFile = function (nodeIndex, go) {
            return _.requestLogFile(nodeIndex, function (error, logFile) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, extendLogFile(nodeIndex, logFile));
                }
            });
        };
        getLogFile = function (nodeIndex) {
            if (nodeIndex == null) {
                nodeIndex = -1;
            }
            return _fork(requestLogFile, nodeIndex);
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
            console.debug(result);
            return go(null, render_(result || {}, function () {
                return Flow.ObjectBrowser('dump', result);
            }));
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
                default:
                    return _fork(proceed, H2O.NoAssist, []);
                }
            }
        };
        Flow.Dataflow.link(_.ready, function () {
            return Flow.Dataflow.link(_.inspect, inspect);
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
            parseRaw: parseRaw,
            createFrame: createFrame,
            getFrames: getFrames,
            getFrame: getFrame,
            getColumnSummary: getColumnSummary,
            buildModel: buildModel,
            getModels: getModels,
            getModel: getModel,
            predict: predict,
            getPrediction: getPrediction,
            getPredictions: getPredictions,
            getCloud: getCloud,
            getTimeline: getTimeline,
            getProfile: getProfile,
            getStackTrace: getStackTrace,
            getLogFile: getLogFile
        };
    };
}.call(this));
(function () {
    H2O.Assist = function (_, _items) {
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
    H2O.CloudOutput = function (_, _cloud) {
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
                node.h2o.node,
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
            _ref = Flow.HTML.template('.grid', 'table', '=thead', 'tbody', 'tr', '=th', '=td', '=i.fa.fa-check-circle.text-success', '=i.fa.fa-exclamation-circle.text-danger'), grid = _ref[0], table = _ref[1], thead = _ref[2], tbody = _ref[3], tr = _ref[4], th = _ref[5], td = _ref[6], success = _ref[7], danger = _ref[8];
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
                    _exception(Flow.Failure(new Flow.Error('Error fetching cloud status', error)));
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
    H2O.ColumnSummaryOutput = function (_, frameKey, frame, columnName) {
        var column, inspect, _characteristicsPlot, _characteristicsPlotConfig, _characteristicsTable;
        column = lodash.head(frame.columns);
        _characteristicsPlot = Flow.Dataflow.signal(null);
        _characteristicsTable = _.inspect('characteristics', frame);
        _characteristicsPlotConfig = {
            data: _characteristicsTable,
            type: 'interval',
            x: Flow.Plot.stack('count'),
            y: 'label'
        };
        Flow.Plot(_characteristicsPlotConfig, function (error, plot) {
            if (!error) {
                return _characteristicsPlot(plot);
            }
        });
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName));
        };
        return {
            label: column.label,
            characteristicsPlot: _characteristicsPlot,
            inspect: inspect,
            template: 'flow-column-summary-output'
        };
    };
}.call(this));
(function () {
    H2O.CreateFrameInput = function (_) {
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
    H2O.FrameOutput = function (_, _frame) {
        var createGrid, createModel, download, inspect, inspectData, predict, _grid;
        createGrid = function (data) {
            var action, el, grid, i, table, tbody, td, tdr, tds, th, thead, thr, ths, tr, trs, value, vector, vectorIndex, _ref;
            _ref = Flow.HTML.template('.grid', 'table', '=thead', 'tbody', 'tr', '=th', '=th.rt', '=td', '=td.rt', '+a data-action=\'summary\' data-index=\'{0}\' class=\'action\' href=\'#\''), grid = _ref[0], table = _ref[1], thead = _ref[2], tbody = _ref[3], tr = _ref[4], th = _ref[5], thr = _ref[6], td = _ref[7], tdr = _ref[8], action = _ref[9];
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
                        return _.insertAndExecuteCell('cs', 'inspect getColumnSummary ' + Flow.Prelude.stringify(_frame.key.name) + ', ' + Flow.Prelude.stringify(data.schema.label.valueAt(index)));
                    }
                }
            });
            return el;
        };
        createModel = function () {
            return _.insertAndExecuteCell('cs', 'assist buildModel, null, training_frame: ' + Flow.Prelude.stringify(_frame.key.name));
        };
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getFrame ' + Flow.Prelude.stringify(_frame.key.name));
        };
        inspectData = function () {
            return _.insertAndExecuteCell('cs', 'grid inspect \'data\', getFrame ' + Flow.Prelude.stringify(_frame.key.name));
        };
        predict = function () {
            return _.insertAndExecuteCell('cs', 'predict null, ' + Flow.Prelude.stringify(_frame.key.name));
        };
        download = function () {
            return window.open('/3/DownloadDataset?key=' + encodeURIComponent(_frame.key.name), '_blank');
        };
        _grid = createGrid(_.inspect('columns', _frame));
        return {
            key: _frame.key.name,
            grid: _grid,
            inspect: inspect,
            createModel: createModel,
            inspectData: inspectData,
            predict: predict,
            download: download,
            template: 'flow-frame-output'
        };
    };
}.call(this));
(function () {
    var toSize;
    toSize = function (bytes) {
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
    H2O.FramesOutput = function (_, _frames) {
        var createFrameView, importFiles, predictOnFrames, _canCompareFrames, _checkAllFrames, _frameViews, _isCheckingAll;
        _frameViews = Flow.Dataflow.signal([]);
        _checkAllFrames = Flow.Dataflow.signal(false);
        _canCompareFrames = Flow.Dataflow.signal(false);
        _isCheckingAll = false;
        Flow.Dataflow.react(_checkAllFrames, function (checkAll) {
            var view, _i, _len, _ref;
            _isCheckingAll = true;
            _ref = _frameViews();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                view = _ref[_i];
                view.isChecked(checkAll);
            }
            _canCompareFrames(checkAll);
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
                return _canCompareFrames(checkedViews.length > 0);
            });
            columnLabels = lodash.head(lodash.map(frame.columns, function (column) {
                return column.label;
            }), 15);
            description = 'Columns: ' + columnLabels.join(', ') + (frame.columns.length > columnLabels.length ? '... (' + (frame.columns.length - columnLabels.length) + ' more columns)' : '');
            view = function () {
                if (frame.isText) {
                    return _.insertAndExecuteCell('cs', 'setupParse [ ' + Flow.Prelude.stringify(frame.key.name) + ' ]');
                } else {
                    return _.insertAndExecuteCell('cs', 'getFrame ' + Flow.Prelude.stringify(frame.key.name));
                }
            };
            predict = function () {
                return _.insertAndExecuteCell('cs', 'predict null, ' + Flow.Prelude.stringify(frame.key.name));
            };
            inspect = function () {
                return _.insertAndExecuteCell('cs', 'inspect getFrame ' + Flow.Prelude.stringify(frame.key.name));
            };
            createModel = function () {
                return _.insertAndExecuteCell('cs', 'assist buildModel, null, training_frame: ' + Flow.Prelude.stringify(frame.key.name));
            };
            return {
                key: frame.key.name,
                isChecked: _isChecked,
                description: description,
                size: toSize(frame.byteSize),
                rowCount: frame.rows,
                columnCount: frame.columns.length,
                isText: frame.isText,
                view: view,
                predict: predict,
                inspect: inspect,
                createModel: createModel
            };
        };
        importFiles = function () {
            return _.insertAndExecuteCell('cs', 'importFiles');
        };
        predictOnFrames = function () {
            var selectedKeys, view;
            selectedKeys = function () {
                var _i, _len, _ref, _results;
                _ref = _frameViews();
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    view = _ref[_i];
                    if (view.isChecked()) {
                        _results.push(view.key);
                    }
                }
                return _results;
            }();
            return _.insertAndExecuteCell('cs', 'predict null, ' + Flow.Prelude.stringify(selectedKeys));
        };
        _frameViews(lodash.map(_frames, createFrameView));
        return {
            frameViews: _frameViews,
            hasFrames: _frames.length > 0,
            importFiles: importFiles,
            predictOnFrames: predictOnFrames,
            canCompareFrames: _canCompareFrames,
            checkAllFrames: _checkAllFrames,
            template: 'flow-frames-output'
        };
    };
}.call(this));
(function () {
    H2O.ImportFilesInput = function (_) {
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
    H2O.ImportFilesOutput = function (_, _importResults) {
        var buildModel, createImportView, parse, _allKeys, _canBuildModel, _canParse, _importViews, _title;
        _allKeys = lodash.flatten(lodash.compact(lodash.map(_importResults, function (_arg) {
            var error, result;
            error = _arg[0], result = _arg[1];
            if (error) {
                return null;
            } else {
                return result.keys;
            }
        })));
        _canParse = _allKeys.length > 0;
        _canBuildModel = _allKeys.length === 1;
        _title = '' + _allKeys.length + ' / ' + _importResults.length + ' files imported.';
        createImportView = function (result) {
            return {
                keys: result.keys,
                template: 'flow-import-file-output'
            };
        };
        _importViews = lodash.map(_importResults, function (_arg) {
            var error, result;
            error = _arg[0], result = _arg[1];
            if (error) {
                return Flow.Failure(new Flow.Error('Error importing file', error));
            } else {
                return createImportView(result);
            }
        });
        parse = function () {
            var paths;
            paths = lodash.map(_allKeys, Flow.Prelude.stringify);
            return _.insertAndExecuteCell('cs', 'setupParse [ ' + paths.join(',') + ' ]');
        };
        buildModel = function () {
            return _.insertAndExecuteCell('cs', 'assist buildModel, null, training_frame: ' + Flow.Prelude.stringify(lodash.head(_allKeys)));
        };
        return {
            title: _title,
            importViews: _importViews,
            canParse: _canParse,
            parse: parse,
            canBuildModel: _canBuildModel,
            buildModel: buildModel,
            template: 'flow-import-files-output',
            templateOf: function (view) {
                return view.template;
            }
        };
    };
}.call(this));
(function () {
    H2O.InspectOutput = function (_, _frame) {
        var plot, view;
        view = function () {
            return _.insertAndExecuteCell('cs', 'grid inspect ' + Flow.Prelude.stringify(_frame.label) + ', ' + _frame.metadata.origin);
        };
        plot = function () {
            return _.insertAndExecuteCell('cs', _frame.metadata.plot);
        };
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
    H2O.InspectsOutput = function (_, _tables) {
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
    H2O.JobOutput = function (_, _job) {
        var initialize, isJobRunning, refresh, toggleRefresh, updateJob, view, _canView, _description, _destinationKey, _exception, _isBusy, _isLive, _key, _progress, _runTime, _status, _statusColor;
        _isBusy = Flow.Dataflow.signal(false);
        _isLive = Flow.Dataflow.signal(false);
        _key = _job.key.name;
        _description = _job.description;
        _destinationKey = _job.dest.name;
        _runTime = Flow.Dataflow.signal(null);
        _progress = Flow.Dataflow.signal(null);
        _status = Flow.Dataflow.signal(null);
        _statusColor = Flow.Dataflow.signal(null);
        _exception = Flow.Dataflow.signal(null);
        _canView = Flow.Dataflow.signal(false);
        isJobRunning = function (job) {
            return job.status === 'CREATED' || job.status === 'RUNNING';
        };
        updateJob = function (job) {
            _runTime(job.msec);
            _progress(getJobProgressPercent(job.progress));
            _status(job.status);
            _statusColor(getJobOutputStatusColor(job.status));
            _exception(job.exception ? Flow.Failure(new Flow.Error('Job failure.', new Error(job.exception))) : null);
            return _canView(!isJobRunning(job));
        };
        toggleRefresh = function () {
            return _isLive(!_isLive());
        };
        refresh = function () {
            _isBusy(true);
            return _.requestJob(_key, function (error, job) {
                _isBusy(false);
                if (error) {
                    _exception(Flow.Failure(new Flow.Error('Error fetching jobs', error)));
                    return _isLive(false);
                } else {
                    updateJob(job);
                    if (isJobRunning(job)) {
                        if (_isLive()) {
                            return lodash.delay(refresh, 1000);
                        }
                    } else {
                        return toggleRefresh();
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
            return _.requestInspect(_destinationKey, function (error, result) {
                if (error) {
                    return _exception(Flow.Failure(new Flow.Error('Error inspecting job target.', error)));
                } else {
                    switch (result.kind) {
                    case 'frame':
                        return _.insertAndExecuteCell('cs', 'getFrame ' + Flow.Prelude.stringify(_destinationKey));
                    case 'model':
                        return _.insertAndExecuteCell('cs', 'getModel ' + Flow.Prelude.stringify(_destinationKey));
                    }
                }
            });
        };
        initialize = function (job) {
            updateJob(job);
            if (isJobRunning(job)) {
                return toggleRefresh();
            }
        };
        initialize(_job);
        return {
            key: _key,
            description: _description,
            destinationKey: _destinationKey,
            runTime: _runTime,
            progress: _progress,
            status: _status,
            statusColor: _statusColor,
            exception: _exception,
            isLive: _isLive,
            toggleRefresh: toggleRefresh,
            canView: _canView,
            view: view,
            template: 'flow-job-output'
        };
    };
}.call(this));
(function () {
    H2O.JobsOutput = function (_, jobs) {
        var createJobView, initialize, refresh, toggleRefresh, _exception, _hasJobViews, _isBusy, _isLive, _jobViews;
        _jobViews = Flow.Dataflow.signals([]);
        _hasJobViews = Flow.Dataflow.lift(_jobViews, function (jobViews) {
            return jobViews.length > 0;
        });
        _isLive = Flow.Dataflow.signal(false);
        _isBusy = Flow.Dataflow.signal(false);
        _exception = Flow.Dataflow.signal(null);
        createJobView = function (job) {
            var view;
            view = function () {
                return _.insertAndExecuteCell('cs', 'getJob ' + Flow.Prelude.stringify(job.key.name));
            };
            return {
                job: job,
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
                    _exception(Flow.Failure(new Flow.Error('Error fetching jobs', error)));
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
            return _jobViews(lodash.map(jobs, createJobView));
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
    H2O.LogFileOutput = function (_, _nodeIndex, _logFile) {
        var createNode, initialize, _activeNode, _contents, _exception, _nodes;
        _exception = Flow.Dataflow.signal(null);
        _contents = Flow.Dataflow.signal('');
        _activeNode = Flow.Dataflow.signal(null);
        _nodes = Flow.Dataflow.signal([]);
        createNode = function (node, index) {
            return {
                name: node.h2o.node,
                index: index
            };
        };
        initialize = function (nodeIndex, logFile) {
            _contents(logFile.log);
            return _.requestCloud(function (error, cloud) {
                var i, node, nodes;
                if (!error) {
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
                    return Flow.Dataflow.react(_activeNode, function (node) {
                        if (node) {
                            return _.requestLogFile(node.index, function (error, logFile) {
                                if (error) {
                                    return _contents('Error fetching log file: ' + error.message);
                                } else {
                                    return _contents(logFile.log);
                                }
                            });
                        } else {
                            return _contents('');
                        }
                    });
                }
            });
        };
        initialize(_nodeIndex, _logFile);
        return {
            nodes: _nodes,
            activeNode: _activeNode,
            contents: _contents,
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
    createTextboxControl = function (parameter) {
        var control, _value;
        _value = Flow.Dataflow.signal(parameter.actual_value);
        control = createControl('textbox', parameter);
        control.value = _value;
        control.defaultValue = parameter.default_value;
        return control;
    };
    createDropdownControl = function (parameter) {
        var control, _value;
        _value = Flow.Dataflow.signal(parameter.actual_value);
        control = createControl('dropdown', parameter);
        control.values = Flow.Dataflow.signals(parameter.values);
        control.value = _value;
        control.defaultValue = parameter.default_value;
        return control;
    };
    createListControl = function (parameter) {
        var control, createValueView, excludeAll, includeAll, view, _availableSearchTerm, _availableValues, _availableValuesCaption, _i, _len, _ref, _searchAvailable, _searchSelected, _selectedSearchTerm, _selectedValues, _selectedValuesCaption, _value, _values, _views;
        _availableSearchTerm = Flow.Dataflow.signal('');
        _selectedSearchTerm = Flow.Dataflow.signal('');
        createValueView = function (value) {
            var exclude, include, self, _canExclude, _canInclude, _isAvailable;
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
                value: value,
                include: include,
                exclude: exclude,
                canInclude: _canInclude,
                canExclude: _canExclude,
                isAvailable: _isAvailable
            };
        };
        _values = Flow.Dataflow.signals(parameter.values);
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
        control.defaultValue = parameter.default_value;
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
        control.defaultValue = parameter.default_value;
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
            return createTextboxControl(parameter);
        default:
            console.error('Invalid field', JSON.stringify(parameter, null, 2));
            return null;
        }
    };
    H2O.ModelBuilderForm = function (_, _algorithm, _parameters) {
        var collectParameters, createModel, criticalControls, expertControls, findControl, findFormField, parameterTemplateOf, performValidations, revalidate, secondaryControls, _controlGroups, _exception, _form, _hasValidationFailures, _parametersByLevel, _revalidate, _validationFailureMessage;
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
        _form = lodash.flatten([
            {
                kind: 'group',
                title: 'Parameters'
            },
            criticalControls,
            {
                kind: 'group',
                title: 'Advanced'
            },
            secondaryControls,
            {
                kind: 'group',
                title: 'Expert'
            },
            expertControls
        ]);
        findControl = function (name) {
            var control, controls, _i, _j, _len, _len1;
            for (_i = 0, _len = _controlGroups.length; _i < _len; _i++) {
                controls = _controlGroups[_i];
                for (_j = 0, _len1 = controls.length; _j < _len1; _j++) {
                    control = controls[_j];
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
                                var columnLabels;
                                if (!error) {
                                    columnLabels = lodash.map(frame.columns, function (column) {
                                        return column.label;
                                    });
                                    if (responseColumnParameter) {
                                        responseColumnParameter.values(columnLabels);
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
            var control, controls, parameters, value, _i, _j, _len, _len1;
            if (includeUnchangedParameters == null) {
                includeUnchangedParameters = false;
            }
            parameters = {};
            for (_i = 0, _len = _controlGroups.length; _i < _len; _i++) {
                controls = _controlGroups[_i];
                for (_j = 0, _len1 = controls.length; _j < _len1; _j++) {
                    control = controls[_j];
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
                var control, controls, hasErrors, validation, validations, validationsByControlName, _i, _j, _k, _len, _len1, _len2;
                if (error) {
                    return _exception(Flow.Failure(new Flow.Error('Error fetching initial model builder state', error)));
                } else {
                    hasErrors = false;
                    if (modelBuilder.validation_messages.length) {
                        validationsByControlName = lodash.groupBy(modelBuilder.validation_messages, function (validation) {
                            return validation.field_name;
                        });
                        for (_i = 0, _len = _controlGroups.length; _i < _len; _i++) {
                            controls = _controlGroups[_i];
                            for (_j = 0, _len1 = controls.length; _j < _len1; _j++) {
                                control = controls[_j];
                                if (validations = validationsByControlName[control.name]) {
                                    for (_k = 0, _len2 = validations.length; _k < _len2; _k++) {
                                        validation = validations[_k];
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
        revalidate = lodash.throttle(_revalidate, 1000, { leading: false });
        performValidations(false, function () {
            var control, controls, _i, _j, _len, _len1;
            for (_i = 0, _len = _controlGroups.length; _i < _len; _i++) {
                controls = _controlGroups[_i];
                for (_j = 0, _len1 = controls.length; _j < _len1; _j++) {
                    control = controls[_j];
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
    H2O.ModelInput = function (_, _algo, _opts) {
        var createModel, populateFramesAndColumns, _algorithm, _algorithms, _canCreateModel, _exception, _modelForm;
        _exception = Flow.Dataflow.signal(null);
        _algorithms = Flow.Dataflow.signal([]);
        _algorithm = Flow.Dataflow.signal(_algo);
        _canCreateModel = Flow.Dataflow.lift(_algorithm, function (algorithm) {
            if (algorithm) {
                return true;
            } else {
                return false;
            }
        });
        _modelForm = Flow.Dataflow.signal(null);
        populateFramesAndColumns = function (frameKey, algorithm, parameters, go) {
            var classificationParameter;
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
                frameKey = _opts != null ? _opts.training_frame : void 0;
                return Flow.Dataflow.act(_algorithm, function (algorithm) {
                    if (algorithm) {
                        return _.requestModelBuilder(algorithm, function (error, result) {
                            var parameters;
                            if (error) {
                                return _exception(Flow.Failure(new Flow.Error('Error fetching model builder', error)));
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
    H2O.ModelOutput = function (_, _model) {
        var cloneModel, inspect, predict, toggle, _inputParameters, _isExpanded;
        _isExpanded = Flow.Dataflow.signal(false);
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
        toggle = function () {
            return _isExpanded(!_isExpanded());
        };
        cloneModel = function () {
            return alert('Not implemented');
        };
        predict = function () {
            return _.insertAndExecuteCell('cs', 'predict ' + Flow.Prelude.stringify(_model.key.name));
        };
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getModel ' + Flow.Prelude.stringify(_model.key.name));
        };
        return {
            key: _model.key,
            algo: _model.algo,
            inputParameters: _inputParameters,
            isExpanded: _isExpanded,
            toggle: toggle,
            cloneModel: cloneModel,
            predict: predict,
            inspect: inspect,
            template: 'flow-model-output'
        };
    };
}.call(this));
(function () {
    H2O.ModelsOutput = function (_, _models) {
        var buildModel, compareModels, createModelView, getSelectedModelKeys, initialize, inspectAll, predictUsingModels, _canCompareModels, _checkAllModels, _isCheckingAll, _modelViews;
        _modelViews = Flow.Dataflow.signal([]);
        _checkAllModels = Flow.Dataflow.signal(false);
        _canCompareModels = Flow.Dataflow.signal(false);
        _isCheckingAll = false;
        Flow.Dataflow.react(_checkAllModels, function (checkAll) {
            var view, _i, _len, _ref;
            _isCheckingAll = true;
            _ref = _modelViews();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                view = _ref[_i];
                view.isChecked(checkAll);
            }
            _canCompareModels(checkAll);
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
                return _canCompareModels(checkedViews.length > 1);
            });
            predict = function () {
                return _.insertAndExecuteCell('cs', 'predict ' + Flow.Prelude.stringify(model.key.name));
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
        getSelectedModelKeys = function () {
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
            return _.insertAndExecuteCell('cs', 'inspect getModels ' + Flow.Prelude.stringify(getSelectedModelKeys()));
        };
        predictUsingModels = function () {
            return _.insertAndExecuteCell('cs', 'predict ' + Flow.Prelude.stringify(getSelectedModelKeys()));
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
            return _modelViews(lodash.map(models, createModelView));
        };
        initialize(_models);
        return {
            modelViews: _modelViews,
            hasModels: _models.length > 0,
            buildModel: buildModel,
            compareModels: compareModels,
            predictUsingModels: predictUsingModels,
            canCompareModels: _canCompareModels,
            checkAllModels: _checkAllModels,
            inspect: inspectAll,
            template: 'flow-models-output'
        };
    };
}.call(this));
(function () {
    H2O.NoAssist = function (_) {
        return {
            showAssist: function () {
                return _.insertAndExecuteCell('cs', 'assist');
            },
            template: 'flow-no-assist'
        };
    };
}.call(this));
(function () {
    var parseDelimiters, parserTypes;
    parserTypes = lodash.map([
        'AUTO',
        'XLS',
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
    H2O.SetupParseOutput = function (_, _result) {
        var parseFiles, _columnCount, _columns, _deleteOnDone, _delimiter, _destinationKey, _hasColumns, _headerOption, _headerOptions, _parserType, _rows, _sourceKeys, _useSingleQuotes;
        _sourceKeys = lodash.map(_result.srcs, function (src) {
            return src.name;
        });
        _parserType = Flow.Dataflow.signal(lodash.find(parserTypes, function (parserType) {
            return parserType.type === _result.pType;
        }));
        _delimiter = Flow.Dataflow.signal(lodash.find(parseDelimiters, function (delimiter) {
            return delimiter.charCode === _result.sep;
        }));
        _useSingleQuotes = Flow.Dataflow.signal(_result.singleQuotes);
        _columns = lodash.map(_result.columnNames, function (name) {
            return { name: Flow.Dataflow.signal(name) };
        });
        _rows = _result.data;
        _columnCount = _result.ncols;
        _hasColumns = _columnCount > 0;
        _destinationKey = Flow.Dataflow.signal(_result.hexName);
        _headerOptions = {
            auto: 0,
            header: 1,
            data: -1
        };
        _headerOption = Flow.Dataflow.signal(_result.checkHeader === 0 ? 'auto' : _result.checkHeader === -1 ? 'data' : 'header');
        _deleteOnDone = Flow.Dataflow.signal(true);
        parseFiles = function () {
            var columnNames;
            columnNames = lodash.map(_columns, function (column) {
                return column.name();
            });
            return _.insertAndExecuteCell('cs', 'parseRaw\n  srcs: ' + Flow.Prelude.stringify(_sourceKeys) + '\n  hex: ' + Flow.Prelude.stringify(_destinationKey()) + '\n  pType: ' + Flow.Prelude.stringify(_parserType().type) + '\n  sep: ' + _delimiter().charCode + '\n  ncols: ' + _columnCount + '\n  singleQuotes: ' + _useSingleQuotes() + '\n  columnNames: ' + Flow.Prelude.stringify(columnNames) + '\n  delete_on_done: ' + _deleteOnDone() + '\n  checkHeader: ' + _headerOptions[_headerOption()]);
        };
        return {
            sourceKeys: _sourceKeys,
            parserTypes: parserTypes,
            delimiters: parseDelimiters,
            parserType: _parserType,
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
    H2O.ParseOutput = function (_, _result) {
        var viewJob;
        viewJob = function () {
            return _.insertAndExecuteCell('cs', 'getJob ' + Flow.Prelude.stringify(_result.job.key.name));
        };
        return {
            result: _result,
            viewJob: viewJob,
            template: 'flow-parse-output'
        };
    };
}.call(this));
(function () {
    H2O.PlotInput = function (_, _frame) {
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
    H2O.PlotOutput = function (_, _plot) {
        return {
            plot: _plot,
            template: 'flow-plot-output'
        };
    };
}.call(this));
(function () {
    H2O.PredictInput = function (_, _modelArg, _frameArg) {
        var predict, _canPredict, _exception, _frames, _hasFrames, _hasModels, _models, _selectedFrame, _selectedFrames, _selectedFramesCaption, _selectedModel, _selectedModels, _selectedModelsCaption;
        _selectedModels = _modelArg ? lodash.isArray(_modelArg) ? _modelArg : [_modelArg] : [];
        _selectedFrames = _frameArg ? lodash.isArray(_frameArg) ? _frameArg : [_frameArg] : [];
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
            var frameArg, modelArg;
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
            return _.insertAndExecuteCell('cs', 'predict ' + Flow.Prelude.stringify(modelArg) + ', ' + Flow.Prelude.stringify(frameArg));
        };
        return {
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
    H2O.PredictOutput = function (_, prediction) {
        var frame, inspect, model, viewPredictionFrame;
        frame = prediction.frame, model = prediction.model;
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getPrediction ' + Flow.Prelude.stringify(model.name) + ', ' + Flow.Prelude.stringify(frame.name));
        };
        viewPredictionFrame = function () {
            return _.insertAndExecuteCell('cs', 'getFrame ' + Flow.Prelude.stringify(prediction.predictions.key.name));
        };
        return {
            inspect: inspect,
            viewPredictionFrame: viewPredictionFrame,
            template: 'flow-predict-output'
        };
    };
}.call(this));
(function () {
    H2O.PredictsOutput = function (_, opts, _predictions) {
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
                return _.insertAndExecuteCell('cs', 'getPrediction ' + Flow.Prelude.stringify(_modelKey) + ', ' + Flow.Prelude.stringify(_frameKey));
            };
            inspect = function () {
                return _.insertAndExecuteCell('cs', 'inspect getPrediction ' + Flow.Prelude.stringify(_modelKey) + ', ' + Flow.Prelude.stringify(_frameKey));
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
            return _predictionViews(lodash.map(predictions, createPredictionView));
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
    H2O.ProfileOutput = function (_, _profile) {
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
        return {
            nodes: _nodes,
            activeNode: _activeNode,
            template: 'flow-profile-output'
        };
    };
}.call(this));
(function () {
    H2O.StackTraceOutput = function (_, _stackTrace) {
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
                name: node._node,
                timestamp: new Date(node._time),
                threads: function () {
                    var _i, _len, _ref, _results;
                    _ref = node._traces;
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
        return {
            nodes: _nodes,
            activeNode: _activeNode,
            template: 'flow-stacktrace-output'
        };
    };
}.call(this));
(function () {
    H2O.TimelineOutput = function (_, _timeline) {
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
                    event.ioFlavor || '-',
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
                    event.msgType,
                    event.data
                ];
            }
        };
        updateTimeline = function (timeline) {
            var cell, event, grid, header, table, tbody, td, th, thead, ths, tr, trs, _ref;
            _ref = Flow.HTML.template('.grid', 'table', '=thead', 'tbody', 'tr', '=th', '=td'), grid = _ref[0], table = _ref[1], thead = _ref[2], tbody = _ref[3], tr = _ref[4], th = _ref[5], td = _ref[6];
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
                    _exception(Flow.Failure(new Flow.Error('Error fetching timeline', error)));
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
