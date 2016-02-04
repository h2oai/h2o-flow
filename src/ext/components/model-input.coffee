createControl = (kind, parameter) ->
  _hasError = signal no
  _hasWarning = signal no
  _hasInfo = signal no
  _message = signal ''
  _hasMessage = lift _message, (message) -> if message then yes else no
  _isVisible = signal yes
  _isGrided = signal no
  _isNotGrided = lift _isGrided, (value) -> not value

  kind: kind
  name: parameter.name
  label: parameter.label
  description: parameter.help
  isRequired: parameter.required
  hasError: _hasError
  hasWarning: _hasWarning
  hasInfo: _hasInfo
  message: _message
  hasMessage: _hasMessage
  isVisible: _isVisible
  isGridable: parameter.gridable
  isGrided: _isGrided
  isNotGrided: _isNotGrided

createTextboxControl = (parameter, type) ->
  isArrayValued = isInt = isReal = no

  switch type
    when 'byte[]', 'short[]', 'int[]', 'long[]'
      isArrayValued = yes
      isInt = yes
    when 'float[]', 'double[]'
      isArrayValued = yes
      isReal = yes
    when 'byte', 'short', 'int', 'long'
      isInt = yes
    when 'float', 'double'
      isReal = yes
  
  _text = signal if isArrayValued then join (parameter.actual_value ? []), ', ' else (parameter.actual_value ? '')

  _textGrided = signal _text() + ';'

  textToValues = (text) ->
    if isArrayValued
      vals = []
      for value in split text, /\s*,\s*/g
        if isInt
          unless isNaN parsed = parseInt value, 10
            vals.push parsed
        else if isReal
          unless isNaN parsed = parseFloat value
            vals.push parsed
        else
          vals.push value
      vals
    else
      text

  _value = lift _text, textToValues

  _valueGrided = lift _textGrided, (text) ->
    values = []
    for part in "#{text}".split /\s*;\s*/g
      if token = part.trim()
        push values, textToValues token
    values

  control = createControl 'textbox', parameter
  control.text = _text
  control.textGrided = _textGrided
  control.value = _value
  control.valueGrided = _valueGrided
  control.isArrayValued = isArrayValued

  control

createGridableValues = (values, defaultValue) ->
  map values, (value) ->
    label: value
    value: signal true

createDropdownControl = (parameter) ->
  _value = signal parameter.actual_value

  control = createControl 'dropdown', parameter
  control.values = signals parameter.values
  control.value = _value
  control.gridedValues = lift control.values, (values) ->
    createGridableValues values
  control

createListControl = (parameter) ->
  MaxItemsPerPage = 100
  _searchTerm = signal ''
  _ignoreNATerm = signal ''

  _values = signal [] 

  _selectionCount = signal 0

  _isUpdatingSelectionCount = no
  blockSelectionUpdates = (f) ->
    _isUpdatingSelectionCount = yes
    f()
    _isUpdatingSelectionCount = no

  incrementSelectionCount = (amount) ->
    _selectionCount _selectionCount() + amount

  createEntry = (value) ->
    isSelected = signal no
    react isSelected, (isSelected) -> 
      unless _isUpdatingSelectionCount
        if isSelected
          incrementSelectionCount 1
        else
          incrementSelectionCount -1
      return

    isSelected: isSelected
    value: value.value
    type: value.type
    missingLabel: value.missingLabel
    missingPercent: value.missingPercent

  _entries = lift _values, (values) -> map values, createEntry
  _filteredItems = signal []
  _visibleItems = signal []
  _hasFilteredItems = lift _filteredItems, (entries) -> entries.length > 0
  _currentPage = signal 0
  _maxPages = lift _filteredItems, (entries) -> Math.ceil entries.length / MaxItemsPerPage
  _canGoToPreviousPage = lift _currentPage, (index) -> index > 0
  _canGoToNextPage = lift _maxPages, _currentPage, (maxPages, index) -> index < maxPages - 1

  _searchCaption = lift _entries, _filteredItems, _selectionCount, _currentPage, _maxPages, (entries, filteredItems, selectionCount, currentPage, maxPages) ->
    caption = if maxPages is 0 then '' else "Showing page #{currentPage + 1} of #{maxPages}."
    if filteredItems.length isnt entries.length
      caption += " Filtered #{filteredItems.length} of #{entries.length}."
    if selectionCount isnt 0
      caption += " #{selectionCount} ignored."
    caption

  react _entries, -> filterItems yes

  _lastUsedSearchTerm = null
  _lastUsedIgnoreNaTerm = null
  filterItems = (force=no) ->
    searchTerm = _searchTerm().trim()
    ignoreNATerm = _ignoreNATerm().trim()

    if force or searchTerm isnt _lastUsedSearchTerm or ignoreNATerm isnt _lastUsedIgnoreNaTerm
      filteredItems = []
      for entry, i in _entries()
        missingPercent = parseFloat ignoreNATerm
        hide = no
        if (searchTerm isnt '') and -1 is entry.value.toLowerCase().indexOf searchTerm.toLowerCase()
          hide = yes
        else if (not isNaN missingPercent) and (missingPercent isnt 0) and entry.missingPercent <= missingPercent
          hide = yes

        unless hide
          filteredItems.push entry

      _lastUsedSearchTerm = searchTerm
      _lastUsedIgnoreNaTerm = ignoreNATerm
      _currentPage 0
      _filteredItems filteredItems
    
    start = _currentPage() * MaxItemsPerPage
    _visibleItems _filteredItems().slice start, start + MaxItemsPerPage

    return

  changeSelection = (source, value) ->
    for entry in source
      entry.isSelected value
    return

  selectFiltered = ->
    entries = _filteredItems()
    blockSelectionUpdates -> changeSelection entries, yes
    _selectionCount entries.length

  deselectFiltered = ->
    blockSelectionUpdates -> changeSelection _filteredItems(), no
    _selectionCount 0

  goToPreviousPage = ->
    if _canGoToPreviousPage()
      _currentPage _currentPage() - 1
      filterItems()
    return
  
  goToNextPage = ->
    if _canGoToNextPage()
      _currentPage _currentPage() + 1
      filterItems()
    return

  react _searchTerm, throttle filterItems, 500
  react _ignoreNATerm, throttle filterItems, 500

  control = createControl 'list', parameter
  control.values = _values
  control.entries = _visibleItems
  control.hasFilteredItems = _hasFilteredItems
  control.searchCaption = _searchCaption
  control.searchTerm = _searchTerm
  control.ignoreNATerm = _ignoreNATerm
  control.value = _entries
  control.selectFiltered = selectFiltered
  control.deselectFiltered = deselectFiltered
  control.goToPreviousPage = goToPreviousPage
  control.goToNextPage = goToNextPage
  control.canGoToPreviousPage = _canGoToPreviousPage
  control.canGoToNextPage = _canGoToNextPage
  control

createCheckboxControl = (parameter) ->
  _value = signal parameter.actual_value

  control = createControl 'checkbox', parameter
  control.clientId = do uniqueId
  control.value = _value
  control

createControlFromParameter = (parameter) ->
  switch parameter.type
    when 'enum', 'Key<Frame>', 'VecSpecifier'
      createDropdownControl parameter
    when 'string[]'
      createListControl parameter
    when 'boolean'
      createCheckboxControl parameter
    when 'Key<Model>', 'string', 'byte', 'short', 'int', 'long', 'float', 'double', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
      createTextboxControl parameter, parameter.type
    else
      console.error 'Invalid field', JSON.stringify parameter, null, 2
      null

H2O.ModelBuilderForm = (_, _algorithm, _parameters) ->
  _exception = signal null
  _validationFailureMessage = signal ''
  _hasValidationFailures = lift _validationFailureMessage, isTruthy

  _parametersByLevel = groupBy _parameters, (parameter) -> parameter.level
  _controlGroups = map [ 'critical', 'secondary', 'expert' ], (type) ->
    filter (map _parametersByLevel[type], createControlFromParameter), (a) -> if a then yes else no

  [ criticalControls, secondaryControls, expertControls ] = _controlGroups

  _form = []
  if criticalControls.length
    _form.push kind: 'group', title: 'Parameters'
    _form.push control for control in criticalControls

  if secondaryControls.length
    _form.push kind: 'group', title: 'Advanced'
    _form.push control for control in secondaryControls

  if expertControls.length
    _form.push kind: 'group', title: 'Expert'
    _form.push control for control in expertControls

  findControl = (name) ->
    for controls in _controlGroups
      for control in controls when control.name is name
        return control
    return

  parameterTemplateOf = (control) -> "flow-#{control.kind}-model-parameter"

  findFormField = (name) -> find _form, (field) -> field.name is name

  do ->
    [ trainingFrameParameter, validationFrameParameter, responseColumnParameter, ignoredColumnsParameter, offsetColumnsParameter, weightsColumnParameter, foldColumnParameter ] = map [ 'training_frame', 'validation_frame', 'response_column', 'ignored_columns', 'offset_column', 'weights_column', 'fold_column' ], findFormField

    if trainingFrameParameter
      if responseColumnParameter or ignoredColumnsParameter
        act trainingFrameParameter.value, (frameKey) ->
          if frameKey
            _.requestFrameSummaryWithoutData frameKey, (error, frame) ->
              unless error
                columnValues = map frame.columns, (column) -> column.label
                columnLabels = map frame.columns, (column) -> 
                  missingPercent = 100 * column.missing_count / frame.rows

                  type: if column.type is 'enum' then "enum(#{column.domain_cardinality})" else column.type
                  value: column.label
                  missingPercent: missingPercent
                  missingLabel: if missingPercent is 0 then '' else "#{round missingPercent}% NA"

                if responseColumnParameter
                  responseColumnParameter.values columnValues

                if ignoredColumnsParameter
                  ignoredColumnsParameter.values columnLabels

                if weightsColumnParameter
                  weightsColumnParameter.values columnValues

                if foldColumnParameter
                  foldColumnParameter.values columnValues

                if offsetColumnsParameter
                  offsetColumnsParameter.values columnValues

                if responseColumnParameter and ignoredColumnsParameter
                  # Mark response column as 'unavailable' in ignored column list.
                  lift responseColumnParameter.value, (responseVariableName) ->
                    # FIXME
                    # ignoredColumnsParameter.unavailableValues [ responseVariableName ]

          return

  collectParameters = (includeUnchangedParameters=no) ->
    isGrided = no

    parameters = {}
    hyperParameters = {}
    for controls in _controlGroups
      for control in controls
        if control.isGrided()
          isGrided = yes
          switch control.kind
            when 'textbox'
              hyperParameters[control.name] = control.valueGrided()
            when 'dropdown'
              hyperParameters[control.name] = selectedValues = []
              for item in control.gridedValues()
                if item.value()
                  selectedValues.push item.label
            else # checkbox
              hyperParameters[control.name] = [ true, false ]
        else
          value = control.value()
          if control.isVisible() and (includeUnchangedParameters or control.isRequired or (control.defaultValue isnt value))
            switch control.kind
              when 'dropdown'
                if value
                  parameters[control.name] = value
              when 'list'
                if value.length
                  selectedValues = for entry in value when entry.isSelected()
                    entry.value
                  parameters[control.name] = selectedValues
              else
                parameters[control.name] = value
    if isGrided
      parameters.hyper_parameters = hyperParameters
    parameters

  #
  # The 'checkForErrors' parameter exists so that we can conditionally choose 
  # to ignore validation errors. This is because we need the show/hide states 
  # for each field the first time around, but not the errors/warnings/info 
  # messages. 
  #
  # Thus, when this function is called during form init, checkForErrors is 
  #  passed in as 'false', and during form submission, checkForErrors is 
  #  passsed in as 'true'.
  #
  performValidations = (checkForErrors, go) ->
    _exception null
    parameters = collectParameters yes

    if parameters.hyper_parameters
      return go() # parameter validation fails with hyper_parameters, so skip.

    _validationFailureMessage ''

    _.requestModelInputValidation _algorithm, parameters, (error, modelBuilder) ->
      if error
        _exception Flow.Failure _, new Flow.Error 'Error fetching initial model builder state', error
      else
        hasErrors = no

        if modelBuilder.messages.length
          validationsByControlName = groupBy modelBuilder.messages, (validation) -> validation.field_name

          for controls in _controlGroups
            for control in controls
              if validations = validationsByControlName[control.name]
                for validation in validations
                  if validation.message_type is 'TRACE'
                    control.isVisible no
                  else
                    control.isVisible yes
                    if checkForErrors
                      switch validation.message_type
                        when 'INFO'
                          control.hasInfo yes
                          control.message validation.message
                        when 'WARN'
                          control.hasWarning yes
                          control.message validation.message
                        when 'ERRR'
                          control.hasError yes
                          control.message validation.message
                          hasErrors = yes
              else
                control.isVisible yes
                control.hasInfo no
                control.hasWarning no
                control.hasError no
                control.message ''

        if hasErrors
          _validationFailureMessage 'Your model parameters have one or more errors. Please fix them and try again.'
          # Do not pass go(). Do not collect $200.
        else
          _validationFailureMessage ''
          go() # Proceed with form submission

  createModel = ->
    _exception null
    performValidations yes, ->
      parameters = collectParameters no
      _.insertAndExecuteCell 'cs', "buildModel '#{_algorithm}', #{stringify parameters}"

  _revalidate = (value) ->
    if value isnt undefined # HACK: KO seems to be raising change notifications when dropdown boxes are initialized. 
      performValidations no, ->

  revalidate = throttle _revalidate, 100, leading: no

  # Kick off validations (minus error checking) to get hidden parameters
  performValidations no, ->
    for controls in _controlGroups
      for control in controls
        react control.value, revalidate
    return

  form: _form
  exception: _exception
  parameterTemplateOf: parameterTemplateOf
  createModel: createModel
  hasValidationFailures: _hasValidationFailures
  validationFailureMessage: _validationFailureMessage

H2O.ModelInput = (_, _go, _algo, _opts) ->
  _exception = signal null
  _algorithms = signal []
  _algorithm = signal null
  _canCreateModel = lift _algorithm, (algorithm) -> if algorithm then yes else no

  _modelForm = signal null

  populateFramesAndColumns = (frameKey, algorithm, parameters, go) ->

    destinationKeyParameter = find parameters, (parameter) -> parameter.name is 'model_id'

    if destinationKeyParameter and not destinationKeyParameter.actual_value
      destinationKeyParameter.actual_value = "#{algorithm}-#{Flow.Util.uuid()}"

    #
    # Force classification.
    #
    classificationParameter = find parameters, (parameter) -> parameter.name is 'do_classification'

    if classificationParameter
      classificationParameter.actual_value = yes

    _.requestFrames (error, frames) ->
      if error
        #TODO handle properly
      else
        frameKeys = (frame.frame_id.name for frame in frames)
        frameParameters = filter parameters, (parameter) -> parameter.type is 'Key<Frame>'
        for parameter in frameParameters
          parameter.values = frameKeys

          #TODO HACK
          if parameter.name is 'training_frame'
            if frameKey
              parameter.actual_value = frameKey
            else
              frameKey = parameter.actual_value

        return go()

  do ->
    _.requestModelBuilders (error, modelBuilders) ->
      _algorithms modelBuilders
      _algorithm if _algo then (find modelBuilders, (builder) -> builder.algo is _algo) else undefined
      frameKey = _opts?.training_frame
      act _algorithm, (builder) ->
        if builder
          algorithm = builder.algo
          parameters = deepClone builder.parameters
          populateFramesAndColumns frameKey, algorithm, parameters, ->
            _modelForm H2O.ModelBuilderForm _, algorithm, parameters
        else
          _modelForm null

  createModel = -> _modelForm().createModel()

  defer _go

  parentException: _exception #XXX hacky
  algorithms: _algorithms
  algorithm: _algorithm
  modelForm: _modelForm
  canCreateModel: _canCreateModel
  createModel: createModel
  template: 'flow-model-input'

