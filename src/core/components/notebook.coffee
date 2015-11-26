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
  _localName = signal 'Untitled Flow'
  react _localName, (name) ->
    document.title = 'H2O' + if name and name.trim() then "- #{name}" else ''

  _remoteName = signal null

  _isEditingName = signal no
  editName = -> _isEditingName yes
  saveName = -> _isEditingName no

  _cells = signals []
  _selectedCell = null
  _selectedCellIndex = -1
  _clipboardCell = null
  _lastDeletedCell = null
  _areInputsHidden = signal no
  _areOutputsHidden = signal no
  _isSidebarHidden = signal no
  _isRunningAll = signal no
  _runningCaption = signal 'Running'
  _runningPercent = signal '0%'
  _runningCellInput = signal ''
  _status = Flow.Status _
  _sidebar = Flow.Sidebar _, _cells
  _about = Flow.About _
  _dialogs = Flow.Dialogs _
  _intp_id = undefined

  #initialize the interpreter when the notebook is creted
  #one interpreter is shared by all scala cells
  _initializeInterpreter = ->
    _.requestScalaIntp (error,response) ->
      if error
        # Handle the error
        _intp_id = undefined
      else
        _intp_id = response.session_id

  serialize = ->
    cells = for cell in _cells()
      type: cell.type()
      input: cell.input()

    version: '1.0.0'
    cells: cells

  deserialize = (localName, remoteName, doc) ->
    _localName localName
    _remoteName remoteName

    cells = for cell in doc.cells
      createCell cell.type, cell.input
    _cells cells

    selectCell head cells

    # Execute all non-code cells (headings, markdown, etc.)
    for cell in _cells()
      cell.execute() unless cell.isCode() 

    return

  createCell = (type='cs', input='') ->
    Flow.Cell _, _renderers, type, input


  createScalaCell = (input='') ->
    cell = Flow.ScalaCell _, _renderers, _intp_id, input
    cell

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

  selectCell = (target, scrollIntoView=yes, scrollImmediately=no) ->
    return if _selectedCell is target
    _selectedCell.isSelected no if _selectedCell
    _selectedCell = target
    #TODO also set focus so that tabs don't jump to the first cell
    _selectedCell.isSelected yes
    _selectedCellIndex = _cells.indexOf _selectedCell
    checkConsistency()
    if scrollIntoView
      defer ->
        _selectedCell.scrollIntoView scrollImmediately
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
        removedCell = head splice _cells, _selectedCellIndex, 1
        selectCell cells[_selectedCellIndex - 1]
      else
        #TODO call dispose() on this cell
        removedCell = head splice _cells, _selectedCellIndex, 1
        selectCell cells[_selectedCellIndex]
      _.saveClip 'trash', removedCell.type(), removedCell.input() if removedCell
    return
    
  insertCell = (index, cell) ->
    splice _cells, index, 0, cell
    selectCell cell
    cell

  insertAbove = (cell) ->
    insertCell _selectedCellIndex, cell

  insertBelow = (cell) ->
    insertCell _selectedCellIndex + 1, cell

  appendCell = (cell) ->
    insertCell _cells().length, cell

  insertCellAbove = (type, input) ->
    insertAbove createCell type, input

  insertCellBelow = (type, input) ->
    insertBelow createCell type, input

  insertNewCellAbove = ->
    insertAbove createCell 'cs'

  insertNewCellBelow = ->
    insertBelow createCell 'cs'

  insertNewScalaCellAbove = ->
    insertAbove createScalaCell()

  insertNewScalaCellBelow = ->
    insertBelow createScalaCell()

  insertCellAboveAndRun = (type, input) ->
    cell = insertAbove createCell type, input
    cell.execute()
    cell

  insertCellBelowAndRun = (type, input) ->
    cell = insertBelow createCell type, input
    cell.execute()
    cell

  appendCellAndRun = (type, input) ->
    cell = appendCell createCell type, input 
    cell.execute()
    cell


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
        cursorPosition = _selectedCell.getCursorPosition()
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

  checkIfNameIsInUse = (name, go) ->
    _.requestObjectExists 'notebook', name, (error, exists) -> go exists

  storeNotebook = (localName, remoteName) ->
    _.requestPutObject 'notebook', localName, serialize(), (error) ->
      if error
        _.alert "Error saving notebook: #{error.message}"
      else
        _remoteName localName
        _localName localName
        if remoteName isnt localName # renamed document
          _.requestDeleteObject 'notebook', remoteName, (error) ->
            if error
              _.alert "Error deleting remote notebook [#{remoteName}]: #{error.message}"
            _.saved()
        else
          _.saved()

  saveNotebook = ->
    localName = Flow.Util.sanitizeName _localName()
    return _.alert 'Invalid notebook name.' if localName is ''

    remoteName = _remoteName()
    if remoteName # saved document
      storeNotebook localName, remoteName
    else # unsaved document
      checkIfNameIsInUse localName, (isNameInUse) ->
        if isNameInUse
          _.confirm "A notebook with that name already exists.\nDo you want to replace it with the one you're saving?", { acceptCaption: 'Replace', declineCaption: 'Cancel' }, (accept) ->
            if accept
              storeNotebook localName, remoteName
        else
          storeNotebook localName, remoteName
    return

  promptForNotebook = ->
    _.dialog Flow.FileOpenDialog, (result) ->
      if result
        { error, filename } = result
        if error
          _.growl error.message ? error
        else
          loadNotebook filename
          _.loaded()

  uploadFile = ->
    _.dialog Flow.FileUploadDialog, (result) ->
      if result
        { error } = result
        if error
          _.growl error.message ? error
        else
          _.growl 'File uploaded successfully!'
          _.insertAndExecuteCell 'cs', "setupParse source_frames: [ #{stringify result.result.destination_frame }]"

  toggleInput = ->
    _selectedCell.toggleInput()

  toggleOutput = ->
    _selectedCell.toggleOutput()

  toggleAllInputs = ->
    wereHidden = _areInputsHidden()
    _areInputsHidden not wereHidden
    #
    # If cells are generated while inputs are hidden, the input boxes
    #   do not resize to fit contents. So explicitly ask all cells 
    #   to resize themselves.
    #
    if wereHidden
      for cell in _cells()
        cell.autoResize()
    return

  toggleAllOutputs = ->
    _areOutputsHidden not _areOutputsHidden()

  toggleSidebar = ->
    _isSidebarHidden not _isSidebarHidden()

  showBrowser = ->
    _isSidebarHidden no
    _.showBrowser()

  showOutline = ->
    _isSidebarHidden no
    _.showOutline()

  showClipboard = ->
    _isSidebarHidden no
    _.showClipboard()

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
    $('#keyboardHelpDialog').modal()

  findBuildProperty = (caption) ->
    if Flow.BuildProperties
      if entry = (find Flow.BuildProperties, (entry) -> entry.caption is caption)
        entry.value
      else
        undefined
    else
      undefined


  getBuildProperties = ->
    projectVersion = findBuildProperty 'H2O Build project version' 
    [
      findBuildProperty 'H2O Build git branch'
      projectVersion
      if projectVersion then last projectVersion.split '.' else undefined
      (findBuildProperty 'H2O Build git hash') or 'master'
    ]

  displayDocumentation = ->
    [ gitBranch, projectVersion, buildVersion, gitHash ] = getBuildProperties()

    if buildVersion and buildVersion isnt '99999'
      window.open "http://h2o-release.s3.amazonaws.com/h2o/#{gitBranch}/#{buildVersion}/docs-website/h2o-docs/index.html", '_blank'
    else
      window.open "https://github.com/h2oai/h2o-3/blob/#{gitHash}/h2o-docs/src/product/flow/README.md", '_blank'

  displayFAQ = ->
    [ gitBranch, projectVersion, buildVersion, gitHash ] = getBuildProperties()

    if buildVersion and buildVersion isnt '99999'
      window.open "http://h2o-release.s3.amazonaws.com/h2o/#{gitBranch}/#{buildVersion}/docs-website/h2o-docs/index.html", '_blank'
    else
      window.open "https://github.com/h2oai/h2o-3/blob/#{gitHash}/h2o-docs/src/product/howto/FAQ.md", '_blank'

  executeCommand = (command) -> ->
    _.insertAndExecuteCell 'cs', command

  displayAbout = ->
    $('#aboutDialog').modal()

  shutdown = ->
    _.requestShutdown (error, result) ->
      if error
        _.growl "Shutdown failed: #{error.message}", 'danger'
      else
        _.growl 'Shutdown complete!', 'warning'


  showHelp = ->
    _isSidebarHidden no
    _.showHelp()

  createNotebook = ->
    _.confirm 'This action will replace your active notebook.\nAre you sure you want to continue?', { acceptCaption: 'Create New Notebook', declineCaption: 'Cancel' }, (accept) ->
      if accept
        currentTime = (new Date()).getTime()
        deserialize 'Untitled Flow', null,
          cells: [
            type: 'cs'
            input: ''
          ]

  duplicateNotebook = ->
    deserialize "Copy of #{_localName()}", null, serialize()

  openNotebook = (name, doc) ->
    deserialize name, null, doc

  loadNotebook = (name) ->
    _.requestObject 'notebook', name, (error, doc) ->
      if error
        _.alert error.message ? error
      else
        deserialize name, name, doc

  exportNotebook = ->
    if remoteName = _remoteName()
      window.open "/3/NodePersistentStorage.bin/notebook/#{remoteName}", '_blank'
    else
      _.alert "Please save this notebook before exporting."

  goToUrl = (url) -> ->
    window.open url, '_blank'

  executeAllCells = (fromBeginning, go) ->
    _isRunningAll yes

    cells = slice _cells(), 0
    cellCount = cells.length
    cellIndex = 0

    unless fromBeginning
      cells = slice cells, _selectedCellIndex
      cellIndex = _selectedCellIndex

    executeNextCell = ->
      if _isRunningAll() # will be false if user-aborted
        cell = shift cells
        if cell
          # Scroll immediately without affecting selection state.
          cell.scrollIntoView yes

          cellIndex++
          _runningCaption "Running cell #{cellIndex} of #{cellCount}"
          _runningPercent "#{floor 100 * cellIndex/cellCount}%"
          _runningCellInput cell.input()

          #TODO Continuation should be EFC, and passing an error should abort 'run all'
          cell.execute (errors) ->
            if errors
              go 'failed', errors
            else
              executeNextCell()
        else
          go 'done'
      else 
        go 'aborted'

    executeNextCell()

  runAllCells = (fromBeginning=yes) ->
    executeAllCells fromBeginning, (status) ->
      _isRunningAll no
      switch status
        when 'aborted'
          _.growl 'Stopped running your flow.', 'warning'
        when 'failed'
          _.growl 'Failed running your flow.', 'danger'
        else # 'done'
          _.growl 'Finished running your flow!', 'success'

  continueRunningAllCells = -> runAllCells no

  stopRunningAll = ->
    _isRunningAll no

  clearCell = ->
    _selectedCell.clear()
    _selectedCell.autoResize()

  clearAllCells = ->
    for cell in _cells()
      cell.clear()
      cell.autoResize()
    return

  notImplemented = -> # noop
  pasteCellandReplace = notImplemented
  mergeCellAbove = notImplemented
  startTour = notImplemented

  #
  # Top menu bar
  #

  createMenu = (label, items) ->
    label: label
    items: items

  createMenuHeader = (label) ->
    label: label
    action: null

  createShortcutHint = (shortcut) ->
    "<span style='float:right'>" + (map shortcut, (key) -> "<kbd>#{ key }</kbd>").join(' ') + "</span>"

  createMenuItem = (label, action, shortcut) ->
    kbds = if shortcut
      createShortcutHint shortcut
    else
      ''

    label: "#{ escape label }#{ kbds }"
    action: action

  menuDivider = label: null, action: null

  _menus = signal null

  menuCell = [
        createMenuItem 'Run Cell', runCell, ['ctrl', 'enter']
        menuDivider
        createMenuItem 'Cut Cell', cutCell, ['x']
        createMenuItem 'Copy Cell', copyCell, ['c']
        createMenuItem 'Paste Cell Above', pasteCellAbove, ['shift', 'v']
        createMenuItem 'Paste Cell Below', pasteCellBelow, ['v']
        #TODO createMenuItem 'Paste Cell and Replace', pasteCellandReplace, yes
        createMenuItem 'Delete Cell', deleteCell, ['d', 'd']
        createMenuItem 'Undo Delete Cell', undoLastDelete, ['z']
        menuDivider
        createMenuItem 'Move Cell Up', moveCellUp, ['ctrl', 'k']
        createMenuItem 'Move Cell Down', moveCellDown, ['ctrl', 'j']
        menuDivider
        createMenuItem 'Insert Cell Above', insertNewCellAbove, ['a']
        createMenuItem 'Insert Cell Below', insertNewCellBelow, ['b']
        #TODO createMenuItem 'Split Cell', splitCell
        #TODO createMenuItem 'Merge Cell Above', mergeCellAbove, yes
        #TODO createMenuItem 'Merge Cell Below', mergeCellBelow
        menuDivider
        createMenuItem 'Toggle Cell Input', toggleInput
        createMenuItem 'Toggle Cell Output', toggleOutput, ['o']
        createMenuItem 'Clear Cell Output', clearCell
        ]

  menuCellSW = [
        menuDivider
        createMenuItem 'Insert Scala Cell Above', insertNewScalaCellAbove
        createMenuItem 'Insert Scala Cell Below', insertNewScalaCellBelow
        ]
  if _.onSparklingWater
    menuCell = [menuCell..., menuCellSW...]

  initializeMenus = (builder) ->
    modelMenuItems = map(builder, (builder) ->
      createMenuItem "#{ builder.algo_full_name }...", executeCommand "buildModel #{stringify builder.algo}"
    ).concat [
      menuDivider
      createMenuItem 'List All Models', executeCommand 'getModels'
      createMenuItem 'List Grid Search Results', executeCommand 'getGrids'
      createMenuItem 'Import Model...', executeCommand 'importModel'
      createMenuItem 'Export Model...', executeCommand 'exportModel'
    ]

    [
      createMenu 'Flow', [
        createMenuItem 'New Flow', createNotebook
        createMenuItem 'Open Flow...', promptForNotebook
        createMenuItem 'Save Flow', saveNotebook, ['s']
        createMenuItem 'Make a Copy...', duplicateNotebook
        menuDivider
        createMenuItem 'Run All Cells', runAllCells
        createMenuItem 'Run All Cells Below', continueRunningAllCells
        menuDivider
        createMenuItem 'Toggle All Cell Inputs', toggleAllInputs
        createMenuItem 'Toggle All Cell Outputs', toggleAllOutputs
        createMenuItem 'Clear All Cell Outputs', clearAllCells
        menuDivider
        createMenuItem 'Download this Flow...', exportNotebook 
      ]
    ,
      createMenu 'Cell', menuCell
    ,
      createMenu 'Data', [
        createMenuItem 'Import Files...', executeCommand 'importFiles'
        createMenuItem 'Upload File...', uploadFile
        createMenuItem 'Split Frame...', executeCommand 'splitFrame'
        menuDivider
        createMenuItem 'List All Frames', executeCommand 'getFrames'
        menuDivider
        createMenuItem 'Impute...', executeCommand 'imputeColumn'
        #TODO Quantiles
        #TODO Interaction
      ]
    ,
      createMenu 'Model', modelMenuItems
    ,
      createMenu 'Score', [
        createMenuItem 'Predict...', executeCommand 'predict'
        menuDivider
        createMenuItem 'List All Predictions', executeCommand 'getPredictions'
        #TODO Confusion Matrix
        #TODO AUC
        #TODO Hit Ratio
        #TODO PCA Score
        #TODO Gains/Lift Table
        #TODO Multi-model Scoring
      ]
    ,
      createMenu 'Admin', [
        createMenuItem 'Jobs', executeCommand 'getJobs'
        createMenuItem 'Cluster Status', executeCommand 'getCloud'
        createMenuItem 'Water Meter (CPU meter)', goToUrl '/perfbar.html'
        menuDivider
        createMenuHeader 'Inspect Log'
        createMenuItem 'View Log', executeCommand 'getLogFile'
        createMenuItem 'Download Logs', goToUrl '/Logs/download'
        menuDivider
        createMenuHeader 'Advanced'
        createMenuItem 'Create Synthetic Frame...', executeCommand 'createFrame'
        createMenuItem 'Stack Trace', executeCommand 'getStackTrace'
        createMenuItem 'Network Test', executeCommand 'testNetwork'
        #TODO Cluster I/O
        createMenuItem 'Profiler', executeCommand 'getProfile depth: 10'
        createMenuItem 'Timeline', executeCommand 'getTimeline'
        #TODO UDP Drop Test
        #TODO Task Status
        createMenuItem 'Shut Down', shutdown
      ]
    ,
      createMenu 'Help', [
        #TODO createMenuItem 'Tour', startTour, yes
        createMenuItem 'Assist Me', executeCommand 'assist'
        menuDivider
        createMenuItem 'Contents', showHelp
        createMenuItem 'Keyboard Shortcuts', displayKeyboardShortcuts, ['h']
        menuDivider
        createMenuItem 'Documentation', displayDocumentation
        createMenuItem 'FAQ', displayFAQ
        createMenuItem 'H2O.ai', goToUrl 'http://h2o.ai/'
        createMenuItem 'H2O on Github', goToUrl 'https://github.com/h2oai/h2o-3'
        createMenuItem 'Report an issue', goToUrl 'http://jira.h2o.ai'
        createMenuItem 'Forum / Ask a question', goToUrl 'https://groups.google.com/d/forum/h2ostream'
        menuDivider
        #TODO Tutorial Flows
        createMenuItem 'About', displayAbout
      ]
    ]

  setupMenus = ->
    _.requestModelBuilders (error, builders) ->
      _menus initializeMenus if error then [] else builders

  createTool = (icon, label, action, isDisabled=no) ->
    label: label
    action: action
    isDisabled: isDisabled
    icon: "fa fa-#{icon}"

  _toolbar = [
    [
      createTool 'file-o', 'New', createNotebook
      createTool 'folder-open-o', 'Open', promptForNotebook
      createTool 'save', 'Save (s)', saveNotebook
    ]
  ,
    [
      createTool 'plus', 'Insert Cell Below (b)', insertNewCellBelow
      createTool 'arrow-up', 'Move Cell Up (ctrl+k)', moveCellUp
      createTool 'arrow-down', 'Move Cell Down (ctrl+j)', moveCellDown
    ]
  ,
    [
      createTool 'cut', 'Cut Cell (x)', cutCell
      createTool 'copy', 'Copy Cell (c)', copyCell
      createTool 'paste', 'Paste Cell Below (v)', pasteCellBelow
      createTool 'eraser', 'Clear Cell', clearCell
      createTool 'trash-o', 'Delete Cell (d d)', deleteCell
    ]
  ,
    [
      createTool 'step-forward', 'Run and Select Below', runCellAndSelectBelow
      createTool 'play', 'Run (ctrl+enter)', runCell
      createTool 'forward', 'Run All', runAllCells
    ]
  ,
    [
      createTool 'question-circle', 'Assist Me', executeCommand 'assist'
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
    [ 's', 'save notebook', saveNotebook ]
    #[ 'mod+s', 'save notebook', saveNotebook ]
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
    [ 'mod+s', 'save notebook', saveNotebook ]
  ]
  
  toKeyboardHelp = (shortcut) ->
    [ seq, caption ] = shortcut
    keystrokes = join (map (split seq, /\+/g), (key) -> "<kbd>#{key}</kbd>"), ' '
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

    setupMenus()

    link _.load, loadNotebook
    link _.open, openNotebook

    link _.selectCell, selectCell

    link _.executeAllCells, executeAllCells

    link _.insertAndExecuteCell, (type, input) ->
      defer appendCellAndRun, type, input

    link _.insertCell, (type, input) ->
      defer insertCellBelow, type, input

    link _.saved, ->
      _.growl 'Notebook saved.'

    link _.loaded, ->
      _.growl 'Notebook loaded.'

    do (executeCommand 'assist')

    _.setDirty() #TODO setPristine() when autosave is implemented.
    _initializeInterpreter()

  link _.ready, initialize

  name: _localName
  isEditingName: _isEditingName
  editName: editName
  saveName: saveName
  menus: _menus
  sidebar: _sidebar
  status: _status
  toolbar: _toolbar
  cells: _cells
  areInputsHidden: _areInputsHidden
  areOutputsHidden: _areOutputsHidden
  isSidebarHidden: _isSidebarHidden
  isRunningAll: _isRunningAll
  runningCaption: _runningCaption
  runningPercent: _runningPercent
  runningCellInput: _runningCellInput
  stopRunningAll: stopRunningAll
  toggleSidebar: toggleSidebar
  shortcutsHelp:
    normalMode: normalModeKeyboardShortcutsHelp
    editMode: editModeKeyboardShortcutsHelp
  about: _about
  dialogs: _dialogs
  templateOf: (view) -> view.template
