Flow = if exports? then exports else @Flow = {}

# XXX add following contents to startup cells.

#   # Welcome to H<sub>2</sub>O Flow!
#   
#   **Flow** is a web-based interactive computational environment where you can combine code execution, text, mathematics, plots and rich media into a single document, much like [IPython Notebooks](http://ipython.org/notebook.html).
#   
#   A Flow is composed of a series of executable *cells*. Each *cell* has an input and an output. To provide input to a cell.
#   
#   Flow is a modal editor, which means that when you are not editing the contents.
#   
#   - To edit a cell, hit `Enter`.
#   - When you're done editing, hit `Esc`.
#   
#   Hitting `Esc` after editing a cell puts you in *Command Mode*. You can do a variety of actions in Command Mode:
#   - `a` adds a new cell **a**bove the current cell.
#   - `b` adds a new cell __b__elow the current cell.
#   - `d` `d` __d__eletes the current cell. Yes, you need to press `d` twice.
#   
#   To view a list of commands, enter help in the cell below, followed by Ctrl+Enter.
#   
#   [________________________]
#   
#   To view a list of keyboard shortcuts, type h.


# 
# TODO
#
# keyboard help dialog
# menu system
# tooltips on celltype flags


# CLI usage:
# help
# list frames
# list models, list models with compatible frames
# list jobs
# list scores
# list nodes
# ? import dataset
# ? browse files
# ? parse
# ? inspect dataset
# ? column summary
# ? histogram / box plot / top n / characteristics plots
# ? create model
# ? score model
# ? compare scorings
#   ? input / output comparison
#   ? parameter / threshold plots
# ? predictions

marked.setOptions
  smartypants: yes
  highlight: (code, lang) ->
    if window.hljs
      (window.hljs.highlightAuto code, [ lang ]).value
    else
      code

ko.bindingHandlers.cursorPosition =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    if arg = ko.unwrap valueAccessor()
      # Bit of a hack. Attaches a method to the bound object that returns the cursor position. Uses dwieeb/jquery-textrange.
      arg.read = -> $(element).textrange 'get', 'position'
    return

ko.bindingHandlers.autoResize =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    $el = $ element
      .on 'input', ->
        defer ->
          $el
            .css 'height', 'auto'
            .height element.scrollHeight
    return

# Like _.compose, but async. 
# Equivalent to caolan/async.waterfall()
async = (tasks) ->
  _tasks = slice tasks, 0

  next = (args, go) ->
    task = shift _tasks
    if task
      apply task, null, args.concat (error, results...) ->
        if error
          go error
        else
          next results, go
    else
      apply go, null, [ null ].concat args

  (args..., go) ->
    next args, go

deepClone = (obj) ->
  JSON.parse JSON.stringify obj

Flow.Application = (_) ->
  _view = Flow.Repl _
  Flow.DialogManager _
  
  context: _
  view: _view

Flow.ApplicationContext = (_) ->
  context$
    ready: do edges$

Flow.DialogManager = (_) ->

Flow.HtmlTag = (_, level) ->
  isCode: no
  render: (guid, input, go) ->
    go null,
      text: input.trim() or '(Untitled)'
      template: "flow-#{level}"

Flow.Raw = (_) ->
  isCode: no
  render: (guid, input, go) ->
    go null,
      text: input
      template: 'flow-raw'

Flow.Markdown = (_) ->
  isCode: no
  render: (guid, input, go) ->
    try
      html = marked input.trim() or '(No content)'
      go null,
        html: html
        template: 'flow-html'
    catch error
      go error

objectToHtmlTable = (obj) ->
  if obj is undefined
    '(undefined)'
  else if obj is null
    '(null)'
  else if isString obj
    if obj
      obj
    else
      '(Empty string)'
  else if isArray obj
    html = ''
    for value, i in obj
      html += "<tr><td>#{i + 1}</td><td>#{objectToHtmlTable value}</td></tr>"
    if html
      "<table class='table table-striped table-condensed'>#{html}</table>"
    else
      '(Empty array)'
  else if isObject obj
    html = ''
    for key, value of obj
      html += "<tr><td>#{key}</td><td>#{objectToHtmlTable value}</td></tr>"
    if html
      "<table class='table table-striped table-condensed'>#{html}</table>"
    else
      '(Empty object)'
  else
    obj

Flow.H2O = (_) ->
  createResponse = (status, data, xhr) ->
    status: status, data: data, xhr: xhr

  handleResponse = (go, jqxhr) ->
    jqxhr
      .done (data, status, xhr) ->
        go null, createResponse status, data, xhr
      .fail (xhr, status, error) ->
        go createResponse status, xhr.responseJSON, xhr

  h2oGet = (path, go) ->
    handleResponse go, $.getJSON path

  h2oPost = (path, opts, go) ->
    handleResponse go, $.post path, opts

  processResponse = (go) ->
    (error, result) ->
      if error
        #TODO error logging / retries, etc.
        go error, result
      else
        if result.data.response?.status is 'error'
          go result.data.error, result.data
        else
          go error, result.data

  request = (path, go) ->
    h2oGet path, processResponse go

  post = (path, opts, go) ->
    h2oPost path, opts, processResponse go

  composePath = (path, opts) ->
    if opts
      params = mapWithKey opts, (v, k) -> "#{k}=#{v}"
      path + '?' + join params, '&'
    else
      path

  requestWithOpts = (path, opts, go) ->
    request (composePath path, opts), go

  requestJobs = (go) ->
    request '/Jobs.json', go

  requestJob = (key, go) ->
    #opts = key: encodeURIComponent key
    #requestWithOpts '/Job.json', opts, go
    request "/Jobs.json/#{encodeURIComponent key}", (error, result) ->
      if error
        go error, result
      else
        go error, result.jobs[0]

  link$ _.requestJobs, requestJobs
  link$ _.requestJob, requestJob

Flow.Routines = (_) ->
  _future = (f, args) ->
    self = (go) ->
      if self.settled
        # continue with cached error/result
        if self.rejected
          go self.error
        else
          go null, self.result
      else
        apply f, [null]
          .concat args
          .concat (error, result) ->
            if error
              self.error = error
              self.fulfilled = no
              self.rejected = yes
              go error
            else
              self.result = result
              self.fulfilled = yes
              self.rejected = no
              go null, result
            self.settled = yes
            self.pending = no

    self.method = f
    self.args = args
    self.fulfilled = no
    self.rejected = no
    self.settled = no
    self.pending = yes

    self.isFuture = yes

    self

  collate = (args..., go) ->
    _tasks = [] 
    _results = []

    for arg, i in args
      if arg?.isFuture
        _tasks.push future: arg, resultIndex: i
      else
        _results[i] = arg

    _actual = 0
    _settled = no

    forEach _tasks, (task) ->
      call task.future, null, (error, result) ->
        return if _settled
        if error
          _settled = yes
          go
            message: "Error evalutating future[#{task.resultIndex}]"
            cause: error
        else
          _results[task.resultIndex] = result
          _actual++
          if _actual is _tasks.length
            _settled = yes
            go null, _results
        return

  future = (f, args...) -> _future f, args

  renderJobs = (ft, results) ->

  renderJob = (ft, result) ->

  lookupRenderer = (method) ->
    switch method
      when jobs
        renderJobs
      when job
        renderJob
    
#  show = (arg) ->
#    if arg
#      if arg.isFuture
#        arg (error, result) ->
#          if error
#            error:
#              message: "Error evaluating future"
#              cause: error
#          else
#            renderer = lookupRenderer arg.method
#            if renderer
#              renderer arg, result
#            else
#    else
#      #XXX print usage
#      throw new Error "Illegal Argument: '#{arg}'"

  frames = (arg) ->

  frame = (arg) ->

  models = (arg) ->

  model = (arg) ->

  jobs = (arg) ->
    future _.requestJobs

  job = (arg) ->
    if isString arg
      future _.requestJob, arg
    else if isObject arg
      if arg.key?
        job arg.key
      else
        #XXX print usage
        throw new Error "Illegal Argument: '#{arg}'"
    else
      #XXX print usage
      throw new Error "Illegal Argument: '#{arg}'"

  jobs: jobs
  job: job

javascriptProgramTemplate = esprima.parse 'function foo(){ return a + b; }'
safetyWrapCoffeescript = (guid) ->
  (cs, go) ->
    lines = cs
      # normalize CR/LF
      .replace /[\n\r]/g, '\n'
      # split into lines
      .split '\n'

    # indent once
    block = map lines, (line) -> '  ' + line

    # enclose in execute-immediate closure
    block.unshift "_h2o_results_['#{guid}'] = do ->"

    # join and proceed
    go null, join block, '\n'

compileCoffeescript = (cs, go) ->
  try
    go null, CoffeeScript.compile cs, bare: yes
  catch error
    go
      message: 'Error compiling coffee-script'
      cause: error

parseJavascript = (js, go) ->
  try
    go null, esprima.parse js
  catch error
    go
      message: 'Error parsing javascript expression'
      cause: error


identifyDeclarations = (node) ->
  return null unless node

  switch node.type
    when 'VariableDeclaration'
      return (name: declaration.id.name, object:'_h2o_context_' for declaration in node.declarations when declaration.type is 'VariableDeclarator' and declaration.id.type is 'Identifier')
        
    when 'FunctionDeclaration'
      #
      # XXX Not sure about the semantics here.
      #
      if node.id.type is 'Identifier'
        return [ name: node.id.name, object: '_h2o_context_' ]
    when 'ForStatement'
      return identifyDeclarations node.init
    when 'ForInStatement', 'ForOfStatement'
      return identifyDeclarations node.left
  return null

parseDeclarations = (block) ->
  identifiers = []
  for node in block.body
    if declarations = identifyDeclarations node
      for declaration in declarations
        identifiers.push declaration
  indexBy identifiers, (identifier) -> identifier.name

traverseJavascript = (parent, key, node, f) ->
  if isArray node
    i = node.length
    # walk backwards to allow callers to delete nodes
    while i--
      child = node[i]
      if isObject child
        traverseJavascript node, i, child, f
        f node, i, child
  else 
    for own i, child of node
      if isObject child
        traverseJavascript node, i, child, f
        f node, i, child
  return

deleteAstNode = (parent, i) ->
  if _.isArray parent
    parent.splice i, 1
  else if isObject parent
    delete parent[i]

createLocalScope = (node) ->
  # parse all declarations in this scope
  localScope = parseDeclarations node.body

  # include formal parameters
  for param in node.params when param.type is 'Identifier'
    localScope[param.name] = name: param.name, object: 'local'

  localScope

# redefine scope by coalescing down to non-local identifiers
coalesceScopes = (scopes) ->
  currentScope = {}
  for scope, i in scopes
    if i is 0
      for name, identifier of scope
        currentScope[name] = identifier
    else
      for name, identifier of scope
        currentScope[name] = null
  currentScope

traverseJavascriptScoped = (scopes, parentScope, parent, key, node, f) ->
  isNewScope = node.type is 'FunctionExpression' or node.type is 'FunctionDeclaration'
  if isNewScope
    # create and push a new local scope onto scope stack
    push scopes, createLocalScope node
    currentScope = coalesceScopes scopes
  else
    currentScope = parentScope

  for key, child of node
    if isObject child
      traverseJavascriptScoped scopes, currentScope, node, key, child, f
      f currentScope, node, key, child 

  if isNewScope
    # discard local scope
    pop scopes

  return

createRootScope = (sandbox) ->
  (program, go) ->
    try
      rootScope = parseDeclarations program.body[0].expression.right.callee.body

      for name of sandbox.context when name isnt '_routines_' and name isnt '_results_' #XXX pass routines and results as params, keep context clean
        rootScope[name] =
          name: name
          object: '_h2o_context_'
      go null, rootScope, program

    catch error
      go
        message: 'Error parsing root scope'
        cause: error

#TODO DO NOT call this for raw javascript:
# Require alternate strategy: 
#   Declarations with 'var' need to be local to the cell.
#   Undeclared identifiers are assumed to be global.
#   'use strict' should be unsupported.
removeHoistedDeclarations = (rootScope, program, go) ->
  try
    traverseJavascript null, null, program, (parent, key, node) ->
      if node.type is 'VariableDeclaration'		
        declarations = node.declarations.filter (declaration) ->		
          declaration.type is 'VariableDeclarator' and declaration.id.type is 'Identifier' and not rootScope[declaration.id.name]		
        if declarations.length is 0
          # purge this node so that escodegen doesn't fail		
          deleteAstNode parent, key		
        else		
          # replace with cleaned-up declarations
          node.declarations = declarations
    go null, rootScope, program
  catch error
    go
      message: 'Error rewriting javascript'
      cause: error


rewriteJavascript = (rootScope, program, go) ->
  try
    traverseJavascriptScoped [ rootScope ], rootScope, null, null, program, (globalScope, parent, key, node) ->
      if node.type is 'Identifier'
        return if parent.type is 'VariableDeclarator' and key is 'id' # ignore var declarations
        return if key is 'property' # ignore members
        return unless identifier = globalScope[node.name]

        # qualify identifier with '_h2o_context_'
        parent[key] =
          type: 'MemberExpression'
          computed: no
          object:
            type: 'Identifier'
            name: identifier.object
          property:
            type: 'Identifier'
            name: identifier.name
    go null, program
  catch error
    go
      message: 'Error rewriting javascript'
      cause: error

generateJavascript = (program, go) ->
  try
    go null, escodegen.generate program
  catch error
    return go
      message: 'Error generating javascript'
      cause: error

compileJavascript = (js, go) ->
  debug js
  try
    closure = new Function '_h2o_context_', '_h2o_routines_', '_h2o_results_', js
    go null, closure
  catch error
    go
      message: 'Error compiling javascript'
      cause: error

executeJavascript = (sandbox) ->
  (closure, go) ->
    try
      go null, closure sandbox.context, sandbox.routines, sandbox.results
    catch error
      go
        message: 'Error executing javascript'
        cause: error

Flow.Coffeescript = (_, sandbox) ->
  render: (guid, input, go) ->
    tasks = [
      safetyWrapCoffeescript guid
      compileCoffeescript
      parseJavascript
      createRootScope sandbox
      removeHoistedDeclarations
      rewriteJavascript
      generateJavascript
      compileJavascript
      executeJavascript sandbox
    ]
    (async tasks) input, (error, result) ->
      if error
        go error
      else
        debug sandbox
        go null,
          text: sandbox.results[guid]
          template: 'flow-raw'

Flow.Repl = (_) ->
  _cells = nodes$ []
  _selectedCell = null
  _selectedCellIndex = -1
  _clipboardCell = null
  _lastDeletedCell = null
  _sandbox =
    context: {}
    routines: Flow.Routines _
    results: {}

  _renderers =
    h1: -> Flow.HtmlTag _, 'h1'
    h2: -> Flow.HtmlTag _, 'h2'
    h3: -> Flow.HtmlTag _, 'h3'
    h4: -> Flow.HtmlTag _, 'h4'
    h5: -> Flow.HtmlTag _, 'h5'
    h6: -> Flow.HtmlTag _, 'h6'
    md: -> Flow.Markdown _
    cs: -> Flow.Coffeescript _, _sandbox
    raw: -> Flow.Raw _

  countLines = (text) ->
    newlineCount = 1
    for character in text when character is '\n'
      newlineCount++
    newlineCount

  checkConsistency = ->
    for cell, i in _cells()
      unless cell
        error "index #{i} is empty"
    return

  selectCell = (target) ->
    return if _selectedCell is target
    _selectedCell.isSelected no if _selectedCell
    _selectedCell = target
    #TODO also set focus so that tabs don't jump to the first cell
    _selectedCell.isSelected yes
    _selectedCellIndex = _cells.indexOf _selectedCell
    checkConsistency()
    return

  createCell = (type='cs', input='') ->
    _guid = uniqueId()
    _type = node$ type
    _renderer = lift$ _type, (type) -> _renderers[type]()
    _isSelected = node$ no
    _isActive = node$ no
    _hasError = node$ no
    _isBusy = node$ no
    _isReady = lift$ _isBusy, (isBusy) -> not isBusy
    _hasInput = node$ yes
    _input = node$ input
    _output = node$ null
    _hasOutput = lift$ _output, (output) -> if output? then yes else no
    _lineCount = lift$ _input, countLines

    # This is a shim.
    # The ko 'cursorPosition' custom binding attaches a read() method to this.
    _cursorPosition = {}

    # select and display input when activated
    apply$ _isActive, (isActive) ->
      if isActive
        selectCell self
        _hasInput yes
        _output null if _renderer().isCode is no
      return

    # deactivate when deselected
    apply$ _isSelected, (isSelected) ->
      _isActive no unless isSelected

    # tied to mouse-clicks on the cell
    select = -> selectCell self

    # tied to mouse-double-clicks on html content
    activate = -> _isActive yes

    execute = (go) ->
      input = _input().trim()
      return unless input
      renderer = _renderer()
      _isBusy yes
      renderer.render _guid, input, (error, result) ->
        if error
          _hasError yes
          if error.cause?
            _output
              error: error
              template: 'flow-error'
          else
            _output
              text: JSON.stringify error, null, 2
              template: 'flow-raw'
        else
          _hasError no
          _output result
          _hasInput renderer.isCode isnt no

        _isBusy no

      _isActive no
      go() if go

    self =
      guid: _guid
      type: _type
      isSelected: _isSelected
      isActive: _isActive
      hasError: _hasError
      isBusy: _isBusy
      isReady: _isReady
      input: _input
      hasInput: _hasInput
      output: _output
      hasOutput: _hasOutput
      lineCount: _lineCount
      select: select
      activate: activate
      execute: execute
      _cursorPosition: _cursorPosition
      cursorPosition: -> _cursorPosition.read()
      template: 'flow-cell'

  cloneCell = (cell) ->
    createCell cell.type(), cell.input()

  switchToCommandMode = ->
    _selectedCell.isActive no

  switchToEditMode = ->
    _selectedCell.isActive yes
    no

  convertCellToCode = -> _selectedCell.type 'cs'

  convertCellToHeading = (level) -> -> _selectedCell.type "h#{level}"

  convertCellToMarkdown = -> _selectedCell.type 'md'

  convertCellToRaw = -> _selectedCell.type 'raw'

  copyCell = ->
    _clipboardCell = cloneCell _selectedCell

  cutCell = ->
    _clipboardCell = _selectedCell
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

  insertCellAbove = ->
    insertCell _selectedCellIndex, createCell 'cs'

  insertCellBelow = ->
    insertCell _selectedCellIndex + 1, createCell 'cs'

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
    insertCell _selectedCellIndex, _clipboardCell if _clipboardCell

  pasteCellBelow = ->
    insertCell _selectedCellIndex + 1, _clipboardCell if _clipboardCell

  undoLastDelete = ->
    insertCell _selectedCellIndex + 1, _lastDeletedCell if _lastDeletedCell
    _lastDeletedCell = null

  runCell = ->
    _selectedCell.execute()
    no

  runCellAndInsertBelow = ->
    _selectedCell.execute -> insertCellBelow()
    no

  #TODO ipython has inconsistent behavior here. seems to be doing runCellAndInsertBelow if executed on the lowermost cell.
  runCellAndSelectBelow = ->
    _selectedCell.execute -> selectNextCell()
    no

  saveFlow = ->
    debug 'saveFlow'
    no

  selectNextCell = ->
    cells = _cells()
    unless _selectedCellIndex is cells.length - 1
      selectCell cells[_selectedCellIndex + 1]
    return

  selectPreviousCell = ->
    unless _selectedCellIndex is 0
      cells = _cells()
      selectCell cells[_selectedCellIndex - 1]
    return

  displayHelp = -> debug 'displayHelp'

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
    [ 'a', 'insert cell above', insertCellAbove ]
    [ 'b', 'insert cell below', insertCellBelow ]
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
    # [ 'o', 'toggle output' ]
    # [ 'shift+o', 'toggle output scrolling' ]
    # [ 'q', 'close pager' ]
    [ 'h', 'keyboard shortcuts', displayHelp ]
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

  setupKeyboardHandling = (mode) ->
    for [ shortcut, caption, f ] in normalModeKeyboardShortcuts
      Mousetrap.bind shortcut, f

    for [ shortcut, caption, f ] in editModeKeyboardShortcuts
      Mousetrap.bindGlobal shortcut, f
    return

  initialize = ->
    setupKeyboardHandling 'normal'
    cell = createCell 'cs'
    push _cells, cell
    selectCell cell

  initialize()

  cells: _cells
  template: (view) -> view.template

$ ->
  window.flow = flow = Flow.Application do Flow.ApplicationContext
  ko.applyBindings flow
  flow.context.ready()
  
