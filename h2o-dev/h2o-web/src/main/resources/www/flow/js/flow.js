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
    Flow.Cell = function (_, _renderers, type, input) {
        var activate, execute, select, self, _cursorPosition, _guid, _hasError, _hasInput, _hasOutput, _input, _isActive, _isBusy, _isOutputHidden, _isOutputVisible, _isReady, _isSelected, _outputs, _render, _result, _type;
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
        _isOutputVisible = Flow.Dataflow.signal(true);
        _isOutputHidden = Flow.Dataflow.lift(_isOutputVisible, function (visible) {
            return !visible;
        });
        _cursorPosition = {};
        Flow.Dataflow.act(_isActive, function (isActive) {
            if (isActive) {
                _.selectCell(self);
                _hasInput(true);
                if (!_render().isCode) {
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
            _.selectCell(self);
            return true;
        };
        activate = function () {
            return _isActive(true);
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
            isOutputVisible: _isOutputVisible,
            toggleOutput: function () {
                return _isOutputVisible(!_isOutputVisible());
            },
            showOutput: function () {
                return _isOutputVisible(true);
            },
            hideOutput: function () {
                return _isOutputVisible(false);
            },
            select: select,
            activate: activate,
            execute: execute,
            _cursorPosition: _cursorPosition,
            cursorPosition: function () {
                return _cursorPosition.read();
            },
            templateOf: function (view) {
                return view.template;
            },
            template: 'flow-cell'
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
        var checkConsistency, clearAllCells, clearCell, cloneCell, convertCellToCode, convertCellToHeading, convertCellToMarkdown, convertCellToRaw, copyCell, copyFile, createCell, createMenu, createMenuItem, createNewFile, createTool, cutCell, deleteCell, displayKeyboardShortcuts, editModeKeyboardShortcuts, editModeKeyboardShortcutsHelp, goToWebsite, initialize, insertCell, insertCellAbove, insertCellAboveAndRun, insertCellBelow, insertCellBelowAndRun, insertNewCellAbove, insertNewCellBelow, menuDivider, mergeCellAbove, mergeCellBelow, moveCellDown, moveCellUp, normalModeKeyboardShortcuts, normalModeKeyboardShortcutsHelp, notImplemented, openFile, pasteCellAbove, pasteCellBelow, pasteCellandReplace, printPreview, removeCell, renameFile, revertToCheckpoint, runAllCells, runCell, runCellAndInsertBelow, runCellAndSelectBelow, saveAndCheckpoint, saveFlow, selectCell, selectNextCell, selectPreviousCell, setupKeyboardHandling, splitCell, startTour, switchToCommandMode, switchToEditMode, switchToPresentationMode, toKeyboardHelp, toggleAllInputs, toggleAllOutputs, toggleInput, toggleOutput, undoLastDelete, _cells, _clipboardCell, _lastDeletedCell, _menus, _selectedCell, _selectedCellIndex, _toolbar;
        _cells = Flow.Dataflow.signals([]);
        _selectedCell = null;
        _selectedCellIndex = -1;
        _clipboardCell = null;
        _lastDeletedCell = null;
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
        selectCell = function (target) {
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
            var cells;
            cells = _cells();
            if (cells.length > 1) {
                if (_selectedCellIndex === cells.length - 1) {
                    _cells.splice(_selectedCellIndex, 1);
                    selectCell(cells[_selectedCellIndex - 1]);
                } else {
                    _cells.splice(_selectedCellIndex, 1);
                    selectCell(cells[_selectedCellIndex]);
                }
            }
        };
        insertCell = function (index, cell) {
            _cells.splice(index, 0, cell);
            selectCell(cell);
            return cell;
        };
        insertCellAbove = function (cell) {
            return insertCell(_selectedCellIndex, cell);
        };
        insertCellBelow = function (cell) {
            return insertCell(_selectedCellIndex + 1, cell);
        };
        insertNewCellAbove = function () {
            return insertCellAbove(createCell('cs'));
        };
        insertNewCellBelow = function () {
            return insertCellBelow(createCell('cs'));
        };
        insertCellAboveAndRun = function (type, input) {
            var cell;
            cell = insertCellAbove(createCell(type, input));
            return cell.execute();
        };
        insertCellBelowAndRun = function (type, input) {
            var cell;
            cell = insertCellBelow(createCell(type, input));
            return cell.execute();
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
                    cursorPosition = _selectedCell.cursorPosition();
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
        saveFlow = function () {
            console.debug('saveFlow');
            return false;
        };
        toggleOutput = function () {
            return _selectedCell.toggleOutput();
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
        notImplemented = function () {
        };
        createNewFile = notImplemented;
        openFile = notImplemented;
        copyFile = notImplemented;
        renameFile = notImplemented;
        saveAndCheckpoint = notImplemented;
        revertToCheckpoint = notImplemented;
        printPreview = notImplemented;
        pasteCellandReplace = notImplemented;
        mergeCellAbove = notImplemented;
        toggleInput = notImplemented;
        toggleAllInputs = notImplemented;
        toggleAllOutputs = notImplemented;
        switchToPresentationMode = notImplemented;
        runAllCells = notImplemented;
        clearCell = notImplemented;
        clearAllCells = notImplemented;
        startTour = notImplemented;
        goToWebsite = function (url) {
            return notImplemented;
        };
        createMenu = function (label, items) {
            return {
                label: label,
                items: items
            };
        };
        createMenuItem = function (label, action, isDisabled) {
            if (isDisabled == null) {
                isDisabled = false;
            }
            return {
                label: label,
                action: action,
                isAction: true,
                isDisabled: isDisabled
            };
        };
        menuDivider = { isAction: false };
        _menus = [
            createMenu('File', [
                createMenuItem('New', createNewFile, true),
                createMenuItem('Open...', openFile, true),
                menuDivider,
                createMenuItem('Make a Copy', copyFile, true),
                createMenuItem('Rename...', renameFile, true),
                createMenuItem('Save and Checkpoint...', saveAndCheckpoint, true),
                menuDivider,
                createMenuItem('Revert to Checkpoint...', revertToCheckpoint, true),
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
                createMenuItem('Toggle Input', toggleInput, true),
                createMenuItem('Toggle Output', toggleOutput),
                menuDivider,
                createMenuItem('Toggle All Inputs', toggleAllInputs, true),
                createMenuItem('Toggle All Outputs', toggleAllOutputs, true),
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
            createMenu('Help', [
                createMenuItem('Tour', startTour, true),
                createMenuItem('Keyboard Shortcuts', displayKeyboardShortcuts),
                menuDivider,
                createMenuItem('H2O Documentation', goToWebsite('http://docs.0xdata.com/'), true),
                createMenuItem('0xdata.com', goToWebsite('http://0xdata.com/'), true)
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
            [createTool('save', 'Save', saveAndCheckpoint, true)],
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
                saveFlow
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
                saveFlow
            ]
        ];
        toKeyboardHelp = function (shortcut) {
            var caption, keystrokes, sequence;
            sequence = shortcut[0], caption = shortcut[1];
            keystrokes = lodash.map(sequence.split(/\+/g), function (key) {
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
            Flow.Dataflow.link(_.selectCell, selectCell);
            return Flow.Dataflow.link(_.insertAndExecuteCell, function (type, input) {
                return lodash.defer(insertCellBelowAndRun, type, input);
            });
        };
        Flow.Dataflow.link(_.ready, initialize);
        return {
            executeHelp: function () {
                return _.insertAndExecuteCell('cs', 'help');
            },
            executeAssist: function () {
                return _.insertAndExecuteCell('cs', 'assist');
            },
            menus: _menus,
            toolbar: _toolbar,
            cells: _cells,
            shortcutsHelp: {
                normalMode: normalModeKeyboardShortcutsHelp,
                editMode: editModeKeyboardShortcutsHelp
            },
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
                    expansions.push(Flow.ObjectBrowserElement(key, value));
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
    Flow.ApplicationContext = function (_) {
        _.ready = Flow.Dataflow.slots();
        _.selectCell = Flow.Dataflow.slot();
        return _.insertAndExecuteCell = Flow.Dataflow.slot();
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
                _results.push(schema[label] = {
                    label: label,
                    type: type
                });
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
            var error;
            this.message = message;
            this.cause = cause;
            this.name = 'FlowError';
            error = new Error();
            if (error.stack) {
                this.stack = error.stack;
            } else {
                this.stack = printStackTrace();
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
                return beginTag + content + closeTag;
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
                arg.read = function () {
                    return $(element).textrange('get', 'position');
                };
            }
        }
    };
    ko.bindingHandlers.autoResize = {
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $el, resize;
            resize = function () {
                return lodash.defer(function () {
                    return $el.css('height', 'auto').height(element.scrollHeight);
                });
            };
            $el = $(element).on('input', resize);
            resize();
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
    var createAxis, createLinearScale, createOrdinalBandScale, plot, renderD3BarChart, renderD3StackedBar, stack;
    createOrdinalBandScale = function (domain, range) {
        return d3.scale.ordinal().domain(domain).rangeRoundBands(range, 0.1);
    };
    createLinearScale = function (domain, range) {
        return d3.scale.linear().domain(domain).range(range);
    };
    createAxis = function (scale, opts) {
        var axis;
        axis = d3.svg.axis().scale(scale);
        if (opts.orient) {
            axis.orient(opts.orient);
        }
        if (opts.ticks) {
            axis.ticks(opts.ticks);
        }
        return axis;
    };
    renderD3StackedBar = function (title, table, attrX1, attrX2, attrColor) {
        var availableHeight, availableWidth, axisX, bar, d, domainX, el, h4, height, items, label, legend, legendEl, legends, margin, rows, scaleColor, scaleX, schema, svg, svgAxisX, swatch, tooltip, variableColor, variableX1, variableX2, variables, viz, width, _ref;
        schema = table.schema, variables = table.variables, rows = table.rows;
        variableX1 = table.schema[attrX1];
        variableX2 = table.schema[attrX2];
        variableColor = table.schema[attrColor];
        domainX = Flow.Data.combineRanges(variableX1.domain, variableX2.domain);
        availableWidth = 450;
        availableHeight = 16 + 30;
        margin = {
            top: 0,
            right: 10,
            bottom: 30,
            left: 10
        };
        width = availableWidth - margin.left - margin.right;
        height = availableHeight - margin.top - margin.bottom;
        scaleX = d3.scale.linear().domain(domainX).range([
            0,
            width
        ]);
        scaleColor = d3.scale.ordinal().domain(variableColor.domain).range(d3.scale.category10().range());
        axisX = createAxis(scaleX, { orient: 'bottom' });
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        viz = d3.select(svg).attr('class', 'plot').attr('width', availableWidth).attr('height', availableHeight).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        svgAxisX = viz.append('g').attr('class', 'axis').attr('transform', 'translate(0,' + height + ')').call(axisX);
        tooltip = function (d) {
            var tip, variable, _i, _len;
            tip = '';
            for (_i = 0, _len = variables.length; _i < _len; _i++) {
                variable = variables[_i];
                tip += '' + variable.label + ': ' + (variable.type === Flow.TFactor ? variable.domain[d[variable.label]] : d[variable.label]) + '\n';
            }
            return tip.trim();
        };
        bar = viz.selectAll('.bar').data(rows).enter().append('rect').attr('class', 'bar').attr('x', function (d) {
            return scaleX(d[attrX1]);
        }).attr('width', function (d) {
            return scaleX(d[attrX2] - d[attrX1]);
        }).attr('height', height).style('fill', function (d) {
            return scaleColor(variableColor.domain[d[attrColor]]);
        }).append('title').text(tooltip);
        _ref = Flow.HTML.template('.flow-legend', 'span.flow-legend-item', '+span.flow-legend-swatch style=\'background:{0}\'', '=span.flow-legend-label'), legends = _ref[0], legend = _ref[1], swatch = _ref[2], label = _ref[3];
        items = function () {
            var _i, _len, _ref1, _results;
            _ref1 = variableColor.domain;
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                d = _ref1[_i];
                _results.push(legend([
                    swatch('', scaleColor(d)),
                    label(d)
                ]));
            }
            return _results;
        }();
        legendEl = Flow.HTML.render('div', legends(items));
        el = document.createElement('div');
        if (title) {
            h4 = Flow.HTML.template('=h4')[0];
            el.appendChild(Flow.HTML.render('div', h4(lodash.escape(title))));
        }
        el.appendChild(svg);
        el.appendChild(legendEl);
        return el;
    };
    renderD3BarChart = function (title, table, attrX, attrY) {
        var availableHeight, availableWidth, axisX, axisY, domainX, domainY, el, h4, height, heightY, interpretationX, interpretationXY, interpretationY, margin, positionX, positionY, row, rows, scaleX, scaleY, schema, svg, svgAxisX, svgAxisY, variableX, variableY, variables, viz, width, widthX;
        schema = table.schema, variables = table.variables, rows = table.rows;
        variableX = schema[attrX];
        variableY = schema[attrY];
        interpretationX = Flow.Data.computevariableInterpretation(variableX.type);
        interpretationY = Flow.Data.computevariableInterpretation(variableY.type);
        interpretationXY = interpretationX + interpretationY;
        domainX = function () {
            var _i, _len, _results;
            if (interpretationX === 'c') {
                return Flow.Data.includeZeroInRange(variableX.domain);
            } else {
                _results = [];
                for (_i = 0, _len = rows.length; _i < _len; _i++) {
                    row = rows[_i];
                    _results.push(variableX.domain[row[attrX]]);
                }
                return _results;
            }
        }();
        domainY = function () {
            var _i, _len, _results;
            if (interpretationY === 'c') {
                return Flow.Data.includeZeroInRange(variableY.domain);
            } else {
                _results = [];
                for (_i = 0, _len = rows.length; _i < _len; _i++) {
                    row = rows[_i];
                    _results.push(variableY.domain[row[attrY]]);
                }
                return _results;
            }
        }();
        availableWidth = interpretationX === 'c' ? 500 : domainX.length * 20;
        availableHeight = interpretationY === 'c' ? 500 : domainY.length * 20;
        margin = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 40
        };
        width = availableWidth - margin.left - margin.right;
        height = availableHeight - margin.top - margin.bottom;
        scaleX = interpretationX === 'd' ? createOrdinalBandScale(domainX, [
            0,
            width
        ]) : createLinearScale(domainX, [
            0,
            width
        ]);
        scaleY = interpretationY === 'd' ? createOrdinalBandScale(domainY, [
            0,
            height
        ]) : createLinearScale(domainY, [
            height,
            0
        ]);
        axisX = createAxis(scaleX, { orient: 'bottom' });
        axisY = createAxis(scaleY, { orient: 'left' });
        if (interpretationXY === 'dc') {
            positionX = function (d) {
                return scaleX(variableX.domain[d[attrX]]);
            };
            positionY = function (d) {
                return scaleY(d[attrY]);
            };
            widthX = scaleX.rangeBand();
            heightY = function (d) {
                return height - scaleY(d[attrY]);
            };
        } else {
            positionX = function (d) {
                return scaleX(0);
            };
            positionY = function (d) {
                return scaleY(variableY.domain[d[attrY]]);
            };
            widthX = function (d) {
                return scaleX(d[attrX]);
            };
            heightY = scaleY.rangeBand();
        }
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        viz = d3.select(svg).attr('class', 'plot').attr('width', availableWidth).attr('height', availableHeight).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        svgAxisX = viz.append('g').attr('class', 'axis').attr('transform', 'translate(0,' + height + ')').call(axisX);
        svgAxisY = viz.append('g').attr('class', 'axis').call(axisY);
        if (false) {
            svgAxisY.append('text').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').text(variableY.label);
        }
        viz.selectAll('.bar').data(rows).enter().append('rect').attr('class', 'bar').attr('x', positionX).attr('width', widthX).attr('y', positionY).attr('height', heightY);
        el = document.createElement('div');
        if (title) {
            h4 = Flow.HTML.template('=h4')[0];
            el.appendChild(Flow.HTML.render('div', h4(lodash.escape(title))));
        }
        el.appendChild(svg);
        return el;
    };
    plot = function (_config, go) {
        var initialize, renderInterval, renderSchema, renderText;
        renderSchema = function (config, go) {
            return config.data;
        };
        renderInterval = function (config, go) {
            var attrX1, attrX2, el, _ref;
            if (config.x && !config.y) {
                _ref = config.x(config.data), attrX1 = _ref[0], attrX2 = _ref[1];
                el = renderD3StackedBar(config.title, config.data, attrX1, attrX2, config.color);
            } else {
                el = renderD3BarChart(config.title, config.data, config.x, config.y);
            }
            return go(null, Flow.HTML.render('div', el));
        };
        renderText = function (config, go) {
            var grid, h4, p, row, table, tbody, td, tdr, tds, th, thead, ths, tr, trs, value, variable, _ref;
            _ref = Flow.HTML.template('.grid', '=h4', '=p', 'table', '=thead', 'tbody', 'tr', '=th', '=td', '=td.rt'), grid = _ref[0], h4 = _ref[1], p = _ref[2], table = _ref[3], thead = _ref[4], tbody = _ref[5], tr = _ref[6], th = _ref[7], td = _ref[8], tdr = _ref[9];
            ths = function () {
                var _i, _len, _ref1, _results;
                _ref1 = config.data.variables;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                    variable = _ref1[_i];
                    _results.push(th(lodash.escape(variable.label)));
                }
                return _results;
            }();
            trs = function () {
                var _i, _len, _ref1, _results;
                _ref1 = config.data.rows;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                    row = _ref1[_i];
                    tds = function () {
                        var _j, _len1, _ref2, _results1;
                        _ref2 = config.data.variables;
                        _results1 = [];
                        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                            variable = _ref2[_j];
                            value = row[variable.label];
                            switch (variable.type) {
                            case Flow.TFactor:
                                _results1.push(td(value === null ? '-' : lodash.escape(variable.domain[value])));
                                break;
                            case Flow.TNumber:
                                _results1.push(tdr(value === null ? '-' : value));
                                break;
                            case Flow.TArray:
                                _results1.push(td(value === null ? '-' : value.join(', ')));
                                break;
                            default:
                                _results1.push(td(value === null ? '-' : value));
                            }
                        }
                        return _results1;
                    }();
                    _results.push(tr(tds));
                }
                return _results;
            }();
            return go(null, Flow.HTML.render('div', grid([
                h4(config.data.label),
                p(config.data.description),
                table([
                    thead(tr(ths)),
                    tbody(trs)
                ])
            ])));
        };
        initialize = function (config) {
            var error;
            try {
                switch (config.type) {
                case 'interval':
                    return renderInterval(config, go);
                case 'schema':
                    return renderSchema(config, go);
                case 'text':
                    return renderText(config, go);
                default:
                    return go(new Error('Not implemented'));
                }
            } catch (_error) {
                error = _error;
                return go(new Flow.Error('Error creating plot.', error));
            }
        };
        return initialize(_config);
    };
    stack = function (attr) {
        var self;
        self = function (table) {
            var end, endVariable, n, p, row, start, startVariable, type, value, _i, _len, _ref, _ref1;
            type = table.schema[attr].type;
            _ref = table.expand(type, type), startVariable = _ref[0], endVariable = _ref[1];
            start = startVariable.label;
            end = endVariable.label;
            n = 0;
            p = 0;
            _ref1 = table.rows;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                row = _ref1[_i];
                value = row[attr];
                if (value >= 0) {
                    row[start] = p;
                    row[end] = p = p + value;
                } else {
                    row[start] = n;
                    row[end] = n = n + value;
                }
            }
            startVariable.domain = [
                n,
                p
            ];
            endVariable.domain = [
                n,
                p
            ];
            return [
                start,
                end
            ];
        };
        return self;
    };
    Flow.Plot = plot;
    plot.stack = stack;
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
    var describeCount;
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
    Flow.Util = { describeCount: describeCount };
}.call(this));
(function () {
    H2O.ApplicationContext = function (_) {
        _.requestFileGlob = Flow.Dataflow.slot();
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
        return _.inspect = Flow.Dataflow.slot();
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
        var composePath, doGet, doPost, encodeArray, hackInModelAlgo, mapWithKey, requestColumnSummary, requestFileGlob, requestFrame, requestFrames, requestImportFile, requestImportFiles, requestInspect, requestJob, requestJobs, requestModel, requestModelBuild, requestModelBuilder, requestModelBuilders, requestModelInputValidation, requestModels, requestParseFiles, requestParseSetup, requestPredict, requestPrediction, requestPredictions, requestWithOpts;
        doGet = function (path, go) {
            console.debug('GET', path);
            return $.getJSON(path).done(function (data, status, xhr) {
                console.debug('  OK', path);
                return go(null, data);
            }).fail(function (xhr, status, error) {
                var message, _ref;
                console.debug('  ***FAIL***', path);
                message = ((_ref = xhr.responseJSON) != null ? _ref.errmsg : void 0) ? xhr.responseJSON.errmsg : status === 0 ? 'Could not connect to H2O' : 'Unknown error';
                return go(new Flow.Error(message, new Flow.Error('Error calling GET ' + path)));
            });
        };
        doPost = function (path, opts, go) {
            console.debug('POST', path);
            return $.post(path, opts).done(function (data, status, xhr) {
                console.debug('  OK', path);
                return go(null, data);
            }).fail(function (xhr, status, error) {
                var message, _ref;
                console.debug('  ***FAIL***', path);
                message = ((_ref = xhr.responseJSON) != null ? _ref.errmsg : void 0) ? xhr.responseJSON.errmsg : status === 0 ? 'Could not connect to H2O' : 'Unknown error';
                return go(new Flow.Error(message, new Flow.Error('Error calling POST ' + path + ' with opts ' + JSON.stringify(opts))));
            });
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
        encodeArray = function (array) {
            return '[' + lodash.map(array, encodeURIComponent).join(',') + ']';
        };
        requestInspect = function (key, go) {
            var opts;
            opts = { key: encodeURIComponent(key) };
            return requestWithOpts('/Inspect.json', opts, go);
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
            return doGet('/3/Frames/' + encodeURIComponent(key), function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, lodash.head(result.frames));
                }
            });
        };
        requestColumnSummary = function (key, column, go) {
            return doGet('/3/Frames/' + encodeURIComponent(key) + '/columns/' + encodeURIComponent(column) + '/summary', function (error, result) {
                if (error) {
                    return go(error);
                } else {
                    return go(null, lodash.head(result.frames));
                }
            });
        };
        requestJobs = function (go) {
            return doGet('/Jobs.json', function (error, result) {
                if (error) {
                    return go(new Flow.Error('Error fetching jobs', error));
                } else {
                    return go(null, result.jobs);
                }
            });
        };
        requestJob = function (key, go) {
            return doGet('/Jobs.json/' + encodeURIComponent(key), function (error, result) {
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
            return requestWithOpts('/Typeahead.json/files', opts, go);
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
            return requestWithOpts('/ImportFiles.json', opts, go);
        };
        requestParseSetup = function (sources, go) {
            var encodedPaths, opts;
            encodedPaths = lodash.map(sources, encodeURIComponent);
            opts = { srcs: '[' + encodedPaths.join(',') + ']' };
            return requestWithOpts('/ParseSetup.json', opts, go);
        };
        requestParseFiles = function (sourceKeys, destinationKey, parserType, separator, columnCount, useSingleQuotes, columnNames, deleteOnDone, checkHeader, go) {
            var opts;
            opts = {
                hex: encodeURIComponent(destinationKey),
                srcs: encodeArray(sourceKeys),
                pType: parserType,
                sep: separator,
                ncols: columnCount,
                singleQuotes: useSingleQuotes,
                columnNames: encodeArray(columnNames),
                checkHeader: checkHeader,
                delete_on_done: deleteOnDone
            };
            return requestWithOpts('/Parse.json', opts, go);
        };
        hackInModelAlgo = function (model) {
            var prefix;
            prefix = lodash.head(model.key.split('__'));
            model.algo = prefix === 'DeepLearningModel' ? 'deeplearning' : prefix === 'K-meansModel' ? 'kmeans' : prefix === 'GLMModel' ? 'glm' : 'unknown';
            return model;
        };
        requestModels = function (go, opts) {
            return requestWithOpts('/3/Models.json', opts, function (error, result) {
                if (error) {
                    return go(error, result);
                } else {
                    return go(error, lodash.map(result.models, hackInModelAlgo));
                }
            });
        };
        requestModel = function (key, go) {
            return doGet('/3/Models.json/' + encodeURIComponent(key), function (error, result) {
                if (error) {
                    return go(error, result);
                } else {
                    return go(error, hackInModelAlgo(lodash.head(result.models)));
                }
            });
        };
        requestModelBuilders = function (go) {
            return doGet('/2/ModelBuilders.json', go);
        };
        requestModelBuilder = function (algo, go) {
            return doGet('/2/ModelBuilders.json/' + algo, go);
        };
        requestModelInputValidation = function (algo, parameters, go) {
            return doPost('/2/ModelBuilders.json/' + algo + '/parameters', parameters, go);
        };
        requestModelBuild = function (algo, parameters, go) {
            return doPost('/2/ModelBuilders.json/' + algo, parameters, go);
        };
        requestPredict = function (modelKey, frameKey, go) {
            return doPost('/3/ModelMetrics.json/models/' + encodeURIComponent(modelKey) + '/frames/' + encodeURIComponent(frameKey), {}, function (error, result) {
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
                            if (modelKey && prediction.model.key !== modelKey) {
                                _results.push(null);
                            } else if (frameKey && prediction.frame.key.name !== frameKey) {
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
        Flow.Dataflow.link(_.requestInspect, requestInspect);
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
        return Flow.Dataflow.link(_.requestPredictions, requestPredictions);
    };
}.call(this));
(function () {
    var formulateGetPredictionsOrigin, _assistance, __slice = [].slice;
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
        var assist, buildModel, computeFalsePositiveRate, computeTruePositiveRate, extendColumnSummary, extendDeepLearningModel, extendFrame, extendFrames, extendGLMModel, extendKMeansModel, extendModel, extendModels, extendPrediction, extendPredictions, f, flow_, form, getColumnSummary, getFrame, getFrames, getJob, getJobs, getModel, getModels, getPrediction, getPredictions, grid, gui, help, importFiles, inspect, inspect$1, inspect$2, inspectMetrics, inspectModelParameters, inspectMultimodelParameters, inspectPrediction, inspectPredictions, inspectScores, inspect_, loadScript, name, parseRaw, plot, predict, proceed, read, render_, renderable, requestColumnSummary, requestFrame, requestFrames, requestModel, requestModels, requestModelsByKeys, requestPredict, requestPrediction, requestPredictions, setupParse, __plot, _apply, _async, _call, _fork, _get, _isFuture, _join, _plot, _ref;
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
        renderable = Flow.Async.renderable;
        proceed = function (func, args) {
            return renderable(Flow.Async.noop, function (ignore, go) {
                return go(null, func.apply(null, [_].concat(args || [])));
            });
        };
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
        help = function () {
            return proceed(H2O.Help);
        };
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
            root._cache_[key] = inspection = f();
            render_(inspection, function () {
                return H2O.InspectOutput(_, inspection);
            });
            return inspection;
        };
        __plot = function (config, go) {
            return Flow.Plot(config, function (error, plot) {
                if (error) {
                    return go(new Flow.Error('Error rendering plot.', error));
                } else {
                    return go(null, plot);
                }
            });
        };
        _plot = function (config, go) {
            if (config.data) {
                if (_isFuture(config.data)) {
                    return config.data(function (error, data) {
                        if (error) {
                            return go(new Flow.Error('Error evaluating data for plot().', error));
                        } else {
                            config.data = data;
                            return __plot(config, go);
                        }
                    });
                } else {
                    return __plot(config, go);
                }
            } else {
                return go(new Flow.Error('Cannot plot(): missing \'data\'.'));
            }
        };
        plot = function (config) {
            return renderable(_plot, config, function (plot, go) {
                return go(null, H2O.PlotOutput(_, plot));
            });
        };
        plot.stack = Flow.Plot.stack;
        grid = function (data) {
            return plot({
                type: 'text',
                data: data
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
                var Record, i, j, leader, model, modelKeys, parameter, parameters, row, rows, variable, variables, _i, _j, _len, _len1, _ref1;
                leader = lodash.head(models);
                parameters = leader.parameters;
                variables = function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = parameters.length; _i < _len; _i++) {
                        parameter = parameters[_i];
                        switch (parameter.type) {
                        case 'enum':
                        case 'Frame':
                        case 'string':
                        case 'byte[]':
                        case 'short[]':
                        case 'int[]':
                        case 'long[]':
                        case 'float[]':
                        case 'double[]':
                            _results.push(Flow.Data.Factor(parameter.label));
                            break;
                        case 'byte':
                        case 'short':
                        case 'int':
                        case 'long':
                        case 'float':
                        case 'double':
                            _results.push(Flow.Data.Variable(parameter.label, Flow.TNumber));
                            break;
                        case 'string[]':
                            _results.push(Flow.Data.Variable(parameter.label, Flow.TArray));
                            break;
                        case 'boolean':
                            _results.push(Flow.Data.Variable(parameter.label, Flow.TBoolean));
                            break;
                        default:
                            _results.push(Flow.Data.Variable(parameter.label, Flow.TObject));
                        }
                    }
                    return _results;
                }();
                Record = Flow.Data.Record(variables);
                rows = new Array(models.length);
                for (i = _i = 0, _len = models.length; _i < _len; i = ++_i) {
                    model = models[i];
                    rows[i] = row = new Record();
                    _ref1 = model.parameters;
                    for (j = _j = 0, _len1 = _ref1.length; _j < _len1; j = ++_j) {
                        parameter = _ref1[j];
                        variable = variables[j];
                        row[variable.label] = variable.type === Flow.TFactor ? variable.read(parameter.actual_value) : parameter.actual_value;
                    }
                }
                modelKeys = function () {
                    var _k, _len2, _results;
                    _results = [];
                    for (_k = 0, _len2 = models.length; _k < _len2; _k++) {
                        model = models[_k];
                        _results.push(model.key);
                    }
                    return _results;
                }();
                return Flow.Data.Table({
                    label: 'parameters',
                    description: 'Parameters for models ' + modelKeys.join(', '),
                    variables: variables,
                    rows: rows,
                    meta: { origin: 'getModels ' + Flow.Prelude.stringify(modelKeys) }
                });
            };
        };
        inspectModelParameters = function (model) {
            return function () {
                var Record, i, parameter, parameters, row, rows, variable, variables, _i, _j, _len, _len1;
                parameters = model.parameters;
                variables = [
                    Flow.Data.Variable('label', Flow.TString),
                    Flow.Data.Variable('type', Flow.TString),
                    Flow.Data.Variable('level', Flow.TString),
                    Flow.Data.Variable('actual_value', Flow.TObject),
                    Flow.Data.Variable('default_value', Flow.TObject)
                ];
                Record = Flow.Data.Record(variables);
                rows = new Array(parameters.length);
                for (i = _i = 0, _len = parameters.length; _i < _len; i = ++_i) {
                    parameter = parameters[i];
                    rows[i] = row = new Record();
                    for (_j = 0, _len1 = variables.length; _j < _len1; _j++) {
                        variable = variables[_j];
                        row[variable.label] = parameter[variable.label];
                    }
                }
                return Flow.Data.Table({
                    label: 'parameters',
                    description: 'Parameters for model \'' + model.key + '\'',
                    variables: variables,
                    rows: rows,
                    meta: { origin: 'getModel ' + Flow.Prelude.stringify(model.key) }
                });
            };
        };
        extendKMeansModel = function (model) {
            return inspect_(model, { parameters: inspectModelParameters(model) });
        };
        extendDeepLearningModel = function (model) {
            return inspect_(model, { parameters: inspectModelParameters(model) });
        };
        extendGLMModel = function (model) {
            return inspect_(model, { parameters: inspectModelParameters(model) });
        };
        extendModel = function (model) {
            switch (model.algo) {
            case 'kmeans':
                extendKMeansModel(model);
                break;
            case 'deeplearning':
                extendDeepLearningModel(model);
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
        computeTruePositiveRate = function (cm) {
            var fn, fp, tn, tp, _ref1, _ref2;
            (_ref1 = cm[0], tn = _ref1[0], fp = _ref1[1]), (_ref2 = cm[1], fn = _ref2[0], tp = _ref2[1]);
            return tp / (tp + fn);
        };
        computeFalsePositiveRate = function (cm) {
            var fn, fp, tn, tp, _ref1, _ref2;
            (_ref1 = cm[0], tn = _ref1[0], fp = _ref1[1]), (_ref2 = cm[1], fn = _ref2[0], tp = _ref2[1]);
            return fp / (fp + tn);
        };
        read = function (value) {
            if (value === 'NaN') {
                return null;
            } else {
                return value;
            }
        };
        inspectPrediction = function (prediction) {
            return function () {
                var Record, auc, frame, model, rows, variables;
                frame = prediction.frame, model = prediction.model, auc = prediction.auc;
                variables = [
                    Flow.Data.Variable('parameter', Flow.TString),
                    Flow.Data.Variable('value', Flow.TObject)
                ];
                Record = Flow.Data.Record(variables);
                rows = [];
                rows.push(new Record('key', model.key));
                rows.push(new Record('frame', frame.key.name));
                rows.push(new Record('model_category', prediction.model_category));
                rows.push(new Record('duration_in_ms', prediction.duration_in_ms));
                rows.push(new Record('scoring_time', prediction.scoring_time));
                rows.push(new Record('AUC', auc.AUC));
                rows.push(new Record('Gini', auc.Gini));
                rows.push(new Record('threshold_criterion', auc.threshold_criterion));
                return Flow.Data.Table({
                    label: 'prediction',
                    description: 'Prediction output for model \'' + model.key + '\' on frame \'' + frame.key.name + '\'',
                    variables: variables,
                    rows: rows,
                    meta: { origin: 'getPrediction ' + Flow.Prelude.stringify(model.key) + ', ' + Flow.Prelude.stringify(frame.key.name) }
                });
            };
        };
        inspectMetrics = function (opts, predictions) {
            return function () {
                var Record, auc, cm, criteriaVariable, frame, i, model, prediction, rows, variables, _i, _j, _len, _ref1;
                variables = [
                    criteriaVariable = Flow.Data.Factor('criteria'),
                    Flow.Data.Variable('threshold', Flow.TNumber),
                    Flow.Data.Variable('F1', Flow.TNumber),
                    Flow.Data.Variable('F2', Flow.TNumber),
                    Flow.Data.Variable('F0point5', Flow.TNumber),
                    Flow.Data.Variable('accuracy', Flow.TNumber),
                    Flow.Data.Variable('error', Flow.TNumber),
                    Flow.Data.Variable('precision', Flow.TNumber),
                    Flow.Data.Variable('recall', Flow.TNumber),
                    Flow.Data.Variable('specificity', Flow.TNumber),
                    Flow.Data.Variable('mcc', Flow.TNumber),
                    Flow.Data.Variable('max_per_class_error', Flow.TNumber),
                    Flow.Data.Variable('confusion_matrix', Flow.TObject),
                    Flow.Data.Variable('TPR', Flow.TNumber),
                    Flow.Data.Variable('FPR', Flow.TNumber),
                    Flow.Data.Variable('key', Flow.TString),
                    Flow.Data.Variable('model', Flow.TString),
                    Flow.Data.Variable('frame', Flow.TString)
                ];
                Record = Flow.Data.Record(variables);
                rows = [];
                for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                    prediction = predictions[_i];
                    frame = prediction.frame, model = prediction.model, auc = prediction.auc;
                    for (i = _j = 0, _ref1 = auc.threshold_criteria.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
                        rows.push(new Record(criteriaVariable.read(auc.threshold_criteria[i]), read(auc.threshold_for_criteria[i]), read(auc.F1_for_criteria[i]), read(auc.F2_for_criteria[i]), read(auc.F0point5_for_criteria[i]), read(auc.accuracy_for_criteria[i]), read(auc.error_for_criteria[i]), read(auc.precision_for_criteria[i]), read(auc.recall_for_criteria[i]), read(auc.specificity_for_criteria[i]), read(auc.mcc_for_criteria[i]), read(auc.max_per_class_error_for_criteria[i]), cm = auc.confusion_matrix_for_criteria[i], computeTruePositiveRate(cm), computeFalsePositiveRate(cm), model.key + ' on ' + frame.key.name, model.key, frame.key.name));
                    }
                }
                return Flow.Data.Table({
                    label: 'metrics',
                    description: 'Metrics for the selected predictions',
                    variables: variables,
                    rows: rows,
                    meta: { origin: formulateGetPredictionsOrigin(opts) }
                });
            };
        };
        inspectPredictions = function (opts, predictions) {
            return function () {
                var Record, auc, frame, i, model, prediction, row, rows, variables, _i, _len;
                variables = [
                    Flow.Data.Variable('key', Flow.TString),
                    Flow.Data.Variable('model', Flow.TString),
                    Flow.Data.Variable('frame', Flow.TString),
                    Flow.Data.Variable('model_category', Flow.TString),
                    Flow.Data.Variable('duration_in_ms', Flow.TNumber),
                    Flow.Data.Variable('scoring_time', Flow.TNumber),
                    Flow.Data.Variable('AUC', Flow.TNumber),
                    Flow.Data.Variable('Gini', Flow.TNumber),
                    Flow.Data.Variable('threshold_criterion', Flow.TString)
                ];
                Record = Flow.Data.Record(variables);
                rows = new Array(predictions.length);
                for (i = _i = 0, _len = predictions.length; _i < _len; i = ++_i) {
                    prediction = predictions[i];
                    frame = prediction.frame, model = prediction.model, auc = prediction.auc;
                    rows[i] = row = new Record(model.key + ' on ' + frame.key.name, model.key, frame.key.name, prediction.model_category, prediction.duration_in_ms, prediction.scoring_time, auc.AUC, auc.Gini, auc.threshold_criterion);
                }
                return Flow.Data.Table({
                    label: 'predictions',
                    description: 'Prediction output for selected predictions.',
                    variables: variables,
                    rows: rows,
                    meta: { origin: formulateGetPredictionsOrigin(opts) }
                });
            };
        };
        extendPredictions = function (opts, predictions) {
            render_(predictions, function () {
                return H2O.PredictsOutput(_, opts, predictions);
            });
            return inspect_(predictions, {
                predictions: inspectPredictions(opts, predictions),
                metrics: inspectMetrics(opts, predictions),
                scores: inspectScores(opts, predictions)
            });
        };
        inspectScores = function (opts, predictions) {
            return function () {
                var Record, auc, cm, frame, i, model, prediction, rows, variables, _i, _j, _len, _ref1;
                variables = [
                    Flow.Data.Variable('thresholds', Flow.TNumber),
                    Flow.Data.Variable('F1', Flow.TNumber),
                    Flow.Data.Variable('F2', Flow.TNumber),
                    Flow.Data.Variable('F0point5', Flow.TNumber),
                    Flow.Data.Variable('accuracy', Flow.TNumber),
                    Flow.Data.Variable('errorr', Flow.TNumber),
                    Flow.Data.Variable('precision', Flow.TNumber),
                    Flow.Data.Variable('recall', Flow.TNumber),
                    Flow.Data.Variable('specificity', Flow.TNumber),
                    Flow.Data.Variable('mcc', Flow.TNumber),
                    Flow.Data.Variable('max_per_class_error', Flow.TNumber),
                    Flow.Data.Variable('confusion_matrices', Flow.TObject),
                    Flow.Data.Variable('TPR', Flow.TNumber),
                    Flow.Data.Variable('FPR', Flow.TNumber),
                    Flow.Data.Variable('key', Flow.TString),
                    Flow.Data.Variable('model', Flow.TString),
                    Flow.Data.Variable('frame', Flow.TString)
                ];
                Record = Flow.Data.Record(variables);
                rows = [];
                for (_i = 0, _len = predictions.length; _i < _len; _i++) {
                    prediction = predictions[_i];
                    frame = prediction.frame, model = prediction.model, auc = prediction.auc;
                    for (i = _j = 0, _ref1 = auc.thresholds.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
                        rows.push(new Record(read(auc.thresholds[i]), read(auc.F1[i]), read(auc.F2[i]), read(auc.F0point5[i]), read(auc.accuracy[i]), read(auc.errorr[i]), read(auc.precision[i]), read(auc.recall[i]), read(auc.specificity[i]), read(auc.mcc[i]), read(auc.max_per_class_error[i]), cm = auc.confusion_matrices[i], computeTruePositiveRate(cm), computeFalsePositiveRate(cm), model.key + ' on ' + frame.key.name, model.key, frame.key.name));
                    }
                }
                return Flow.Data.Table({
                    label: 'scores',
                    description: 'Scores for the selected predictions',
                    variables: variables,
                    rows: rows,
                    meta: { origin: formulateGetPredictionsOrigin(opts) }
                });
            };
        };
        extendPrediction = function (modelKey, frameKey, prediction) {
            render_(prediction, function () {
                return H2O.PredictOutput(_, prediction);
            });
            return inspect_(prediction, {
                prediction: inspectPrediction(prediction),
                scores: inspectScores({
                    model: modelKey,
                    frame: frameKey
                }, [prediction]),
                metrics: inspectMetrics({
                    model: modelKey,
                    frame: frameKey
                }, [prediction])
            });
        };
        extendFrame = function (frameKey, frame) {
            var inspectColumns, inspectData;
            inspectColumns = function () {
                var Record, column, domain, label, row, rows, variable, variables;
                variables = [
                    Flow.Data.Variable('label', Flow.TString),
                    Flow.Data.Variable('missing', Flow.TNumber),
                    Flow.Data.Variable('zeros', Flow.TNumber),
                    Flow.Data.Variable('pinfs', Flow.TNumber),
                    Flow.Data.Variable('ninfs', Flow.TNumber),
                    Flow.Data.Variable('min', Flow.TNumber),
                    Flow.Data.Variable('max', Flow.TNumber),
                    Flow.Data.Variable('mean', Flow.TNumber),
                    Flow.Data.Variable('sigma', Flow.TNumber),
                    Flow.Data.Variable('type', Flow.TString),
                    Flow.Data.Variable('cardinality', Flow.TNumber),
                    Flow.Data.Variable('precision', Flow.TNumber)
                ];
                Record = Flow.Data.Record(variables);
                rows = function () {
                    var _i, _j, _len, _len1, _ref1, _results;
                    _ref1 = frame.columns;
                    _results = [];
                    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                        column = _ref1[_i];
                        row = new Record();
                        for (_j = 0, _len1 = variables.length; _j < _len1; _j++) {
                            variable = variables[_j];
                            label = variable.label;
                            switch (label) {
                            case 'min':
                                row[label] = lodash.head(column.mins);
                                break;
                            case 'max':
                                row[label] = lodash.head(column.maxs);
                                break;
                            case 'cardinality':
                                row[label] = (domain = column.domain) ? domain.length : null;
                                break;
                            default:
                                row[label] = column[label];
                            }
                        }
                        _results.push(row);
                    }
                    return _results;
                }();
                return Flow.Data.Table({
                    label: 'columns',
                    description: 'A list of columns in the H2O Frame.',
                    variables: variables,
                    rows: rows,
                    meta: { origin: 'getFrame ' + Flow.Prelude.stringify(frameKey) }
                });
            };
            inspectData = function () {
                var Record, column, frameColumns, i, j, row, rowCount, rows, value, variable, variables;
                frameColumns = frame.columns;
                variables = function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = frameColumns.length; _i < _len; _i++) {
                        column = frameColumns[_i];
                        switch (column.type) {
                        case 'int':
                            _results.push(Flow.Data.Variable(column.label, Flow.TNumber));
                            break;
                        case 'real':
                            _results.push(Flow.Data.Variable(column.label, Flow.TNumber));
                            break;
                        case 'enum':
                            _results.push(Flow.Data.Factor(column.label, column.domain));
                            break;
                        case 'uuid':
                        case 'string':
                            _results.push(Flow.Data.Variable(column.label, Flow.TString));
                            break;
                        case 'time':
                            _results.push(Flow.Data.Variable(column.label, Flow.TDate));
                            break;
                        default:
                            _results.push(Flow.Data.Variable(column.label, Flow.TObject));
                        }
                    }
                    return _results;
                }();
                Record = Flow.Data.Record(variables);
                rowCount = lodash.head(frame.columns).data.length;
                rows = function () {
                    var _i, _j, _len, _results;
                    _results = [];
                    for (i = _i = 0; 0 <= rowCount ? _i < rowCount : _i > rowCount; i = 0 <= rowCount ? ++_i : --_i) {
                        row = new Record();
                        for (j = _j = 0, _len = variables.length; _j < _len; j = ++_j) {
                            variable = variables[j];
                            value = frameColumns[j].data[i];
                            switch (variable.type) {
                            case Flow.TNumber:
                            case Flow.TNumber:
                                row[variable.label] = value === 'NaN' ? null : value;
                                break;
                            default:
                                row[variable.label] = value;
                            }
                        }
                        _results.push(row);
                    }
                    return _results;
                }();
                return Flow.Data.Table({
                    label: 'data',
                    description: 'A partial list of rows in the H2O Frame.',
                    variables: variables,
                    rows: rows,
                    meta: { origin: 'getFrame ' + Flow.Prelude.stringify(frameKey) }
                });
            };
            return inspect_(frame, {
                columns: inspectColumns,
                data: inspectData
            });
        };
        extendColumnSummary = function (frameKey, frame, columnName) {
            var column, inspectCharacteristics, inspectDistribution, inspectDomain, inspectPercentiles, inspectSummary, rowCount;
            column = lodash.head(frame.columns);
            rowCount = frame.rows;
            inspectPercentiles = function () {
                var Record, i, percentile, percentileValues, percentiles, row, rows, variables;
                percentiles = frame.default_pctiles;
                percentileValues = column.pctiles;
                variables = [
                    Flow.Data.Variable('percentile', Flow.TNumber),
                    Flow.Data.Variable('value', Flow.TNumber)
                ];
                Record = Flow.Data.Record(variables);
                rows = function () {
                    var _i, _len, _results;
                    _results = [];
                    for (i = _i = 0, _len = percentiles.length; _i < _len; i = ++_i) {
                        percentile = percentiles[i];
                        row = new Record();
                        row.percentile = percentile;
                        row.value = percentileValues[i];
                        _results.push(row);
                    }
                    return _results;
                }();
                return Flow.Data.Table({
                    label: 'percentiles',
                    description: 'Percentiles for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    variables: variables,
                    rows: rows,
                    meta: { origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName) }
                });
            };
            inspectDistribution = function () {
                var Record, base, binCount, binIndex, bins, count, distributionDataType, i, interval, m, minBinCount, n, row, rows, stride, variables, width, _i, _j, _k, _len;
                distributionDataType = column.type === 'int' ? Flow.TNumber : Flow.TNumber;
                variables = [
                    Flow.Data.Variable('intervalStart', Flow.TNumber),
                    Flow.Data.Variable('intervalEnd', Flow.TNumber),
                    Flow.Data.Variable('count', Flow.TNumber)
                ];
                Record = Flow.Data.Record(variables);
                minBinCount = 32;
                base = column.base, stride = column.stride, bins = column.bins;
                width = Math.floor(bins.length / minBinCount);
                interval = stride * width;
                rows = [];
                if (width > 0) {
                    binCount = minBinCount + (bins.length % width > 0 ? 1 : 0);
                    for (i = _i = 0; 0 <= binCount ? _i < binCount : _i > binCount; i = 0 <= binCount ? ++_i : --_i) {
                        m = i * width;
                        n = m + width;
                        count = 0;
                        for (binIndex = _j = m; m <= n ? _j < n : _j > n; binIndex = m <= n ? ++_j : --_j) {
                            if (n < bins.length) {
                                count += bins[binIndex];
                            }
                        }
                        row = new Record();
                        row.intervalStart = base + i * interval;
                        row.intervalEnd = row.intervalStart + interval;
                        row.count = count;
                        rows.push(row);
                    }
                } else {
                    for (i = _k = 0, _len = bins.length; _k < _len; i = ++_k) {
                        count = bins[i];
                        row = new Record();
                        row.intervalStart = base + i * stride;
                        row.intervalEnd = row.intervalStart + stride;
                        row.count = count;
                        rows.push(row);
                    }
                }
                return Flow.Data.Table({
                    label: 'distribution',
                    description: 'Distribution for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    variables: variables,
                    rows: rows,
                    meta: { origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName) }
                });
            };
            inspectCharacteristics = function () {
                var characteristics, count, domain, i, missing, ninfs, other, pinfs, rows, variables, zeros, _ref1;
                missing = column.missing, zeros = column.zeros, pinfs = column.pinfs, ninfs = column.ninfs;
                other = rowCount - missing - zeros - pinfs - ninfs;
                _ref1 = Flow.Data.factor([
                    'Missing',
                    '-Inf',
                    'Zero',
                    '+Inf',
                    'Other'
                ]), domain = _ref1[0], characteristics = _ref1[1];
                variables = [
                    {
                        label: 'characteristic',
                        type: Flow.TFactor,
                        domain: domain
                    },
                    {
                        label: 'count',
                        type: Flow.TNumber,
                        domain: [
                            0,
                            rowCount
                        ]
                    },
                    {
                        label: 'percent',
                        type: Flow.TNumber,
                        domain: [
                            0,
                            100
                        ]
                    }
                ];
                rows = function () {
                    var _i, _len, _ref2, _results;
                    _ref2 = [
                        missing,
                        ninfs,
                        zeros,
                        pinfs,
                        other
                    ];
                    _results = [];
                    for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
                        count = _ref2[i];
                        _results.push({
                            characteristic: characteristics[i],
                            count: count,
                            percent: 100 * count / rowCount
                        });
                    }
                    return _results;
                }();
                return Flow.Data.Table({
                    label: 'characteristics',
                    description: 'Characteristics for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    variables: variables,
                    rows: rows,
                    meta: {
                        origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName),
                        plot: 'plot\n  title: \'Characteristics for ' + frameKey + ' : ' + column.label + '\'\n  type: \'interval\'\n  data: inspect \'characteristics\', getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName) + '\n  x: plot.stack \'count\'\n  color: \'characteristic\''
                    }
                });
            };
            inspectSummary = function () {
                var defaultPercentiles, mean, outliers, percentiles, q1, q2, q3, row, variables;
                variables = [
                    {
                        label: 'mean',
                        type: Flow.TNumber
                    },
                    {
                        label: 'q1',
                        type: Flow.TNumber
                    },
                    {
                        label: 'q2',
                        type: Flow.TNumber
                    },
                    {
                        label: 'q3',
                        type: Flow.TNumber
                    },
                    {
                        label: 'outliers',
                        type: Flow.TArray
                    }
                ];
                defaultPercentiles = frame.default_pctiles;
                percentiles = column.pctiles;
                mean = column.mean;
                q1 = percentiles[defaultPercentiles.indexOf(0.25)];
                q2 = percentiles[defaultPercentiles.indexOf(0.5)];
                q3 = percentiles[defaultPercentiles.indexOf(0.75)];
                outliers = lodash.unique(column.mins.concat(column.maxs));
                row = {
                    mean: mean,
                    q1: q1,
                    q2: q2,
                    q3: q3,
                    outliers: outliers
                };
                return Flow.Data.Table({
                    label: 'summary',
                    description: 'Summary for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    variables: variables,
                    rows: [row],
                    meta: { origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName) }
                });
            };
            inspectDomain = function () {
                var Record, countVariable, level, levels, row, rows, sortedLevels, variables;
                levels = lodash.map(column.bins, function (count, index) {
                    return {
                        count: count,
                        index: index
                    };
                });
                sortedLevels = lodash.sortBy(levels, function (level) {
                    return -level.count;
                });
                variables = [
                    Flow.Data.Factor('label', column.domain),
                    countVariable = Flow.Data.Variable('count', Flow.TNumber),
                    Flow.Data.Variable('percent', Flow.TNumber, [
                        0,
                        100
                    ])
                ];
                Record = Flow.Data.Record(variables);
                rows = function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = sortedLevels.length; _i < _len; _i++) {
                        level = sortedLevels[_i];
                        row = new Record();
                        row.label = level.index;
                        row.count = countVariable.read(level.count);
                        row.percent = 100 * level.count / rowCount;
                        _results.push(row);
                    }
                    return _results;
                }();
                return Flow.Data.Table({
                    label: 'domain',
                    description: 'Domain for column \'' + column.label + '\' in frame \'' + frameKey + '\'.',
                    variables: variables,
                    rows: rows,
                    meta: {
                        origin: 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName),
                        plot: 'plot\n  title: \'Domain for ' + frameKey + ' : ' + column.label + '\'\n  type: \'interval\'\n  data: inspect \'domain\', getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName) + '\n  x: \'count\'\n  y: \'label\''
                    }
                });
            };
            switch (column.type) {
            case 'int':
            case 'real':
                return inspect_(frame, {
                    characteristics: inspectCharacteristics,
                    summary: inspectSummary,
                    distribution: inspectDistribution,
                    percentiles: inspectPercentiles
                });
            default:
                return inspect_(frame, {
                    characteristics: inspectCharacteristics,
                    domain: inspectDomain,
                    percentiles: inspectPercentiles
                });
            }
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
        getFrames = function () {
            return _fork(requestFrames);
        };
        getFrame = function (frameKey) {
            switch (Flow.Prelude.typeOf(frameKey)) {
            case 'String':
                return renderable(requestFrame, frameKey, function (frame, go) {
                    return go(null, H2O.FrameOutput(_, frame));
                });
            default:
                return assist(getFrame);
            }
        };
        getColumnSummary = function (frameKey, columnName) {
            return renderable(requestColumnSummary, frameKey, columnName, function (frame, go) {
                return go(null, H2O.ColumnSummaryOutput(_, frameKey, frame, columnName));
            });
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
            var futures, key;
            futures = function () {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = modelKeys.length; _i < _len; _i++) {
                    key = modelKeys[_i];
                    _results.push(_fork(_.requestModel, key));
                }
                return _results;
            }();
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
                    return go(null, H2O.JobOutput(_, lodash.head(result.jobs)));
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
        predict = function (modelKey, frameKey) {
            if (modelKey && frameKey) {
                return _fork(requestPredict, modelKey, frameKey);
            } else {
                return assist(predict, modelKey, frameKey);
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
            var frameKey, futures, modelKey, opt;
            if (lodash.isArray(opts)) {
                futures = function () {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = opts.length; _i < _len; _i++) {
                        opt = opts[_i];
                        modelKey = opt.model, frameKey = opt.frame;
                        _results.push(_fork(_.requestPredictions, modelKey, frameKey));
                    }
                    return _results;
                }();
                return Flow.Async.join(futures, function (error, predictions) {
                    var uniquePredictions;
                    if (error) {
                        return go(error);
                    } else {
                        uniquePredictions = lodash.values(lodash.indexBy(lodash.flatten(predictions, true), function (prediction) {
                            return prediction.model.key + prediction.frame.key.name;
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
        assist = function () {
            var args, func;
            func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            if (func === void 0) {
                return proceed(H2O.Assist, [_assistance]);
            } else {
                switch (func) {
                case importFiles:
                    return proceed(H2O.ImportFilesInput);
                case buildModel:
                    return proceed(H2O.ModelInput, args);
                case predict:
                case getPrediction:
                    return proceed(H2O.PredictInput, args);
                default:
                    return proceed(H2O.NoAssistView);
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
            inspect: inspect,
            plot: plot,
            grid: grid,
            get: _get,
            assist: assist,
            help: help,
            gui: gui,
            loadScript: loadScript,
            getJobs: getJobs,
            getJob: getJob,
            importFiles: importFiles,
            setupParse: setupParse,
            parseRaw: parseRaw,
            getFrames: getFrames,
            getFrame: getFrame,
            getColumnSummary: getColumnSummary,
            buildModel: buildModel,
            getModels: getModels,
            getModel: getModel,
            predict: predict,
            getPrediction: getPrediction,
            getPredictions: getPredictions
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
    H2O.ColumnSummaryOutput = function (_, frameKey, frame, columnName) {
        var column, histogram, inspect;
        column = lodash.head(frame.columns);
        histogram = _.inspect(frame).histogram;
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(columnName));
        };
        return {
            label: column.label,
            inspect: inspect,
            template: 'flow-column-summary-output'
        };
    };
}.call(this));
(function () {
    H2O.FrameOutput = function (_, _frame) {
        var createCardinalityRow, createDataRow, createDataRows, createFrameTable, createInfRow, createMeanRow, createMinMaxRow, createMissingsRow, createModel, createPlainRow, createSigmaRow, createSummaryRow, inspect;
        createMinMaxRow = function (attribute, columns) {
            return lodash.map(columns, function (column) {
                switch (column.type) {
                case 'time':
                    return Flow.Format.Date(lodash.head(column[attribute]));
                case 'real':
                    return Flow.Format.Real(column.precision)(lodash.head(column[attribute]));
                case 'int':
                    return Flow.Format.Digits(6, lodash.head(column[attribute]));
                default:
                    return '-';
                }
            });
        };
        createMeanRow = function (columns) {
            return lodash.map(columns, function (column) {
                switch (column.type) {
                case 'time':
                    return Flow.Format.Date(column.mean);
                case 'real':
                    return Flow.Format.Real(column.precision)(column.mean);
                case 'int':
                    return Flow.Format.Digits(6, column.mean);
                default:
                    return '-';
                }
            });
        };
        createSigmaRow = function (columns) {
            return lodash.map(columns, function (column) {
                switch (column.type) {
                case 'time':
                case 'real':
                case 'int':
                    return Flow.Format.Digits(6, column.sigma);
                default:
                    return '-';
                }
            });
        };
        createCardinalityRow = function (columns) {
            return lodash.map(columns, function (column) {
                switch (column.type) {
                case 'enum':
                    return column.domain.length;
                default:
                    return '-';
                }
            });
        };
        createPlainRow = function (attribute, columns) {
            return lodash.map(columns, function (column) {
                return column[attribute];
            });
        };
        createMissingsRow = function (columns) {
            return lodash.map(columns, function (column) {
                if (column.missing === 0) {
                    return '-';
                } else {
                    return column.missing;
                }
            });
        };
        createInfRow = function (attribute, columns) {
            return lodash.map(columns, function (column) {
                switch (column.type) {
                case 'real':
                case 'int':
                    if (column[attribute] === 0) {
                        return '-';
                    } else {
                        return column[attribute];
                    }
                    break;
                default:
                    return '-';
                }
            });
        };
        createSummaryRow = function (frameKey, columns) {
            return lodash.map(columns, function (column) {
                return {
                    displaySummary: function () {
                        return _.insertAndExecuteCell('cs', 'getColumnSummary ' + Flow.Prelude.stringify(frameKey) + ', ' + Flow.Prelude.stringify(column.label));
                    }
                };
            });
        };
        createDataRow = function (offset, index, columns) {
            return {
                header: 'Row ' + (offset + index + 1),
                cells: lodash.map(columns, function (column) {
                    var value;
                    switch (column.type) {
                    case 'uuid':
                    case 'string':
                        return column.str_data[index] || '-';
                    case 'enum':
                        return column.domain[column.data[index]];
                    case 'time':
                        return Flow.Format.Date(column.data[index]);
                    default:
                        value = column.data[index];
                        if (value === 'NaN') {
                            return '-';
                        } else {
                            if (column.type === 'real') {
                                return Flow.Format.Real(column.precision)(value);
                            } else {
                                return value;
                            }
                        }
                    }
                })
            };
        };
        createDataRows = function (offset, rowCount, columns) {
            var index, rows, _i;
            rows = [];
            for (index = _i = 0; 0 <= rowCount ? _i < rowCount : _i > rowCount; index = 0 <= rowCount ? ++_i : --_i) {
                rows.push(createDataRow(offset, index, columns));
            }
            return rows;
        };
        createFrameTable = function (offset, rowCount, columns) {
            var column, hasEnums, hasMissings, hasNinfs, hasPinfs, hasZeros, _i, _len;
            hasMissings = hasZeros = hasPinfs = hasNinfs = hasEnums = false;
            for (_i = 0, _len = columns.length; _i < _len; _i++) {
                column = columns[_i];
                if (!hasMissings && column.missing > 0) {
                    hasMissings = true;
                }
                if (!hasZeros && column.zeros > 0) {
                    hasZeros = true;
                }
                if (!hasPinfs && column.pinfs > 0) {
                    hasPinfs = true;
                }
                if (!hasNinfs && column.ninfs > 0) {
                    hasNinfs = true;
                }
                if (!hasEnums && column.type === 'enum') {
                    hasEnums = true;
                }
            }
            return {
                header: createPlainRow('label', columns),
                typeRow: createPlainRow('type', columns),
                minRow: createMinMaxRow('mins', columns),
                maxRow: createMinMaxRow('maxs', columns),
                meanRow: createMeanRow(columns),
                sigmaRow: createSigmaRow(columns),
                cardinalityRow: hasEnums ? createCardinalityRow(columns) : null,
                missingsRow: hasMissings ? createMissingsRow(columns) : null,
                zerosRow: hasZeros ? createInfRow('zeros', columns) : null,
                pinfsRow: hasPinfs ? createInfRow('pinfs', columns) : null,
                ninfsRow: hasNinfs ? createInfRow('ninfs', columns) : null,
                summaryRow: createSummaryRow(_frame.key.name, columns),
                hasMissings: hasMissings,
                hasZeros: hasZeros,
                hasPinfs: hasPinfs,
                hasNinfs: hasNinfs,
                hasEnums: hasEnums,
                dataRows: createDataRows(offset, rowCount, columns)
            };
        };
        createModel = function () {
            return _.insertAndExecuteCell('cs', 'assist buildModel, null, training_frame: ' + Flow.Prelude.stringify(_frame.key.name));
        };
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getFrame ' + Flow.Prelude.stringify(_frame.key.name));
        };
        return {
            data: _frame,
            key: _frame.key.name,
            timestamp: _frame.creation_epoch_time_millis,
            title: _frame.key.name,
            columns: _frame.column_names,
            table: createFrameTable(_frame.off, _frame.len, _frame.columns),
            dispose: function () {
            },
            inspect: inspect,
            createModel: createModel,
            template: 'flow-frame-output'
        };
    };
}.call(this));
(function () {
    H2O.FramesOutput = function (_, _frames) {
        var createFrameView, importFiles, toSize;
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
        createFrameView = function (frame) {
            var columnLabels, createModel, description, inspect, inspectColumns, inspectData, view;
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
            inspectColumns = function () {
                return _.insertAndExecuteCell('cs', 'grid inspect \'columns\', getFrame ' + Flow.Prelude.stringify(frame.key.name));
            };
            inspectData = function () {
                return _.insertAndExecuteCell('cs', 'grid inspect \'data\', getFrame ' + Flow.Prelude.stringify(frame.key.name));
            };
            inspect = function () {
                return _.insertAndExecuteCell('cs', 'inspect getFrame ' + Flow.Prelude.stringify(frame.key.name));
            };
            createModel = function () {
                return _.insertAndExecuteCell('cs', 'assist buildModel, null, training_frame: ' + Flow.Prelude.stringify(frame.key.name));
            };
            return {
                key: frame.key.name,
                description: description,
                size: toSize(frame.byteSize),
                rowCount: frame.rows,
                columnCount: frame.columns.length,
                isText: frame.isText,
                view: view,
                inspectColumns: inspectColumns,
                inspectData: inspectData,
                inspect: inspect,
                createModel: createModel
            };
        };
        importFiles = function () {
            return _.insertAndExecuteCell('cs', 'importFiles');
        };
        return {
            frameViews: lodash.map(_frames, createFrameView),
            hasFrames: _frames.length > 0,
            importFiles: importFiles,
            template: 'flow-frames-output'
        };
    };
}.call(this));
(function () {
    H2O.Help = function (_) {
        return {
            executeHelp: function () {
                return _.insertAndExecuteCell('cs', 'help');
            },
            executeAssist: function () {
                return _.insertAndExecuteCell('cs', 'assist');
            },
            template: 'flow-help'
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
            return _.requestFileGlob(specifiedPath, 0, function (error, result) {
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
        var createImportView, parse, _allKeys, _canParse, _importViews, _title;
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
    H2O.InspectOutput = function (_, _table) {
        var plot, view;
        view = function () {
            return _.insertAndExecuteCell('cs', 'grid inspect ' + Flow.Prelude.stringify(_table.label) + ', ' + _table.meta.origin);
        };
        plot = function () {
            return _.insertAndExecuteCell('cs', _table.meta.plot);
        };
        return {
            label: _table.label,
            variables: _table.variables,
            view: view,
            canPlot: _table.meta.plot ? true : false,
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
                return _.insertAndExecuteCell('cs', 'inspect ' + Flow.Prelude.stringify(table.label) + ', ' + table.meta.origin);
            };
            grid = function () {
                return _.insertAndExecuteCell('cs', 'grid inspect ' + Flow.Prelude.stringify(table.label) + ', ' + table.meta.origin);
            };
            plot = function () {
                return _.insertAndExecuteCell('cs', table.meta.plot);
            };
            return {
                label: table.label,
                description: table.description,
                variables: table.variables,
                inspect: inspect,
                grid: grid,
                canPlot: table.meta.plot ? true : false,
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
    var createCheckboxControl, createControl, createControlFromParameter, createDropdownControl, createListControl, createTextboxControl, findParameter;
    createControl = function (kind, parameter) {
        var _hasError, _hasInfo, _hasMessage, _hasWarning, _message;
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
        return {
            kind: kind,
            name: parameter.name,
            label: parameter.label,
            description: parameter.help,
            required: parameter.required,
            hasError: _hasError,
            hasWarning: _hasWarning,
            hasInfo: _hasInfo,
            message: _message,
            hasMessage: _hasMessage
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
        var control, _selection, _value;
        _value = Flow.Dataflow.signal(parameter.actual_value || []);
        _selection = Flow.Dataflow.lift(_value, function (items) {
            var caption;
            caption = '' + Flow.Util.describeCount(items.length, 'column') + ' selected';
            if (items.length > 0) {
                caption += ': ' + items.join(', ');
            }
            return '(' + caption + ')';
        });
        control = createControl('list', parameter);
        control.values = Flow.Dataflow.signals(parameter.values);
        control.value = _value;
        control.selection = _selection;
        control.defaultValue = parameter.default_value;
        return control;
    };
    createCheckboxControl = function (parameter) {
        var control, _value;
        _value = Flow.Dataflow.signal(parameter.actual_value === 'true');
        control = createControl('checkbox', parameter);
        control.clientId = lodash.uniqueId();
        control.value = _value;
        control.defaultValue = parameter.default_value === 'true';
        return control;
    };
    createControlFromParameter = function (parameter) {
        switch (parameter.type) {
        case 'enum':
        case 'Frame':
        case 'string':
            return createDropdownControl(parameter);
        case 'string[]':
            return createListControl(parameter);
        case 'boolean':
            return createCheckboxControl(parameter);
        case 'Key':
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
    findParameter = function (parameters, name) {
        return lodash.find(parameters, function (parameter) {
            return parameter.name === name;
        });
    };
    H2O.ModelBuilderForm = function (_, _algorithm, _parameters) {
        var collectParameters, createModel, criticalControls, expertControls, parameterTemplateOf, secondaryControls, _controls, _exception, _form, _parametersByLevel;
        _exception = Flow.Dataflow.signal(null);
        _parametersByLevel = lodash.groupBy(_parameters, function (parameter) {
            return parameter.level;
        });
        _controls = lodash.map([
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
        criticalControls = _controls[0], secondaryControls = _controls[1], expertControls = _controls[2];
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
        parameterTemplateOf = function (control) {
            return 'flow-' + control.kind + '-model-parameter';
        };
        (function () {
            var findFormField, ignoredColumnsParameter, responseColumnParameter, trainingFrameParameter, validationFrameParameter, _ref;
            findFormField = function (name) {
                return lodash.find(_form, function (field) {
                    return field.name === name;
                });
            };
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
        collectParameters = function (collectAll) {
            var control, controls, parameters, value, _i, _j, _len, _len1;
            if (collectAll == null) {
                collectAll = false;
            }
            parameters = {};
            for (_i = 0, _len = _controls.length; _i < _len; _i++) {
                controls = _controls[_i];
                for (_j = 0, _len1 = controls.length; _j < _len1; _j++) {
                    control = controls[_j];
                    value = control.value();
                    if (collectAll || control.defaultValue !== value) {
                        switch (control.kind) {
                        case 'dropdown':
                            if (value) {
                                parameters[control.name] = value;
                            }
                            break;
                        case 'list':
                            if (value.length) {
                                parameters[control.name] = '[' + value.join(',') + ']';
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
        createModel = function () {
            var parameters;
            _exception(null);
            parameters = collectParameters(false);
            return _.insertAndExecuteCell('cs', 'buildModel \'' + _algorithm + '\', ' + Flow.Prelude.stringify(parameters));
        };
        return {
            form: _form,
            exception: _exception,
            parameterTemplateOf: parameterTemplateOf,
            createModel: createModel
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
            return _.requestFrames(function (error, frames) {
                var frame, trainingFrameParameter;
                if (error) {
                } else {
                    trainingFrameParameter = findParameter(parameters, 'training_frame');
                    if (trainingFrameParameter) {
                        trainingFrameParameter.values = function () {
                            var _i, _len, _results;
                            _results = [];
                            for (_i = 0, _len = frames.length; _i < _len; _i++) {
                                frame = frames[_i];
                                if (!frame.isText) {
                                    _results.push(frame.key.name);
                                }
                            }
                            return _results;
                        }();
                        if (frameKey) {
                            trainingFrameParameter.actual_value = frameKey;
                        } else {
                            frameKey = trainingFrameParameter.actual_value;
                        }
                    }
                    return go();
                }
            });
        };
        (function () {
            return _.requestModelBuilders(function (error, result) {
                var frameKey, key;
                _algorithms(function () {
                    var _i, _len, _ref, _results;
                    _ref = lodash.keys(result.model_builders);
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
            return {
                label: parameter.label,
                value: parameter.actual_value,
                help: parameter.help,
                isModified: parameter.default_value === parameter.actual_value
            };
        });
        toggle = function () {
            return _isExpanded(!_isExpanded());
        };
        cloneModel = function () {
            return alert('Not implemented');
        };
        predict = function () {
            return _.insertAndExecuteCell('cs', 'predict ' + Flow.Prelude.stringify(_model.key));
        };
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect getModel ' + Flow.Prelude.stringify(_model.key));
        };
        return {
            key: _model.key,
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
        var buildModel, compareModels, createModelView, initialize, inspectAll, _canCompareModels, _checkAllModels, _isCheckingAll, _modelViews;
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
            var inspect, predict, view, _isChecked;
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
                return _.insertAndExecuteCell('cs', 'predict ' + Flow.Prelude.stringify(model.key));
            };
            lodash.clone = function () {
                return alert('Not implemented');
                return _.insertAndExecuteCell('cs', 'cloneModel ' + Flow.Prelude.stringify(model.key));
            };
            view = function () {
                return _.insertAndExecuteCell('cs', 'getModel ' + Flow.Prelude.stringify(model.key));
            };
            inspect = function () {
                return _.insertAndExecuteCell('cs', 'inspect getModel ' + Flow.Prelude.stringify(model.key));
            };
            return {
                key: model.key,
                isChecked: _isChecked,
                predict: predict,
                clone: lodash.clone,
                inspect: inspect,
                view: view
            };
        };
        buildModel = function () {
            return _.insertAndExecuteCell('cs', 'buildModel');
        };
        compareModels = function () {
            var view;
            lodash.keys = function () {
                var _i, _len, _ref, _results;
                _ref = _modelViews();
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    view = _ref[_i];
                    if (view.isChecked()) {
                        _results.push(view.key);
                    }
                }
                return _results;
            }();
            return _.insertAndExecuteCell('cs', 'inspect getModels ' + Flow.Prelude.stringify(lodash.keys));
        };
        inspectAll = function () {
            var view;
            lodash.keys = function () {
                var _i, _len, _ref, _results;
                _ref = _modelViews();
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    view = _ref[_i];
                    _results.push(view.key);
                }
                return _results;
            }();
            return _.insertAndExecuteCell('cs', 'inspect getModels ' + Flow.Prelude.stringify(lodash.keys));
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
            return _.insertAndExecuteCell('cs', 'getJob ' + Flow.Prelude.stringify(_result.job.name));
        };
        return {
            result: _result,
            viewJob: viewJob,
            template: 'flow-parse-output'
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
    H2O.PredictInput = function (_, modelKey, frameKey) {
        var predict, _canPredict, _exception, _frameKey, _frames, _hasFrame, _hasModel, _modelKey, _models;
        _exception = Flow.Dataflow.signal(null);
        _frameKey = Flow.Dataflow.signal(frameKey);
        _hasFrame = frameKey ? true : false;
        _modelKey = Flow.Dataflow.signal(modelKey);
        _hasModel = modelKey ? true : false;
        _canPredict = Flow.Dataflow.lift(_frameKey, _modelKey, function (frameKey, modelKey) {
            return frameKey && modelKey;
        });
        _frames = Flow.Dataflow.signals([]);
        _models = Flow.Dataflow.signals([]);
        if (!_hasFrame) {
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
        if (!_hasModel) {
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
                            _results.push(model.key);
                        }
                        return _results;
                    }());
                }
            });
        }
        predict = function () {
            return _.insertAndExecuteCell('cs', 'predict ' + Flow.Prelude.stringify(_modelKey()) + ', ' + Flow.Prelude.stringify(_frameKey()));
        };
        return {
            exception: _exception,
            hasModel: _hasModel,
            hasFrame: _hasFrame,
            canPredict: _canPredict,
            frame: _frameKey,
            model: _modelKey,
            frames: _frames,
            models: _models,
            predict: predict,
            template: 'flow-predict-input'
        };
    };
}.call(this));
(function () {
    H2O.PredictOutput = function (_, prediction) {
        var frame, inspect, model, _predictionTable;
        frame = prediction.frame, model = prediction.model;
        _predictionTable = _.inspect('prediction', prediction);
        inspect = function () {
            return _.insertAndExecuteCell('cs', 'inspect predict ' + Flow.Prelude.stringify(model.key) + ', ' + Flow.Prelude.stringify(frame.key.name));
        };
        return {
            predictionTable: _predictionTable,
            inspect: inspect,
            template: 'flow-predict-output'
        };
    };
}.call(this));
(function () {
    H2O.PredictsOutput = function (_, opts, _predictions) {
        var comparePredictions, createPredictionView, initialize, inspectAll, predict, _canComparePredictions, _checkAllPredictions, _isCheckingAll, _predictionTable, _predictionViews;
        _predictionViews = Flow.Dataflow.signal([]);
        _checkAllPredictions = Flow.Dataflow.signal(false);
        _canComparePredictions = Flow.Dataflow.signal(false);
        _isCheckingAll = false;
        Flow.Dataflow.react(_checkAllPredictions, function (checkAll) {
            var view, _i, _len, _ref;
            _isCheckingAll = true;
            _ref = _predictionViews();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                view = _ref[_i];
                view.isChecked(checkAll);
            }
            _canComparePredictions(checkAll);
            _isCheckingAll = false;
        });
        createPredictionView = function (prediction) {
            var inspect, view, _frameKey, _isChecked, _modelKey;
            _modelKey = prediction.model.key;
            _frameKey = prediction.frame.key.name;
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
                return _canComparePredictions(checkedViews.length > 1);
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
                isChecked: _isChecked,
                view: view,
                inspect: inspect
            };
        };
        _predictionTable = _.inspect('predictions', _predictions);
        comparePredictions = function () {
            var view;
            lodash.keys = function () {
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
            return _.insertAndExecuteCell('cs', 'getPredictions ' + Flow.Prelude.stringify(lodash.keys));
        };
        inspectAll = function () {
            return _.insertAndExecuteCell('cs', 'inspect ' + _predictionTable.meta.origin);
        };
        predict = function () {
            return _.insertAndExecuteCell('cs', 'predict');
        };
        initialize = function (predictions) {
            return _predictionViews(lodash.map(predictions, createPredictionView));
        };
        initialize(_predictions);
        return {
            predictionTable: _predictionTable,
            predictionViews: _predictionViews,
            hasPredictions: _predictions.length > 0,
            comparePredictions: comparePredictions,
            canComparePredictions: _canComparePredictions,
            checkAllPredictions: _checkAllPredictions,
            inspect: inspectAll,
            predict: predict,
            template: 'flow-predicts-output'
        };
    };
}.call(this));}).call(this);