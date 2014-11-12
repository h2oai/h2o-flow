Flow.Renderers = (_, _sandbox) ->
  h1: -> Flow.Heading _, 'h1'
  h2: -> Flow.Heading _, 'h2'
  h3: -> Flow.Heading _, 'h3'
  h4: -> Flow.Heading _, 'h4'
  h5: -> Flow.Heading _, 'h5'
  h6: -> Flow.Heading _, 'h6'
  md: -> Flow.Markdown _
  cs: (guid) -> Flow.Coffeescript _, guid, _sandbox
  raw: -> Flow.Raw _

Flow.Notebook = (_, _renderers) ->
  _cells = signals []
  _selectedCell = null
  _selectedCellIndex = -1
  _clipboardCell = null
  _lastDeletedCell = null
  _areInputsHidden = signal no
  _areOutputsHidden = signal no

  createCell = (type='cs', input='') ->
    Flow.Cell _, _renderers, type, input

  checkConsistency = ->
    selectionCount = 0
    for cell, i in _cells()
      unless cell
        error "index #{i} is empty"
      else
        if cell.isSelected()
          selectionCount++
    error "selected cell count = #{selectionCount}" if selectionCount isnt 1
    return

  selectCell = (target) ->
    return if _selectedCell is target
    _selectedCell.isSelected no if _selectedCell
    _selectedCell = target
    #TODO also set focus so that tabs don't jump to the first cell
    _selectedCell.isSelected yes
    _selectedCellIndex = _cells.indexOf _selectedCell
    checkConsistency()
    _selectedCell

  cloneCell = (cell) ->
    createCell cell.type(), cell.input()

  switchToCommandMode = ->
    _selectedCell.isActive no

  switchToEditMode = ->
    _selectedCell.isActive yes
    no

  convertCellToCode = ->
    _selectedCell.type 'cs'

  convertCellToHeading = (level) -> -> 
    _selectedCell.type "h#{level}"
    _selectedCell.execute()

  convertCellToMarkdown = ->
    _selectedCell.type 'md'
    _selectedCell.execute()

  convertCellToRaw = ->
    _selectedCell.type 'raw'
    _selectedCell.execute()

  copyCell = ->
    _clipboardCell = _selectedCell

  cutCell = ->
    copyCell()
    removeCell()

  deleteCell = ->
    _lastDeletedCell = _selectedCell
    removeCell()

  removeCell = ->
    cells = _cells()
    if cells.length > 1
      if _selectedCellIndex is cells.length - 1
        #TODO call dispose() on this cell
        splice _cells, _selectedCellIndex, 1
        selectCell cells[_selectedCellIndex - 1]
      else
        #TODO call dispose() on this cell
        splice _cells, _selectedCellIndex, 1
        selectCell cells[_selectedCellIndex]
    return
    
  insertCell = (index, cell) ->
    splice _cells, index, 0, cell
    selectCell cell
    cell

  insertCellAbove = (cell) ->
    insertCell _selectedCellIndex, cell

  insertCellBelow = (cell) ->
    insertCell _selectedCellIndex + 1, cell

  insertNewCellAbove = ->
    insertCellAbove createCell 'cs'

  insertNewCellBelow = ->
    insertCellBelow createCell 'cs'

  insertCellAboveAndRun = (type, input) ->
    cell = insertCellAbove createCell type, input
    cell.execute()

  insertCellBelowAndRun = (type, input) ->
    cell = insertCellBelow createCell type, input
    cell.execute()

  moveCellDown = ->
    cells = _cells()
    unless _selectedCellIndex is cells.length - 1
      splice _cells, _selectedCellIndex, 1
      _selectedCellIndex++
      splice _cells, _selectedCellIndex, 0, _selectedCell
    return

  moveCellUp = ->
    unless _selectedCellIndex is 0
      cells = _cells()
      splice _cells, _selectedCellIndex, 1
      _selectedCellIndex--
      splice _cells, _selectedCellIndex, 0, _selectedCell
    return

  mergeCellBelow = ->
    cells = _cells()
    unless _selectedCellIndex is cells.length - 1
      nextCell = cells[_selectedCellIndex + 1]
      if _selectedCell.type() is nextCell.type()
        nextCell.input _selectedCell.input() + '\n' + nextCell.input()
        removeCell()
    return

  splitCell = ->
    if _selectedCell.isActive()
      input = _selectedCell.input()
      if input.length > 1
        cursorPosition = _selectedCell.cursorPosition()
        if 0 < cursorPosition < input.length - 1
          left = substr input, 0, cursorPosition
          right = substr input, cursorPosition
          _selectedCell.input left
          insertCell _selectedCellIndex + 1, createCell 'cs', right
          _selectedCell.isActive yes
    return

  pasteCellAbove = ->
    insertCell _selectedCellIndex, cloneCell _clipboardCell if _clipboardCell

  pasteCellBelow = ->
    insertCell _selectedCellIndex + 1, cloneCell _clipboardCell if _clipboardCell

  undoLastDelete = ->
    insertCell _selectedCellIndex + 1, _lastDeletedCell if _lastDeletedCell
    _lastDeletedCell = null

  runCell = ->
    _selectedCell.execute()
    no

  runCellAndInsertBelow = ->
    _selectedCell.execute -> insertNewCellBelow()
    no

  #TODO ipython has inconsistent behavior here. seems to be doing runCellAndInsertBelow if executed on the lowermost cell.
  runCellAndSelectBelow = ->
    _selectedCell.execute -> selectNextCell()
    no

  saveFlow = ->
    debug 'saveFlow'
    no

  toggleInput = ->
    _selectedCell.toggleInput()

  toggleOutput = ->
    _selectedCell.toggleOutput()

  toggleAllInputs = ->
    _areInputsHidden not _areInputsHidden()

  toggleAllOutputs = ->
    _areOutputsHidden not _areOutputsHidden()

  selectNextCell = ->
    cells = _cells()
    unless _selectedCellIndex is cells.length - 1
      selectCell cells[_selectedCellIndex + 1]
    return no # prevent arrow keys from scrolling the page

  selectPreviousCell = ->
    unless _selectedCellIndex is 0
      cells = _cells()
      selectCell cells[_selectedCellIndex - 1]
    return no # prevent arrow keys from scrolling the page

  displayKeyboardShortcuts = ->
    $('#keyboardShortcutsDialog').modal()

  notImplemented = -> # noop
  createNewFile = notImplemented
  openFile = notImplemented
  copyFile = notImplemented
  renameFile = notImplemented
  saveAndCheckpoint = notImplemented
  revertToCheckpoint = notImplemented
  printPreview = notImplemented
  pasteCellandReplace = notImplemented
  mergeCellAbove = notImplemented
  switchToPresentationMode = notImplemented 
  runAllCells = notImplemented
  clearCell = notImplemented
  clearAllCells = notImplemented
  startTour = notImplemented
  goToWebsite = (url) -> notImplemented

  #
  # Top menu bar
  #

  createMenu = (label, items) ->
    label: label
    items: items

  createMenuItem = (label, action, isDisabled=no) ->
    label: label
    action: action
    isAction: yes
    isDisabled: isDisabled

  menuDivider = isAction: no

  _menus = [
    createMenu 'File', [
      createMenuItem 'New', createNewFile, yes
      createMenuItem 'Open...', openFile, yes
      menuDivider
      createMenuItem 'Make a Copy', copyFile, yes
      createMenuItem 'Rename...', renameFile, yes
      createMenuItem 'Save and Checkpoint...', saveAndCheckpoint, yes
      menuDivider
      createMenuItem 'Revert to Checkpoint...', revertToCheckpoint, yes
      menuDivider
      createMenuItem 'Print Preview', printPreview, yes
    ]
  ,
    createMenu 'Edit', [
      createMenuItem 'Cut Cell', cutCell
      createMenuItem 'Copy Cell', copyCell
      createMenuItem 'Paste Cell Above', pasteCellAbove
      createMenuItem 'Paste Cell Below', pasteCellBelow
      createMenuItem 'Paste Cell and Replace', pasteCellandReplace, yes
      createMenuItem 'Delete Cell', deleteCell
      createMenuItem 'Undo Delete Cell', undoLastDelete
      menuDivider
      createMenuItem 'Insert Cell Above', insertNewCellAbove
      createMenuItem 'Insert Cell Below', insertNewCellBelow
      menuDivider
      createMenuItem 'Split Cell', splitCell
      createMenuItem 'Merge Cell Above', mergeCellAbove, yes
      createMenuItem 'Merge Cell Below', mergeCellBelow
      menuDivider
      createMenuItem 'Move Cell Up', moveCellUp
      createMenuItem 'Move Cell Down', moveCellDown
    ]
  ,
    createMenu 'View', [
      createMenuItem 'Toggle Input', toggleInput
      createMenuItem 'Toggle Output', toggleOutput
      menuDivider
      createMenuItem 'Toggle All Inputs', toggleAllInputs
      createMenuItem 'Toggle All Outputs', toggleAllOutputs
      menuDivider
      createMenuItem 'Presentation Mode', switchToPresentationMode, yes
    ]
  ,
    createMenu 'Format', [
      createMenuItem 'Code', convertCellToCode
      menuDivider
      createMenuItem 'Heading 1', (convertCellToHeading 1)
      createMenuItem 'Heading 2', (convertCellToHeading 2)
      createMenuItem 'Heading 3', (convertCellToHeading 3)
      createMenuItem 'Heading 4', (convertCellToHeading 4)
      createMenuItem 'Heading 5', (convertCellToHeading 5)
      createMenuItem 'Heading 6', (convertCellToHeading 6)
      createMenuItem 'Markdown', convertCellToMarkdown
      createMenuItem 'Raw', convertCellToRaw
    ]
  ,
    createMenu 'Run', [
      createMenuItem 'Run', runCell
      createMenuItem 'Run and Select Below', runCellAndSelectBelow
      createMenuItem 'Run and Insert Below', runCellAndInsertBelow
      menuDivider
      createMenuItem 'Run All', runAllCells, yes
      menuDivider
      createMenuItem 'Clear Cell', clearCell, yes
      menuDivider
      createMenuItem 'Clear All', clearAllCells, yes
    ]
  ,
    createMenu 'Help', [
      createMenuItem 'Tour', startTour, yes
      createMenuItem 'Keyboard Shortcuts', displayKeyboardShortcuts
      menuDivider
      createMenuItem 'H2O Documentation', (goToWebsite 'http://docs.0xdata.com/'), yes
      createMenuItem '0xdata.com', (goToWebsite 'http://0xdata.com/'), yes
    ]
  ]

  createTool = (icon, label, action, isDisabled=no) ->
    label: label
    action: action
    isDisabled: isDisabled
    icon: "fa fa-#{icon}"

  _toolbar = [
    [
      createTool 'save', 'Save', saveAndCheckpoint, yes
    ]
  ,
    [
      createTool 'plus', 'Insert Cell Below', insertNewCellBelow
      createTool 'arrow-up', 'Move Cell Up', moveCellUp
      createTool 'arrow-down', 'Move Cell Down', moveCellDown
    ]
  ,
    [
      createTool 'cut', 'Cut Cell', cutCell
      createTool 'copy', 'Copy Cell', copyCell
      createTool 'paste', 'Paste Cell Below', pasteCellBelow
    ]
  ,
    [
      createTool 'play', 'Run', runCell
    ]
  ]

  # (From IPython Notebook keyboard shortcuts dialog)
  # The IPython Notebook has two different keyboard input modes. Edit mode allows you to type code/text into a cell and is indicated by a green cell border. Command mode binds the keyboard to notebook level actions and is indicated by a grey cell border.
  # 
  # Command Mode (press Esc to enable)
  # 
  normalModeKeyboardShortcuts = [
    [ 'enter', 'edit mode', switchToEditMode ]
    #[ 'shift+enter', 'run cell, select below', runCellAndSelectBelow ]
    #[ 'ctrl+enter', 'run cell', runCell ]
    #[ 'alt+enter', 'run cell, insert below', runCellAndInsertBelow ]
    [ 'y', 'to code', convertCellToCode ]
    [ 'm', 'to markdown', convertCellToMarkdown ]
    [ 'r', 'to raw', convertCellToRaw ]
    [ '1', 'to heading 1', convertCellToHeading 1 ]
    [ '2', 'to heading 2', convertCellToHeading 2 ]
    [ '3', 'to heading 3', convertCellToHeading 3 ]
    [ '4', 'to heading 4', convertCellToHeading 4 ]
    [ '5', 'to heading 5', convertCellToHeading 5 ]
    [ '6', 'to heading 6', convertCellToHeading 6 ]
    [ 'up', 'select previous cell', selectPreviousCell ]
    [ 'down', 'select next cell', selectNextCell ]
    [ 'k', 'select previous cell', selectPreviousCell ]
    [ 'j', 'select next cell', selectNextCell ]
    [ 'ctrl+k', 'move cell up', moveCellUp ]
    [ 'ctrl+j', 'move cell down', moveCellDown ]
    [ 'a', 'insert cell above', insertNewCellAbove ]
    [ 'b', 'insert cell below', insertNewCellBelow ]
    [ 'x', 'cut cell', cutCell ]
    [ 'c', 'copy cell', copyCell ]
    [ 'shift+v', 'paste cell above', pasteCellAbove ]
    [ 'v', 'paste cell below', pasteCellBelow ]
    [ 'z', 'undo last delete', undoLastDelete ]
    [ 'd d', 'delete cell (press twice)', deleteCell ]
    [ 'shift+m', 'merge cell below', mergeCellBelow ]
    [ 's', 'save notebook', saveFlow ]
    #[ 'mod+s', 'save notebook', saveFlow ]
    # [ 'l', 'toggle line numbers' ]
    [ 'o', 'toggle output', toggleOutput ]
    # [ 'shift+o', 'toggle output scrolling' ]
    # [ 'q', 'close pager' ]
    [ 'h', 'keyboard shortcuts', displayKeyboardShortcuts ]
    # [ 'i', 'interrupt kernel (press twice)' ]
    # [ '0', 'restart kernel (press twice)' ]
  ] 

  # 
  # Edit Mode (press Enter to enable) 
  # 
  editModeKeyboardShortcuts = [
    # Tab : code completion or indent
    # Shift-Tab : tooltip
    # Cmd-] : indent
    # Cmd-[ : dedent
    # Cmd-a : select all
    # Cmd-z : undo
    # Cmd-Shift-z : redo
    # Cmd-y : redo
    # Cmd-Up : go to cell start
    # Cmd-Down : go to cell end
    # Opt-Left : go one word left
    # Opt-Right : go one word right
    # Opt-Backspace : del word before
    # Opt-Delete : del word after
    [ 'esc', 'command mode', switchToCommandMode ]
    [ 'ctrl+m', 'command mode', switchToCommandMode ]
    [ 'shift+enter', 'run cell, select below', runCellAndSelectBelow ]
    [ 'ctrl+enter', 'run cell', runCell ]
    [ 'alt+enter', 'run cell, insert below', runCellAndInsertBelow ]
    [ 'ctrl+shift+-', 'split cell', splitCell ]
    [ 'mod+s', 'save notebook', saveFlow ]
  ]
  
  toKeyboardHelp = (shortcut) ->
    [ sequence, caption ] = shortcut
    keystrokes = join (map (split sequence, /\+/g), (key) -> "<kbd>#{key}</kbd>"), ' '
    keystrokes: keystrokes
    caption: caption

  normalModeKeyboardShortcutsHelp = map normalModeKeyboardShortcuts, toKeyboardHelp
  editModeKeyboardShortcutsHelp = map editModeKeyboardShortcuts, toKeyboardHelp


  setupKeyboardHandling = (mode) ->
    for [ shortcut, caption, f ] in normalModeKeyboardShortcuts
      Mousetrap.bind shortcut, f

    for [ shortcut, caption, f ] in editModeKeyboardShortcuts
      Mousetrap.bindGlobal shortcut, f
    return

  initialize = ->
    setupKeyboardHandling 'normal'
   
    insertNewCellBelow()

    link _.selectCell, selectCell
    link _.insertAndExecuteCell, (type, input) ->
      defer insertCellBelowAndRun, type, input

  link _.ready, initialize

  #XXX externalize
  executeHelp: -> _.insertAndExecuteCell 'cs', 'help'
  #XXX externalize
  executeAssist: -> _.insertAndExecuteCell 'cs', 'assist'
  menus: _menus
  toolbar: _toolbar
  cells: _cells
  areInputsHidden: _areInputsHidden
  areOutputsHidden: _areOutputsHidden
  shortcutsHelp:
    normalMode: normalModeKeyboardShortcutsHelp
    editMode: editModeKeyboardShortcutsHelp
  templateOf: (view) -> view.template

