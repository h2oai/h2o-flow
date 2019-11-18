{ assign, defer, every, find, flatten, head, identity, isPlainObject, map, some} = require('lodash')

{ act, lift, merge, react, signal, signals, unlink } = require("../../core/modules/dataflow")
{ stringify, isTruthy } = require('../../core/modules/prelude')
{ ControlGroups, columnLabelsFromFrame } = require('./controls')

AutoMLForm = (_, _parameters, _opts={}) ->
  _exception = signal null
  _validationFailureMessage = signal ''
  _hasValidationFailures = lift _validationFailureMessage, isTruthy

  requiredParameters = [
    'training_frame',
    'response_column'
  ]
  ignoredParameters = [
    'include_algos',
    'algo_parameters',
    'modeling_plan',
  ]
  # for the most part, defaults are taken from the REST API (default value of the property on the schema instance)
  # but we can set different defaults for Flow here
  localDefaults =
    keep_cross_validation_predictions: true
    keep_cross_validation_models: true

  defaults = assign({}, localDefaults, _opts)

  validParameters = (p for p in _parameters when p.name not in ignoredParameters)
  for p in validParameters
    if p.name in requiredParameters
      p.required = true
    if defaults[p.name]?
      p.value = defaults[p.name]

  columnParameterNames = (p.name for p in validParameters when p.type is 'VecSpecifier')

  _controlGroups = ControlGroups _,  validParameters
  _form = _controlGroups.createForm()
  _valid = null

  _parameterTemplateOf = (control) -> "flow-#{control.kind}-model-parameter"

  findParameter = (name) ->
    find validParameters, (p) -> p.name == name

  _collectParameters = ({includeUnchangedParameters=no, flat=yes}={}) ->
    controls = flatten _controlGroups.list
    parameters = {}
    for control in controls
      value = _controlGroups.readControlValue(control)
      if value? and control.isVisible() and (includeUnchangedParameters or control.isRequired or (control.defaultValue isnt value))
        if flat
          parameters[control.name] = value
        else
          nested = (findParameter control.name).path.split '.'
          p = parameters
          level = 0
          for token in nested
            level += 1
            if !p[token]?
              p[token] = {}
            p = p[token]
            if level == nested.length
              p[control.name] = value
    parameters

  # bind controls that depend on each other
  do ->
    [ trainingFrame,
      response,
      ignoredColumns,
      monotoneConstraints,
      balanceClasses,
      classSamplingFactors,
      maxAfterBalanceSize,
    ] = map [
      'training_frame',
      'response_column',
      'ignored_columns',
      'monotone_constraints',
      'balance_classes',
      'class_sampling_factors',
      'max_after_balance_size',
    ], _controlGroups.findControl
    columnControls = map columnParameterNames, _controlGroups.findControl

    _valid = lift trainingFrame.value, response.value, (training, response) -> training? and response?

    populateColumns = (columns) ->
      colNames = (c.value for c in columns)
      for colControl in columnControls
        colControl.values colNames
        paramValue = (findParameter colControl.name).value
        if paramValue in colNames
          colControl.value paramValue

      ignoredColValue = (findParameter ignoredColumns.name).value
      ignoredColumns.value ignoredColValue ? []
      ignoredColumns.values columns

      mcValue = (findParameter monotoneConstraints.name).value
      monotoneConstraints.value mcValue ? []
      monotoneConstraints.columns colNames

    act trainingFrame.value, (frameId) ->
      if frameId
        _.requestFrameSummaryWithoutData frameId, (error, frame) ->
          unless error
            columns = columnLabelsFromFrame(frame)
            populateColumns columns
      else
        populateColumns []

    act balanceClasses.value, (enabled) ->
      classSamplingFactors.isVisible enabled
      maxAfterBalanceSize.isVisible enabled

  exception: _exception
  form: _form
  collectParameters: _collectParameters
  parameterTemplateOf: _parameterTemplateOf
  valid: _valid
  hasValidationFailures: _hasValidationFailures
  validationFailureMessage: _validationFailureMessage


module.exports = (_, _go, _opts) ->
  _automlForm = signal null
  _canRunAutoML = signal null
  _exception = signal null
  react _automlForm, (aml) ->
    if aml?
      merge aml.valid, _canRunAutoML, identity
      merge aml.exception, _exception, identity

  performValidations = (checkForErrors, go) ->
    _exception null
    # parameters = _automlForm().collectParameters {includeUnchangedParameters: yes}
    # AutoML doesn't support server side validation yet, but this could be a useful addition.
    go()

  _runAutoML = ->
    _exception null
    performValidations yes, ->
      parameters = _automlForm().collectParameters {flat: no}
      _.insertAndExecuteCell 'cs', "runAutoML #{stringify parameters}, 'exec'"

  findSchemaField = (schema, name) ->
    for field in schema.fields when field.schema_name is name
      return field

  loadFields = (schema_name, path, with_fields) ->
    _.requestSchema schema_name, (error, response) ->
      if error
        with_fields null, error
      else
        schema = head response.schemas
        with_fields schema.fields, path

  requestBuilderParameters = (go) ->
    waiting = signal 0
    parameters = []
    acc = (fields, path) ->
      if fields is null
        go path, null
        return
      for field in fields
        if field.is_schema and field.value?.__meta
          fpath = if path == '' then field.name else path+'.'+field.name
          waiting waiting()+1
          loadFields field.schema_name, fpath, acc
        else if field.direction in ['INPUT', 'INOUT']
          field.path = path
          parameters.push field
      waiting waiting()-1

    waiting waiting()+1
    loadFields 'AutoMLBuildSpecV99', '', acc
    react waiting, (w) -> if w == 0 then go(null, parameters)

  loadFrameIds = (go)->
    _.requestFrames (error, frames) ->
      unless error
         go null, (frame.frame_id.name for frame in frames)
      else
         go error, null

  populateFrames = (_frames, parameters, go) ->
    act _frames, (frames) ->
      frameParameters = (p for p in parameters when p.type is 'Key<Frame>')
      for frame in frameParameters
        frame.values = frames
      go()

  flattenParams = (params) ->
    if isPlainObject params
      flatParams = {}
      collect = (kvs, target) ->
        for k, v of kvs
          if isPlainObject v
            collect v, target
          else
            target[k] = v
      collect params, flatParams
      flatParams
    else
      params

  do ->
    _frames = signals []
    loadFrameIds (error, ids) -> _frames ids
    requestBuilderParameters (error, parameters)  ->
      unless error
        populateFrames _frames, parameters, ->
          _automlForm AutoMLForm _, parameters, flattenParams _opts

  defer _go

  automlForm: _automlForm
  canRunAutoML: _canRunAutoML
  runAutoML: _runAutoML
  template: 'flow-automl-input'


