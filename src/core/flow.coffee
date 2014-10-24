# 
# TODO
#
# XXX how does cell output behave when a widget throws an exception?
# XXX GLM case is failing badly. Investigate. Should catch/handle gracefully.
#
# integrate with groc
# tooltips on celltype flags
# arrow keys cause page to scroll - disable those behaviors
# scrollTo() behavior


#XXX move to ns
createBuffer = (array) ->
  _array = array or []
  _go = null
  buffer = (element) ->
    if element is undefined
      _array
    else
      _array.push element
      _go element if _go
      element
  buffer.subscribe = (go) -> _go = go
  buffer.buffer = _array
  buffer.isBuffer = yes
  buffer

Flow.Dataflow = do ->
  _applicate = (go) -> 
    (error, args) ->
      apply go, null, [ error ].concat args if isFunction go
  
  _resolve = (nodes) ->
    map nodes, (node) -> if isSignal node then node() else node

  _apply = (nodes, immediate, go) ->
    propagate = -> apply go, null, _resolve nodes
    propagate() if immediate
    map nodes, (node) -> link node, -> propagate()

  _react = (nodes..., go) -> _apply nodes, no, go

  #XXX BUG shorthand rewrites this to lodash.invoke
  _invoke = (nodes..., go) -> _apply nodes, yes, go 

  _lift = (nodes..., f) ->
    evaluate = -> apply f, null, _resolve nodes
    target = signal evaluate()
    forEach nodes, (node) -> link node, -> target evaluate()
    target
  
  _merge = (sources..., target, f) ->
    propagate = -> target apply f, null, _resolve sources
    propagate()
    map sources, (source) -> link source, propagate

  applicate: _applicate
  resolve: _resolve
  react: _react
  invoke: _invoke
  lift: _lift
  merge: _merge

noopFuture = (go) -> go null

renderable = (f, args..., render) ->
  ft = _fork f, args
  ft.render = render
  ft

stringify = (a) -> JSON.stringify a

_fork = (f, args) ->
  self = (go) ->
    canGo = isFunction go
    if self.settled
      # proceed with cached error/result
      if self.rejected
        go self.error if canGo
      else
        go null, self.result if canGo
    else
      _join args, (error, args) ->
        if error
          self.error = error
          self.fulfilled = no
          self.rejected = yes
          go error if canGo
        else
          apply f, null,
            args.concat (error, result) ->
              if error
                self.error = error
                self.fulfilled = no
                self.rejected = yes
                go error if canGo
              else
                self.result = result
                self.fulfilled = yes
                self.rejected = no
                go null, result if canGo
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

isFuture = (a) -> if a?.isFuture then yes else no

fork = (f, args...) -> _fork f, args

_join = (args, go) ->
  return go null, [] if args.length is 0

  _tasks = [] 
  _results = []

  for arg, i in args
    if arg?.isFuture
      _tasks.push future: arg, resultIndex: i
    else
      _results[i] = arg

  return go null, _results if _tasks.length is 0

  _actual = 0
  _settled = no

  forEach _tasks, (task) ->
    call task.future, null, (error, result) ->
      return if _settled
      if error
        _settled = yes
        go exception "Error evaluating future[#{task.resultIndex}]", error
      else
        _results[task.resultIndex] = result
        _actual++
        if _actual is _tasks.length
          _settled = yes
          go null, _results
      return
  return

_flowMenuItems =
  importFiles:
    description: 'Import file(s) into H<sub>2</sub>O'
    icon: 'files-o'
  getFrames:
    description: 'Get a list of frames in H<sub>2</sub>O'
    icon: 'database'
  getModels:
    description: 'Get a list of models in H<sub>2</sub>O'
    icon: 'cubes'
  getJobs:
    description: 'Get a list of jobs running in H<sub>2</sub>O'
    icon: 'bolt'
  buildModel:
    description: 'Build a model'
    icon: 'cube'


assist = (_, routines, routine) ->
  switch routine
    when routines.importFiles
      renderable noopFuture, (ignore, go) ->
        go null, Flow.ImportFilesInput _
    when routines.help, routines.menu, routines.buildModel, routines.getFrames, routines.getModels, routines.getJobs
      # parameter-less routines
      routine()
    else
      renderable noopFuture, (ignore, go) ->
        go null, Flow.NoAssistView _


marked.setOptions
  smartypants: yes
  highlight: (code, lang) ->
    if window.hljs
      (window.hljs.highlightAuto code, [ lang ]).value
    else
      code

ko.bindingHandlers.markdown =
  update: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    data = ko.unwrap valueAccessor()
    try
      html = marked data or ''
    catch error
      html = error.message or 'Error rendering markdown.'

    $(element).html html

ko.bindingHandlers.stringify =
  update: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    data = ko.unwrap valueAccessor()

    $(element).text JSON.stringify data, null, 2

ko.bindingHandlers.enterKey =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    if action = ko.unwrap valueAccessor() 
      if isFunction action
        $element = $ element
        $element.keydown (e) -> 
          if e.which is 13
            action viewModel
          return
      else
        throw 'Enter key action is not a function'
    return

ko.bindingHandlers.typeahead =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    if action = ko.unwrap valueAccessor() 
      if isFunction action
        $element = $ element
        $element.typeahead null,
          displayKey: 'value'
          source: action
      else
        throw 'Typeahead action is not a function'
    return

ko.bindingHandlers.cursorPosition =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    if arg = ko.unwrap valueAccessor()
      # Bit of a hack. Attaches a method to the bound object that returns the cursor position. Uses dwieeb/jquery-textrange.
      arg.read = -> $(element).textrange 'get', 'position'
    return

ko.bindingHandlers.autoResize =
  update: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    resize = -> defer ->
      $el
        .css 'height', 'auto'
        .height element.scrollHeight

    $el = $(element).on 'input', resize

    resize()
    return

ko.bindingHandlers.dom =
  update: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    arg = ko.unwrap valueAccessor()
    if arg
      $element = $ element
      $element.empty()
      $element.append arg
    return

previewArray = (array) ->
  ellipsis = if array.length > 5 then ', ...' else ''
  preview = for element in head array, 5
    if isPrimitive type = typeOf element then element else type
  "[#{preview.join ', '}#{ellipsis}]"

previewObject = (object) ->
  count = 0
  previews = []
  ellipsis = ''
  for key, value of object
    valueType = typeOf value
    previews.push "#{key}: #{if isPrimitive valueType then value else valueType}"
    if ++count is 5
      ellipsis = ', ...'
      break 
  "{#{previews.join ', '}#{ellipsis}}" 

preview = (element) ->
  type = typeOf element
  if isPrimitive type
    element
  else
    switch type
      when 'Array'
        previewArray element
      when 'Function', 'Arguments'
        type
      else
        previewObject element
      

#TODO slice large arrays
dumpObject = (key, object) ->
  _expansions = signal null
  _isExpanded = signal no
  _type = typeOf object
  _canExpand = isExpandable _type
  toggle = ->
    return unless _canExpand
    if _expansions() is null
      expansions = []
      for key, value of object
        expansions.push dumpObject key, value
      _expansions expansions
    _isExpanded not _isExpanded()

  key: key
  preview: preview object
  toggle: toggle
  expansions: _expansions
  isExpanded: _isExpanded
  canExpand: _canExpand

ko.bindingHandlers.dump =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    object = ko.unwrap valueAccessor()

isExpandable = (type) ->
  switch type
    when 'null', 'undefined', 'Boolean', 'String', 'Number', 'Date', 'RegExp', 'Arguments', 'Function'
      no
    else
      yes
  
isPrimitive = (type) ->
  switch type
    when 'null', 'undefined', 'Boolean', 'String', 'Number', 'Date', 'RegExp'
      yes
    else
      no

typeOf = (a) ->
  type = Object::toString.call a
  if a is null
    return 'null'
  else if a is undefined
    return 'undefined'
  else if a is true or a is false or type is '[object Boolean]'
    return 'Boolean'
  else
    switch type
      when '[object String]'
        return 'String'
      when '[object Number]'
        return 'Number'
      when '[object Function]'
        return 'Function'
      when '[object Object]'
        return 'Object'
      when '[object Array]'
        return 'Array'
      when '[object Arguments]'
        return 'Arguments'
      when '[object Date]'
        return 'Date'
      when '[object RegExp]'
        return 'RegExp'
      when '[object Error]'
        return 'Error'
      else
        return type

templateOf = (view) -> view.template

# Like _.compose, but async. 
# Equivalent to caolan/async.waterfall()
pipe = (tasks) ->
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

iterate = (tasks) ->
  _tasks = slice tasks, 0
  _results = []
  next = (go) ->
    task = shift _tasks
    if task
      task (error, result) ->
        if error
          _results.push [ error ]
        else
          _results.push [ null, result ]
        next go
    else
      #XXX should errors be included in arg #1?
      go null, _results

  (go) ->
    next go

deepClone = (obj) ->
  JSON.parse JSON.stringify obj

exception = (message, cause) -> 
  if cause and not cause.stack
    cause.stack = if stack = printStackTrace()
      # lop off exception() and printStackTrace() calls from stack
      (if stack.length > 3 then stack.slice 3 else stack).join '\n'
    else
      null
    cause.stack = stack
  message: message
  cause: cause

mapWithKey = (obj, f) ->
  result = []
  for key, value of obj
    result.push f value, key
  result

describeCount = (count, singular, plural) ->
  plural = singular + 's' unless plural
  switch count
    when 0
      "No #{plural}"
    when 1
      "1 #{singular}"
    else
      "#{count} #{plural}"

Flow.Sandbox = (_) ->
  context: {}
  results: {}
  routines: Flow.Routines _

Flow.Application = (_) ->
  _sandbox = Flow.Sandbox _
  _renderers = Flow.Renderers _, _sandbox
  _repl = Flow.Repl _, _renderers

  Flow.H2O _
  Flow.DialogManager _
  
  context: _
  sandbox: _sandbox
  view: _repl

Flow.ApplicationContext = (_) ->
  board
    ready: do slots
    requestFileGlob: do slot
    requestImportFiles: do slot
    requestParseFiles: do slot
    requestInspect: do slot
    requestParseSetup: do slot
    requestFrames: do slot
    requestFrame: do slot
    requestColumnSummary: do slot
    requestModelBuilders: do slot
    requestModelBuild: do slot
    requestModelMetrics: do slot
    requestModels: do slot
    requestModel: do slot
    requestJobs: do slot
    requestJob: do slot
    selectCell: do slot
    insertAndExecuteCell: do slot

Flow.DialogManager = (_) ->

Flow.HtmlTag = (_, level) ->
  render = (input, output) ->
    output.data
      text: input.trim() or '(Untitled)'
      template: "flow-#{level}"
    output.end()
  render.isCode = no
  render

Flow.Markdown = (_) ->
  render = (input, output) ->
    try
      output.data
        html: marked input.trim() or '(No content)'
        template: 'flow-html'
    catch error
      output.error error
    finally
      output.end()
  render.isCode = no
  render

Flow.Raw = (_) ->
  render = (input, output) ->
    output.data
      text: input
      template: 'flow-raw'
    output.end()
  render.isCode = no
  render

Flow.ParseOutput = (_, _result) ->
  inspectJob = ->
    _.insertAndExecuteCell 'cs', "getJob #{stringify _result.job.name}"

  result: _result
  inspectJob: inspectJob
  template: 'flow-parse-output'


Flow.ImportFilesOutput = (_, _importResults) ->
  _allKeys = flatten compact map _importResults, ( [ error, result ] ) ->
    if error then null else result.keys
  _canParse = _allKeys.length > 0
  _title = "#{_allKeys.length} / #{_importResults.length} files imported."

  createImportView = (result) ->
    #TODO dels?
    #TODO fails?

    keys: result.keys
    template: 'flow-import-file-output'

  _importViews = map _importResults, ( [error, result] ) ->
    if error
      #XXX untested
      error: exception 'Error importing file', error
      template: 'flow-error'
    else
      createImportView result

  parse = ->
    paths = map _allKeys, stringify
    _.insertAndExecuteCell 'cs', "setupParse [ #{paths.join ','} ]"

  title: _title
  importViews: _importViews
  canParse: _canParse
  parse: parse
  template: 'flow-import-files-output'
  templateOf: templateOf


Flow.JobsOutput = (_, jobs) ->
  _jobViews = signals []
  _hasJobViews = lift _jobViews, (jobViews) -> jobViews.length > 0
  _isLive = signal no
  _isBusy = signal no
  _exception = signal null

  createJobView = (job) ->
    inspect = ->
      _.insertAndExecuteCell 'cs', "getJob #{stringify job.key.name}" 

    job: job
    inspect: inspect

  toggleRefresh = ->
    _isLive not _isLive()

  refresh = ->
    _isBusy yes
    _.requestJobs (error, jobs) ->
      _isBusy no
      if error
        _exception exception 'Error fetching jobs', error
        _isLive no
      else
        _jobViews map jobs, createJobView
        delay refresh, 2000 if _isLive()

  act _isLive, (isLive) ->
    refresh() if isLive

  initialize = ->
    _jobViews map jobs, createJobView

  initialize()

  jobViews: _jobViews
  hasJobViews: _hasJobViews
  isLive: _isLive
  isBusy: _isBusy
  toggleRefresh: toggleRefresh
  refresh: refresh
  exception: _exception
  template: 'flow-jobs-output'

Flow.ModelOutput = (_, _model) ->
  model: _model
  template: 'flow-model-output'

do ->
  jobOutputStatusColors = 
    failed: '#d9534f'
    done: '#ccc' #'#5cb85c'
    running: '#f0ad4e'

  getJobOutputStatusColor = (status) ->
    # CREATED   Job was created
    # RUNNING   Job is running
    # CANCELLED Job was cancelled by user
    # FAILED    Job crashed, error message/exception is available
    # DONE      Job was successfully finished
    switch status
      when 'DONE'
        jobOutputStatusColors.done
      when 'CREATED', 'RUNNING'
        jobOutputStatusColors.running
      else # 'CANCELLED', 'FAILED'
        jobOutputStatusColors.failed

  getJobProgressPercent = (progress) ->
    "#{Math.ceil 100 * progress}%"

  Flow.JobOutput = (_, _job) ->
    _isBusy = signal no
    _isLive = signal no

    _key = _job.key.name
    _description = _job.description
    _destinationKey = _job.dest.name
    _runTime = signal null
    _progress = signal null
    _status = signal null
    _statusColor = signal null
    _exception = signal null
    _kind = signal null

    isJobRunning = (job) ->
      job.status is 'CREATED' or job.status is 'RUNNING'

    updateJob = (job) ->
      _runTime job.msec
      _progress getJobProgressPercent job.progress
      _status job.status
      _statusColor getJobOutputStatusColor job.status
      _exception job.exception

    toggleRefresh = ->
      _isLive not _isLive()

    refresh = ->
      _isBusy yes
      _.requestJob _key, (error, job) ->
        _isBusy no
        if error
          _exception exception 'Error fetching jobs', error
          _isLive no
        else
          updateJob job
          if isJobRunning job
            delay refresh, 1000 if _isLive()
          else
            toggleRefresh()

    act _isLive, (isLive) ->
      refresh() if isLive

    inspect = ->
      switch _kind()
        when 'frame'
          _.insertAndExecuteCell 'cs', "getFrame #{stringify _destinationKey}" 
        when 'model'
          _.insertAndExecuteCell 'cs', "getModel #{stringify _destinationKey}" 


    initialize = (job) ->
      updateJob job
      toggleRefresh if isJobRunning job

      _.requestInspect _destinationKey, (error, result) ->
        unless error
          _kind result.kind
        return

    initialize _job

    key: _key
    description: _description
    destinationKey: _destinationKey
    kind: _kind
    runTime: _runTime
    progress: _progress
    status: _status
    statusColor: _statusColor
    exception: _exception
    isLive: _isLive
    toggleRefresh: toggleRefresh
    inspect: inspect
    template: 'flow-job-output'


do ->
  significantDigitsBeforeDecimal = (value) -> 1 + Math.floor Math.log(Math.abs value) / Math.LN10

  formatToSignificantDigits = (digits, value) ->
    if value is 0
      0
    else
      sd = significantDigitsBeforeDecimal value
      if sd >= digits
        value.toFixed 0
      else
        magnitude = Math.pow 10, digits - sd
        Math.round(value * magnitude) / magnitude

  formatTime = d3.time.format '%Y-%m-%d %H:%M:%S' unless exports?
  formatDateTime = (time) -> if time then formatTime new Date time else '-'

  formatReal = do ->
    __formatFunctions = {}
    getFormatFunction = (precision) ->
      if precision is -1
        identity
      else
        __formatFunctions[precision] or __formatFunctions[precision] = d3.format ".#{precision}f"

    (precision, value) ->
      (getFormatFunction precision) value

  Flow.FrameOutput = (_, _frame) ->
    createMinMaxRow = (attribute, columns) ->
      map columns, (column) ->
        switch column.type
          when 'time'
            formatDateTime head column[attribute]
          when 'real'
            formatReal column.precision, head column[attribute]
          when 'int'
            formatToSignificantDigits 6, head column[attribute]
          else
            '-'

    createMeanRow = (columns) ->
      map columns, (column) ->
        switch column.type
          when 'time'
            formatDateTime column.mean
          when 'real'
            formatReal column.precision, column.mean
          when 'int'
            formatToSignificantDigits 6, column.mean
          else
            '-'

    createSigmaRow = (columns) ->
      map columns, (column) ->
        switch column.type
          when 'time', 'real', 'int'
            formatToSignificantDigits 6, column.sigma
          else
            '-'

    createCardinalityRow = (columns) ->
      map columns, (column) ->
        switch column.type
          when 'enum'
            column.domain.length
          else
            '-'

    createPlainRow = (attribute, columns) ->
      map columns, (column) -> column[attribute]

    createMissingsRow = (columns) ->
      map columns, (column) ->
        if column.missing is 0 then '-' else column.missing

    createInfRow = (attribute, columns) ->
      map columns, (column) ->
        switch column.type
          when 'real', 'int'
            if column[attribute] is 0 then '-' else column[attribute]
          else
            '-'

    createSummaryRow = (frameKey, columns) ->
      map columns, (column) ->
        displaySummary: ->
          _.requestColumnSummary frameKey, column.label, (error, result) ->
            if error
              _.error 'Error requesting column summary', column, error
            else
              createSummaryInspection head result.frames

    createDataRow = (offset, index, columns) ->
      header: "Row #{offset + index + 1}"
      cells: map columns, (column) ->
        switch column.type
          when 'uuid','string'
            column.str_data[index] or '-'
          when 'enum'
            column.domain[column.data[index]]
          when 'time'
            formatDateTime column.data[index]
          else
            value = column.data[index]
            if value is 'NaN'
              '-'
            else
              if column.type is 'real'
                formatReal column.precision, value
              else
                value

    createDataRows = (offset, rowCount, columns) ->
      rows = []
      for index in [0 ... rowCount]
        rows.push createDataRow offset, index, columns
      rows

    createFrameTable = (offset, rowCount, columns) ->
      hasMissings = hasZeros = hasPinfs = hasNinfs = hasEnums = no
      for column in columns
        hasMissings = yes if not hasMissings and column.missing > 0
        hasZeros = yes if not hasZeros and column.zeros > 0
        hasPinfs = yes if not hasPinfs and column.pinfs > 0
        hasNinfs = yes if not hasNinfs and column.ninfs > 0
        hasEnums = yes if not hasEnums and column.type is 'enum'

      header: createPlainRow 'label', columns
      typeRow: createPlainRow 'type', columns
      minRow: createMinMaxRow 'mins', columns
      maxRow: createMinMaxRow 'maxs', columns
      meanRow: createMeanRow columns
      sigmaRow: createSigmaRow columns
      cardinalityRow: if hasEnums then createCardinalityRow columns else null
      missingsRow: if hasMissings then createMissingsRow columns else null
      zerosRow: if hasZeros then createInfRow 'zeros', columns else null
      pinfsRow: if hasPinfs then createInfRow 'pinfs', columns else null
      ninfsRow: if hasNinfs then createInfRow 'ninfs', columns else null
      summaryRow: createSummaryRow _frame.key.name, columns
      #summaryRows: createSummaryRows columns
      hasMissings: hasMissings
      hasZeros: hasZeros
      hasPinfs: hasPinfs
      hasNinfs: hasNinfs
      hasEnums: hasEnums
      dataRows: createDataRows offset, rowCount, columns

    createModel = ->
      _.insertAndExecuteCell 'cs', "buildModel null, training_frame: #{stringify _frame.key.name}"

    data: _frame
    key: _frame.key.name
    timestamp: _frame.creation_epoch_time_millis
    title: _frame.key.name
    columns: _frame.column_names
    table: createFrameTable _frame.off, _frame.len, _frame.columns
    dispose: ->
    createModel: createModel
    template: 'flow-frame-output'

do ->
  createTextboxControl = (parameter) ->
    value = signal parameter.actual_value

    kind: 'textbox'
    name: parameter.name
    label: parameter.label
    description: parameter.help
    required: parameter.required
    value: value
    defaultValue: parameter.default_value
    help: signal 'Help goes here.'
    isInvalid: signal no

  createDropdownControl = (parameter) ->
    value = signal parameter.actual_value

    kind: 'dropdown'
    name: parameter.name
    label: parameter.label
    description: parameter.help
    required: parameter.required
    values: signals parameter.values
    value: value
    defaultValue: parameter.default_value
    help: signal 'Help goes here.'
    isInvalid: signal no

  createListControl = (parameter) ->
    value = signal parameter.actual_value or []
    selection = lift value, (items) ->
      caption = "#{describeCount items.length, 'column'} selected"
      caption += ": #{items.join ', '}" if items.length > 0
      "(#{caption})"

    kind: 'list'
    name: parameter.name
    label: parameter.label
    description: parameter.help
    required: parameter.required
    values: signals parameter.values
    value: value
    selection: selection
    defaultValue: parameter.default_value
    help: signal 'Help goes here.'
    isInvalid: signal no

  createCheckboxControl = (parameter) ->
    value = signal parameter.actual_value is 'true' #FIXME

    clientId: do uniqueId
    kind: 'checkbox'
    name: parameter.name
    label: parameter.label
    description: parameter.help
    required: parameter.required
    value: value
    defaultValue: parameter.default_value is 'true'
    help: signal 'Help goes here.'
    isInvalid: signal no

  createControlFromParameter = (parameter) ->
    switch parameter.type
      when 'enum', 'Frame', 'string'
        createDropdownControl parameter
      when 'string[]'
        createListControl parameter
      when 'boolean'
        createCheckboxControl parameter
      when 'Key', 'byte', 'short', 'int', 'long', 'float', 'double', 'int[]', 'long[]', 'float[]', 'double[]'
        createTextboxControl parameter
      else
        console.error 'Invalid field', JSON.stringify parameter, null, 2
        null

  findParameter = (parameters, name) ->
    find parameters, (parameter) -> parameter.name is name

  Flow.ModelBuilderForm = (_, _algorithm, _parameters) ->
    _exception = signal null

    _parametersByLevel = groupBy _parameters, (parameter) -> parameter.level
    _controls = map [ 'critical', 'secondary', 'expert' ], (type) ->
      filter (map _parametersByLevel[type], createControlFromParameter), (a) -> if a then yes else no

    [ criticalControls, secondaryControls, expertControls ] = _controls

    _form = flatten [ 
      kind: 'group'
      title: 'Parameters'
    ,
      criticalControls
    ,
      kind: 'group'
      title: 'Advanced'
    ,
      secondaryControls
    ,
      kind: 'group'
      title: 'Expert'
    ,
      expertControls
    ]

    parameterTemplateOf = (control) -> "flow-#{control.kind}-model-parameter"

    do ->
      findFormField = (name) -> find _form, (field) -> field.name is name
      [ trainingFrameParameter, validationFrameParameter, responseColumnParameter, ignoredColumnsParameter ] = map [ 'training_frame', 'validation_frame', 'response_column', 'ignored_columns' ], findFormField

      if trainingFrameParameter
        if responseColumnParameter or ignoredColumnsParameter
          act trainingFrameParameter.value, (frameKey) ->
            if frameKey
              _.requestFrame frameKey, (error, frame) ->
                unless error
                  columnLabels = map frame.columns, (column) -> column.label
                  if responseColumnParameter
                    responseColumnParameter.values columnLabels
                  if ignoredColumnsParameter
                    ignoredColumnsParameter.values columnLabels
            return

    createModel = ->
      _exception null
      parameters = {}
      for controls in _controls
        for control in controls
          if control.defaultValue isnt value = control.value()
            switch control.kind
              when 'dropdown'
                if value
                  parameters[control.name] = value
              when 'list'
                if value.length
                  parameters[control.name] = "[#{value.join ','}]"
              else
                parameters[control.name] = value
      
      _.insertAndExecuteCell 'cs', "buildModel '#{_algorithm}', #{stringify parameters}"
      return
      _.requestModelBuild _algorithm, parameters, (error, result) ->
        if error
          _exception exception error.data.errmsg, error

    form: _form
    exception: _exception
    parameterTemplateOf: parameterTemplateOf
    createModel: createModel

  Flow.ModelInput = (_, _algo, _opts) ->
    _exception = signal null
    _algorithms = [ 'kmeans', 'deeplearning', 'glm', 'gbm' ]
    _algorithm = signal _algo
    _canCreateModel = lift _algorithm, (algorithm) -> if algorithm then yes else no

    _modelForm = signal null

    populateFramesAndColumns = (frameKey, algorithm, parameters, go) ->
      # Fetch frame list; pick column names from training frame
      _.requestFrames (error, frames) ->
        if error
          #TODO handle properly
        else
          trainingFrameParameter = findParameter parameters, 'training_frame'
          if trainingFrameParameter

            # Show only parsed frames
            trainingFrameParameter.values = (frame.key.name for frame in frames when not frame.isText)

            if frameKey
              trainingFrameParameter.actual_value = frameKey
            else
              frameKey = trainingFrameParameter.actual_value

          return go()

    # If a source model is specified, we already know the algo, so skip algo selection
#     if _sourceModel
#       parameters = _sourceModel.parameters
#       trainingFrameParameter = findParameter parameters, 'training_frame'
# 
#       #TODO INSANE SUPERHACK
#       hasRateAnnealing = find _sourceModel.parameters, (parameter) -> parameter.name is 'rate_annealing'
#       algorithm = if hasRateAnnealing
#           find algorithms, (algorithm) -> algorithm is 'deeplearning'
#         else
#           find algorithms, (algorithm) -> algorithm is 'kmeans'
# 
#       populateFramesAndColumns _frameKey, algorithm, parameters, ->
#         _modelForm Flow.ModelBuilderForm _, algorithm, parameters
# 
#     else

    do ->
      frameKey = _opts?.training_frame
      act _algorithm, (algorithm) ->
        if algorithm
          _.requestModelBuilders algorithm, (error, result) ->
            if error
              _exception exception 'Error fetching model builder', error
            else
              parameters = result.model_builders[algorithm].parameters
              populateFramesAndColumns frameKey, algorithm, parameters, ->
                _modelForm Flow.ModelBuilderForm _, algorithm, parameters
        else
          _modelForm null

    createModel = -> _modelForm().createModel()

    parentException: _exception #XXX hacky
    algorithms: _algorithms
    algorithm: _algorithm
    modelForm: _modelForm
    canCreateModel: _canCreateModel
    createModel: createModel
    template: 'flow-model-input'


Flow.Menu = (_, _items) ->
  createMenuItem = (name, item) ->
    name: name
    description: item.description
    icon: "fa fa-#{item.icon} flow-icon"
    execute: -> _.insertAndExecuteCell 'cs', name

  routines: (createMenuItem name, item for name, item of _items)
  template: 'flow-menu'

Flow.NoAssistView = (_) ->
  showMenu: -> _.insertAndExecuteCell 'cs', "menu"
  template: 'flow-no-assist-view'

Flow.Form = (_, _form) ->
  form: _form
  template: 'flow-form'
  templateOf: (control) -> control.template

Flow.ModelsOutput = (_, _models) ->
  createModelView = (model) ->
    key: model.key
    clone: ->
      _.insertAndExecuteCell 'cs', "cloneModel #{stringify model.key}"
    inspect: ->
      _.insertAndExecuteCell 'cs', "getModel #{stringify model.key}"

  buildModel = ->
    _.insertAndExecuteCell 'cs', 'buildModel'

  modelViews: map _models, createModelView
  hasModels: _models.length > 0
  buildModel: buildModel
  template: 'flow-models-output'

Flow.FramesOutput = (_, _frames) ->

  toSize = (bytes) ->
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    return '0 Byte' if bytes is 0
    i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    Math.round(bytes / Math.pow(1024, i), 2) + sizes[i]

  createFrameView = (frame) ->
    columnLabels = head (map frame.columns, (column) -> column.label), 15
    description = 'Columns: ' + (columnLabels.join ', ') + if frame.columns.length > columnLabels.length then "... (#{frame.columns.length - columnLabels.length} more columns)" else ''

    key: frame.key.name
    description: description
    size: toSize frame.byteSize
    rowCount: frame.rows
    columnCount: frame.columns.length
    isText: frame.isText
    inspect: -> 
      if frame.isText
        _.insertAndExecuteCell 'cs', "setupParse [ #{stringify frame.key.name } ]"
      else
        _.insertAndExecuteCell 'cs', "getFrame #{stringify frame.key.name}"

  importFiles = ->
    _.insertAndExecuteCell 'cs', 'importFiles'

  frameViews: map _frames, createFrameView
  hasFrames: _frames.length > 0
  importFiles: importFiles
  template: 'flow-frames-output'

do ->
  parserTypes = map [ 'AUTO', 'XLS', 'CSV', 'SVMLight' ], (type) -> type: type, caption: type

  parseDelimiters = do ->
    whitespaceSeparators = [
      'NULL'
      'SOH (start of heading)'
      'STX (start of text)'
      'ETX (end of text)'
      'EOT (end of transmission)'
      'ENQ (enquiry)'
      'ACK (acknowledge)'
      "BEL '\\a' (bell)"
      "BS  '\\b' (backspace)"
      "HT  '\\t' (horizontal tab)"
      "LF  '\\n' (new line)"
      "VT  '\\v' (vertical tab)"
      "FF  '\\f' (form feed)"
      "CR  '\\r' (carriage ret)"
      'SO  (shift out)'
      'SI  (shift in)'
      'DLE (data link escape)'
      'DC1 (device control 1) '
      'DC2 (device control 2)'
      'DC3 (device control 3)'
      'DC4 (device control 4)'
      'NAK (negative ack.)'
      'SYN (synchronous idle)'
      'ETB (end of trans. blk)'
      'CAN (cancel)'
      'EM  (end of medium)'
      'SUB (substitute)'
      'ESC (escape)'
      'FS  (file separator)'
      'GS  (group separator)'
      'RS  (record separator)'
      'US  (unit separator)'
      "' ' SPACE"
    ]

    createDelimiter = (caption, charCode) ->
      charCode: charCode
      caption: "#{caption}: '#{('00' + charCode).slice(-2)}'"

    whitespaceDelimiters = map whitespaceSeparators, createDelimiter

    characterDelimiters = times (126 - whitespaceSeparators.length), (i) ->
      charCode = i + whitespaceSeparators.length
      createDelimiter (String.fromCharCode charCode), charCode

    otherDelimiters = [ charCode: -1, caption: 'AUTO' ]

    concat whitespaceDelimiters, characterDelimiters, otherDelimiters

  Flow.SetupParseOutput = (_, _result) ->
    _sourceKeys = map _result.srcs, (src) -> src.name
    _parserType =  signal find parserTypes, (parserType) -> parserType.type is _result.pType
    _delimiter = signal find parseDelimiters, (delimiter) -> delimiter.charCode is _result.sep 
    _useSingleQuotes = signal _result.singleQuotes
    _columns = map _result.columnNames, (name) -> name: signal name
    _rows = _result.data
    _columnCount = _result.ncols
    _hasColumns = _columnCount > 0
    _destinationKey = signal _result.hexName
    _headerOptions = auto: 0, header: 1, data: -1
    _headerOption = signal if _result.checkHeader is 0 then 'auto' else if _result.checkHeader is -1 then 'data' else 'header'
    _deleteOnDone = signal yes

    parseFiles = ->
      columnNames = map _columns, (column) -> column.name()

      _.insertAndExecuteCell 'cs', "parseRaw\n  srcs: #{stringify _sourceKeys}\n  hex: #{stringify _destinationKey()}\n  pType: #{stringify _parserType().type}\n  sep: #{_delimiter().charCode}\n  ncols: #{_columnCount}\n  singleQuotes: #{_useSingleQuotes()}\n  columnNames: #{stringify columnNames}\n  delete_on_done: #{_deleteOnDone()}\n  checkHeader: #{_headerOptions[_headerOption()]}"

    sourceKeys: _sourceKeys
    parserTypes: parserTypes
    delimiters: parseDelimiters
    parserType: _parserType
    delimiter: _delimiter
    useSingleQuotes: _useSingleQuotes
    columns: _columns
    rows: _rows
    columnCount: _columnCount
    hasColumns: _hasColumns
    destinationKey: _destinationKey
    headerOption: _headerOption
    deleteOnDone: _deleteOnDone
    parseFiles: parseFiles
    template: 'flow-parse-raw-input'

Flow.ImportFilesInput = (_) ->
  #
  # Search files/dirs
  #
  _specifiedPath = signal ''
  _exception = signal ''
  _hasErrorMessage = lift _exception, (exception) -> if exception then yes else no

  tryImportFiles = ->
    specifiedPath = _specifiedPath()
    _.requestFileGlob specifiedPath, 0, (error, result) ->
      if error
        _exception error.data.errmsg
      else
        _exception ''
        #_go 'confirm', result
        processImportResult result

  #
  # File selection 
  #
  _importedFiles = signals []
  _importedFileCount = lift _importedFiles, (files) -> if files.length then "Found #{describeCount files.length, 'file'}:" else ''
  _hasImportedFiles = lift _importedFiles, (files) -> files.length > 0
  _hasUnselectedFiles = lift _importedFiles, (files) -> some files, (file) -> not file.isSelected()
  _selectedFiles = signals []
  _selectedFilesDictionary = lift _selectedFiles, (files) ->
    dictionary = {}
    for file in files
      dictionary[file.path] = yes
    dictionary
  _selectedFileCount = lift _selectedFiles, (files) -> "#{describeCount files.length, 'file'} selected:"
  _hasSelectedFiles = lift _selectedFiles, (files) -> files.length > 0

  importFiles = (files) ->
    paths = map files, (file) -> stringify file.path
    _.insertAndExecuteCell 'cs', "importFiles [ #{ paths.join ',' } ]"

  importSelectedFiles = -> importFiles _selectedFiles()

  createSelectedFileItem = (path) ->
    self =
      path: path
      deselect: ->
        _selectedFiles.remove self
        for file in _importedFiles() when file.path is path
          file.isSelected no
        return

  createFileItem = (path, isSelected) ->
    self =
      path: path
      isSelected: signal isSelected
      select: ->
        _selectedFiles.push createSelectedFileItem self.path
        self.isSelected yes 

    act self.isSelected, (isSelected) ->
      _hasUnselectedFiles some _importedFiles(), (file) -> not file.isSelected()

    self

  createFileItems = (result) ->
    map result.matches, (path) ->
      createFileItem path, _selectedFilesDictionary()[path]

  listPathHints = (query, process) ->
    _.requestFileGlob query, 10, (error, result) ->
      unless error
        process map result.matches, (value) -> value: value

  selectAllFiles = ->
    _selectedFiles map _importedFiles(), (file) ->
      createSelectedFileItem file.path
    for file in _importedFiles()
      file.isSelected yes
    return

  deselectAllFiles = ->
    _selectedFiles []
    for file in _importedFiles()
      file.isSelected no
    return
  
  processImportResult = (result) -> 
    files = createFileItems result
    _importedFiles files

  specifiedPath: _specifiedPath
  hasErrorMessage: _hasErrorMessage #XXX obsolete
  exception: _exception
  tryImportFiles: tryImportFiles
  listPathHints: throttle listPathHints, 100
  hasImportedFiles: _hasImportedFiles
  importedFiles: _importedFiles
  importedFileCount: _importedFileCount
  selectedFiles: _selectedFiles
  selectAllFiles: selectAllFiles
  deselectAllFiles: deselectAllFiles
  hasUnselectedFiles: _hasUnselectedFiles
  hasSelectedFiles: _hasSelectedFiles
  selectedFileCount: _selectedFileCount
  importSelectedFiles: importSelectedFiles
  template: 'flow-import-files'

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
    request '/Jobs.json', (error, result) ->
      if error
        go exception 'Error fetching jobs', error
      else
        go null, result.jobs 

  requestJob = (key, go) ->
    #opts = key: encodeURIComponent key
    #requestWithOpts '/Job.json', opts, go
    request "/Jobs.json/#{encodeURIComponent key}", (error, result) ->
      if error
        go exception "Error fetching job '#{key}'", error
      else
        go null, head result.jobs

  requestInspect = (key, go) ->
    opts = key: encodeURIComponent key
    requestWithOpts '/Inspect.json', opts, go

  requestFileGlob = (path, limit, go) ->
    opts =
      src: encodeURIComponent path
      limit: limit
    requestWithOpts '/Typeahead.json/files', opts, go

  requestImportFile = (path, go) ->
    opts = path: encodeURIComponent path
    requestWithOpts '/ImportFiles.json', opts, go

  requestImportFiles = (paths, go) ->
    tasks = map paths, (path) ->
      (go) ->
        requestImportFile path, go
    (iterate tasks) go

  requestParseSetup = (sources, go) ->
    encodedPaths = map sources, encodeURIComponent
    opts =
      srcs: "[#{join encodedPaths, ','}]"
    requestWithOpts '/ParseSetup.json', opts, go

  requestFrames = (go, opts) ->
    requestWithOpts '/3/Frames.json', opts, (error, result) ->
      if error
        go error
      else
        go null, result.frames

  encodeArray = (array) -> "[#{join (map array, encodeURIComponent), ','}]"
  requestModelBuilders = (algo, go) ->
    request "/2/ModelBuilders.json/#{algo}", go

  requestModelBuild = (algo, parameters, go) ->
    post "/2/ModelBuilders.json/#{algo}", parameters, go

  requestModels = (go, opts) ->
    requestWithOpts '/3/Models.json', opts, (error, result) ->
      if error
        go error, result
      else
        go error, result.models

  requestModel = (key, go) ->
    request "/3/Models.json/#{encodeURIComponent key}", (error, result) ->
      if error
        go error, result
      else
        go error, head result.models

  requestModelMetrics = (modelKey, frameKey, go) ->
    post "/3/ModelMetrics.json/models/#{encodeURIComponent modelKey}/frames/#{encodeURIComponent frameKey}", {}, go

  requestParseFiles = (sourceKeys, destinationKey, parserType, separator, columnCount, useSingleQuotes, columnNames, deleteOnDone, checkHeader, go) ->
    opts =
      hex: encodeURIComponent destinationKey
      srcs: encodeArray sourceKeys
      pType: parserType
      sep: separator
      ncols: columnCount
      singleQuotes: useSingleQuotes
      columnNames: encodeArray columnNames
      checkHeader: checkHeader
      delete_on_done: deleteOnDone
    requestWithOpts '/Parse.json', opts, go

  link _.requestFileGlob, requestFileGlob
  link _.requestImportFiles, requestImportFiles
  link _.requestParseSetup, requestParseSetup
  link _.requestParseFiles, requestParseFiles
  link _.requestInspect, requestInspect
  link _.requestJobs, requestJobs
  link _.requestJob, requestJob
  link _.requestFrames, (go) -> requestFrames go
  link _.requestFrame, (key, go) ->
    request "/3/Frames/#{encodeURIComponent key}", (error, result) ->
      if error
        go error
      else
        go null, head result.frames
  link _.requestColumnSummary, (key, column, go) ->
    request "/3/Frames/#{encodeURIComponent key}/columns/#{column}/summary", go
  link _.requestModelBuilders, requestModelBuilders
  link _.requestModelBuild, requestModelBuild
  link _.requestModels, requestModels
  link _.requestModel, requestModel
  link _.requestModelMetrics, requestModelMetrics

Flow.Gui = (_) ->
  
#  gui [
#    gui.text value: 'some text value', description: 'text desc'
#    gui.content value: '<i>italic</i>', description: 'content desc'
#    gui.checkbox label: 'checkbox label', value: yes, description: 'checkbox desc'
#    gui.dropdown label: 'dropdown label', options: [ 'foo', 'bar' ], value: null, caption: 'select one', description: 'dropdown desc'
#    gui.dropdown label: 'dropdown label', options: [ 'foo', 'bar' ], value: 'foo', caption: 'select one', description: 'dropdown2 desc'
#    gui.listbox label: 'listbox label', options: [ 'foo', 'bar' ], values: ['foo'], description: 'listbox desc'
#    gui.textbox value: 'some textbox value', description: 'textbox desc'
#    gui.textarea value: 'some textarea value', description: 'textarea desc', rows: 20
#    gui.button label: 'button label', description: 'button desc'
#  ]

  control = (type, opts) ->
    opts = {} unless opts
    guid = "gui_#{uniqueId()}"

    type: type
    id: opts.id or guid
    label: signal opts.label or ' '
    description: signal opts.description or ' '
    visible: signal if opts.visible is no then no else yes
    disable: signal if opts.disable is yes then yes else no
    template: "flow-form-#{type}"
    templateOf: (control) -> control.template

  wrapValue = (value, init) ->
    if value is undefined
      signal init
    else
      if isSignal value
        value
      else
        signal value

  wrapArray = (elements) ->
    if elements
      if isSignal elements
        element = elements()
        if isArray element then elements else signal [ element ]
      else
        signals if isArray elements then elements else [ elements ]
    else
      signals []

  content = (type, opts) ->
    self = control type, opts
    self.value = wrapValue opts.value, ''
    self

  text = (opts) -> content 'text', opts
  html = (opts) -> content 'html', opts
  markdown = (opts) -> content 'markdown', opts

  checkbox = (opts) ->
    self = control 'checkbox', opts
    self.value = wrapValue opts.value, if opts.value then yes else no
    self

  #TODO KO supports array valued args for 'checked' - can provide a checkboxes function

  dropdown = (opts) ->
    self = control 'dropdown', opts
    self.options = opts.options or []
    self.value = wrapValue opts.value
    self.caption = opts.caption or 'Choose...'
    self

  listbox = (opts) ->
    self = control 'listbox', opts
    self.options = opts.options or []
    self.values = wrapArray opts.values
    self

  textbox = (opts) ->
    self = control 'textbox', opts
    self.value = wrapValue opts.value, ''
    self.event = if isString opts.event then opts.event else null
    self

  textarea = (opts) ->
    self = control 'textarea', opts
    self.value = wrapValue opts.value, ''
    self.event = if isString opts.event then opts.event else null
    self.rows = if isNumber opts.rows then opts.rows else 5
    self

  button = (opts) ->
    self = control 'button', opts
    self.click = if isFunction opts.click then opts.click else noop
    self

  form = (controls, go) ->
    go null, signals controls or []

  gui = (controls) ->
    renderable form, controls, (form, go) ->
      go null, Flow.Form _, form

  gui.text = text
  gui.html = html
  gui.markdown = markdown
  gui.checkbox = checkbox
  gui.dropdown = dropdown
  gui.listbox = listbox
  gui.textbox = textbox
  gui.textarea = textarea
  gui.button = button

  gui

Flow.Routines = (_) ->

  renderJobs = (jobs, go) ->
    go null, Flow.JobsOutput _, jobs    

  renderJob = (job, go) ->
    go null, Flow.JobOutput _, job

  renderImportFiles = (importResults, go) ->
    go null, Flow.ImportFilesOutput _, importResults

  renderSetupParse = (parseSetupResults, go) ->
    go null, Flow.SetupParseOutput _, parseSetupResults

  renderParse = (parseResult, go) ->
    go null, Flow.ParseOutput _, parseResult

  renderFrames = (frames, go) ->
    go null, Flow.FramesOutput _, frames

  renderFrame = (frame, go) ->
    go null, Flow.FrameOutput _, frame

  renderBuildModel = (modelBuildResult, go) ->
    go null, Flow.JobOutput _, head modelBuildResult.jobs

  renderModels = (models, go) ->
    go null, Flow.ModelsOutput _, models

  renderModel = (model, go) ->
    go null, Flow.ModelOutput _, model

  renderMenu = (items, go) ->
    go null, Flow.Menu _, items

  getFrames = (arg) ->
    renderable _.requestFrames, renderFrames

  getFrame = (key) ->
    renderable _.requestFrame, key, renderFrame

  getModels = (arg) ->
    renderable _.requestModels, renderModels

  getModel = (key) ->
    renderable _.requestModel, key, renderModel

  getJobs = ->
    renderable _.requestJobs, renderJobs

  getJob = (arg) ->
    #XXX validation
    switch typeOf arg
      when 'String'
        renderable _.requestJob, arg, renderJob
      when 'Object'
        if arg.key?
          job arg.key
        else
          #XXX print usage
          throw new Error 'ni'
      else
        #XXX print usage
        throw new Error 'ni'

  gui = Flow.Gui _

  help = ->
    renderable noopFuture, (ignore, go) ->
      go null, 
        executeHelp: -> _.insertAndExecuteCell 'cs', 'help'
        executeMenu: -> _.insertAndExecuteCell 'cs', 'menu'
        template: 'flow-help-intro'
  
  menu = ->
    getMenu = (go) -> go null, _flowMenuItems
    renderable getMenu, renderMenu

  importFiles = (paths) ->
    #XXX validation
    renderable _.requestImportFiles, paths, renderImportFiles

  setupParse = (sourceKeys) ->
    #XXX validation
    renderable _.requestParseSetup, sourceKeys, renderSetupParse

  parseRaw = (opts) -> #XXX review args
    #XXX validation

    sourceKeys = opts.srcs
    destinationKey = opts.hex
    parserType = opts.pType
    separator = opts.sep
    columnCount = opts.ncols
    useSingleQuotes = opts.singleQuotes
    columnNames = opts.columnNames
    deleteOnDone = opts.delete_on_done
    checkHeader = opts.checkHeader

    renderable _.requestParseFiles, sourceKeys, destinationKey, parserType, separator, columnCount, useSingleQuotes, columnNames, deleteOnDone, checkHeader, renderParse

  buildModel = (algo, opts) ->
    if algo and opts and keys(opts).length > 1
      renderable _.requestModelBuild, algo, opts, renderBuildModel
    else
      renderable noopFuture, (ignore, go) ->
        go null, Flow.ModelInput _, algo, opts

  ###
  getUsageForFunction = (f) ->
    switch f
      when help
        name: 'help'
        examples: []
        description: 'Display help on a topic or function.'
        syntax: [
          'help topic'
          'help function'
        ]
        parameters: [
          'rgb': 'Number: foo'
        ]
        returns: 'HelpTopic: The help topic'
        related: null
      when jobs

      when job

      else
        null

  help = (arg) ->
    switch typeOf arg
      when 'undefined'

      when 'String'

      when 'Function'

      else
  ###

  dataflow = Flow.Dataflow

  loadScript = (path, go) ->
    onDone = (script, status) -> go null, script:script, status:status
    onFail = (jqxhr, settings, error) -> go error #TODO use framework error

    $.getScript path
      .done onDone
      .fail onFail

  fork: fork
  join: (args..., go) -> _join args, dataflow.applicate go
  call: (go, args...) -> _join args, dataflow.applicate go
  apply: (go, args) -> _join args, go
  isFuture: isFuture
  signal: signal
  signals: signals
  isSignal: isSignal
  react: dataflow.react
  invoke: dataflow.invoke
  merge: dataflow.merge
  lift: dataflow.lift
  menu: menu
  getJobs: getJobs
  getJob: getJob
  importFiles: importFiles
  setupParse: setupParse
  parseRaw: parseRaw
  getFrames: getFrames
  getFrame: getFrame
  buildModel: buildModel
  getModels: getModels
  getModel: getModel
  gui: gui
  loadScript: loadScript
  help: help

do ->
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
      block.unshift "_h2o_results_['#{guid}'].result do ->"

      # join and proceed
      go null, join block, '\n'

  compileCoffeescript = (cs, go) ->
    try
      go null, CoffeeScript.compile cs, bare: yes
    catch error
      go exception 'Error compiling coffee-script', error

  parseJavascript = (js, go) ->
    try
      go null, esprima.parse js
    catch error
      go exception 'Error parsing javascript expression', error


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
      for i, child of node
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
        rootScope = parseDeclarations program.body[0].expression.arguments[0].callee.body

        for name of sandbox.context
          rootScope[name] =
            name: name
            object: '_h2o_context_'
        go null, rootScope, program

      catch error
        go exception 'Error parsing root scope', error

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
      go exception 'Error rewriting javascript', error


  createGlobalScope = (rootScope, routines) ->
    globalScope = {}

    for name, identifier of rootScope
      globalScope[name] = identifier

    for name of routines
      globalScope[name] = name: name, object: 'h2o'

    globalScope

  rewriteJavascript = (sandbox) ->
    (rootScope, program, go) ->
      globalScope = createGlobalScope rootScope, sandbox.routines 

      try
        traverseJavascriptScoped [ globalScope ], globalScope, null, null, program, (globalScope, parent, key, node) ->
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
        go exception 'Error rewriting javascript', error


  generateJavascript = (program, go) ->
    try
      go null, escodegen.generate program
    catch error
      return go exception 'Error generating javascript', error

  compileJavascript = (js, go) ->
    try
      closure = new Function 'h2o', '_h2o_context_', '_h2o_results_', 'show', js
      go null, closure
    catch error
      go exception 'Error compiling javascript', error

  executeJavascript = (sandbox, show) ->
    (closure, go) ->
      try
        go null, closure sandbox.routines, sandbox.context, sandbox.results, show
      catch error
        go exception 'Error executing javascript', error

  Flow.Coffeescript = (_, guid, sandbox) ->
    show = (arg) ->
      if arg isnt show
        sandbox.results[guid].outputs arg
      show

    isRoutine = (f) ->
      for name, routine of sandbox.routines when f is routine
        return yes
      return no

    # XXX special-case functions so that bodies are not printed with the raw renderer.
    render = (input, output) ->
      sandbox.results[guid] = sandboxResult =
        result: signal null
        outputs: outputBuffer = createBuffer []

      #
      # XXX need separate implicit buffer
      #
      # Following case produces 1, timeout_id, 2, 3, 4...
      #
      # values = [1 .. 10]
      # process = ->
      #   value = values.shift()
      #   if value
      #     show value
      #     _.delay process, 1000
      # process()
      #
      
      evaluate = (ft) ->
        if ft?.isFuture
          ft (error, result) ->
            if error
              output.error exception 'Error evaluating cell', error
            else
              if ft.render
                ft.render result, (error, result) ->
                  if error
                    output.error exception 'Error rendering output', error
                  else
                    output.data result 
              else
                #XXX pick smarter renderers based on content
                output.data
                  object: dumpObject 'output', ft
                  template: 'flow-object'
        else
          output.data
            object: dumpObject 'output', ft
            template: 'flow-object'

      outputBuffer.subscribe evaluate

      tasks = [
        safetyWrapCoffeescript guid
        compileCoffeescript
        parseJavascript
        createRootScope sandbox
        removeHoistedDeclarations
        rewriteJavascript sandbox
        generateJavascript
        compileJavascript
        executeJavascript sandbox, show
      ]
      (pipe tasks) input, (error) ->
        output.error error if error
        output.end()

        cellResult = sandboxResult.result()
        if cellResult
          if isFunction cellResult
            if isRoutine cellResult
              show assist _, sandbox.routines, cellResult
            else
              evaluate cellResult
          else
            output.close
              object: dumpObject 'result', cellResult
              template: 'flow-object'

    render.isCode = yes
    render

Flow.Renderers = (_, _sandbox) ->
  h1: -> Flow.HtmlTag _, 'h1'
  h2: -> Flow.HtmlTag _, 'h2'
  h3: -> Flow.HtmlTag _, 'h3'
  h4: -> Flow.HtmlTag _, 'h4'
  h5: -> Flow.HtmlTag _, 'h5'
  h6: -> Flow.HtmlTag _, 'h6'
  md: -> Flow.Markdown _
  cs: (guid) -> Flow.Coffeescript _, guid, _sandbox
  raw: -> Flow.Raw _

Flow.Cell = (_, _renderers, type='cs', input='') ->
  _guid = do uniqueId
  _type = signal type
  _render = lift _type, (type) -> _renderers[type] _guid
  _isSelected = signal no
  _isActive = signal no
  _hasError = signal no
  _isBusy = signal no
  _isReady = lift _isBusy, (isBusy) -> not isBusy
  _hasInput = signal yes
  _input = signal input
  _outputs = signals []
  _result = signal null
  _hasOutput = lift _outputs, (outputs) -> outputs.length > 0
  _isOutputVisible = signal yes
  _isOutputHidden = lift _isOutputVisible, (visible) -> not visible

  # This is a shim.
  # The ko 'cursorPosition' custom binding attaches a read() method to this.
  _cursorPosition = {}

  # select and display input when activated
  act _isActive, (isActive) ->
    if isActive
      _.selectCell self
      _hasInput yes
      _outputs [] unless _render().isCode
    return

  # deactivate when deselected
  act _isSelected, (isSelected) ->
    _isActive no unless isSelected

  # tied to mouse-clicks on the cell
  select = ->
    _.selectCell self
    return yes # Explicity return true, otherwise KO will prevent the mouseclick event from bubbling up

  # tied to mouse-double-clicks on html content
  # TODO
  activate = -> _isActive yes

  execute = (go) ->
    input = _input().trim()
    unless input
      return if go then go() else undefined 

    render = _render()
    _isBusy yes
    # Clear any existing outputs
    _result null
    _outputs []
    _hasError no
    render input,
      data: (result) ->
        _outputs.push result
      close: (result) ->
        #XXX push to cell output
        _result result
      error: (error) ->
        _hasError yes
        #XXX review
        if error.cause?
          _outputs.push
            error: error
            template: 'flow-error'
        else
          _outputs.push
            text: JSON.stringify error, null, 2
            template: 'flow-raw'
      end: ->
        _hasInput render.isCode
        _isBusy no
        go() if go

    _isActive no

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
    outputs: _outputs
    result: _result
    hasOutput: _hasOutput
    isOutputVisible: _isOutputVisible
    toggleOutput: -> _isOutputVisible not _isOutputVisible()
    showOutput: -> _isOutputVisible yes
    hideOutput: -> _isOutputVisible no
    select: select
    activate: activate
    execute: execute
    _cursorPosition: _cursorPosition
    cursorPosition: -> _cursorPosition.read()
    templateOf: templateOf
    template: 'flow-cell'

Flow.Repl = (_, _renderers) ->
  _cells = signals []
  _selectedCell = null
  _selectedCellIndex = -1
  _clipboardCell = null
  _lastDeletedCell = null

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

  toggleOutput = ->
    _selectedCell.toggleOutput()

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
  toggleInput = notImplemented
  toggleAllInputs = notImplemented
  toggleAllOutputs = notImplemented
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
      createMenuItem 'Toggle Input', toggleInput, yes
      createMenuItem 'Toggle Output', toggleOutput
      menuDivider
      createMenuItem 'Toggle All Inputs', toggleAllInputs, yes
      createMenuItem 'Toggle All Outputs', toggleAllOutputs, yes
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

  executeHelp: -> _.insertAndExecuteCell 'cs', 'help'
  executeMenu: -> _.insertAndExecuteCell 'cs', 'menu'
  menus: _menus
  toolbar: _toolbar
  cells: _cells
  shortcutsHelp:
    normalMode: normalModeKeyboardShortcutsHelp
    editMode: editModeKeyboardShortcutsHelp
  templateOf: templateOf

$ ->
  window.flow = flow = Flow.Application do Flow.ApplicationContext
  ko.applyBindings flow
  flow.context.ready()
  
