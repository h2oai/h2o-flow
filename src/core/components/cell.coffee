Flow.Cell = (_, _renderers, type='cs', input='') ->
  _guid = do uniqueId
  _type = signal type
  _render = lift _type, (type) -> _renderers[type] _guid
  _isCode = lift _render, (render) -> render.isCode
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
  _isInputVisible = signal yes
  _isOutputHidden = signal no

  # This is a shim for ko binding handlers to attach methods to
  # The ko 'cursorPosition' custom binding attaches a getCursortPosition() method to this.
  # The ko 'autoResize' custom binding attaches an autoResize() method to this.
  _actions = {}

  # select and display input when activated
  act _isActive, (isActive) ->
    if isActive
      _.selectCell self
      _hasInput yes
      _outputs [] unless _isCode()
    return

  # deactivate when deselected
  act _isSelected, (isSelected) ->
    _isActive no unless isSelected

  # tied to mouse-clicks on the cell
  select = ->
    _.selectCell self, no # pass scrollIntoView=no, otherwise mouse actions like clicking on a form field will cause scrolling.
    return yes # Explicity return true, otherwise KO will prevent the mouseclick event from bubbling up

  # tied to mouse-double-clicks on html content
  # TODO
  activate = -> _isActive yes

  clip = ->
    _.saveClip 'user', _type(), _input()

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
        if error.name is 'FlowError'
          _outputs.push Flow.Failure error
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
    isCode: _isCode
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
    isInputVisible: _isInputVisible
    toggleInput: -> _isInputVisible not _isInputVisible()
    isOutputHidden: _isOutputHidden
    toggleOutput: -> _isOutputHidden not _isOutputHidden()
    select: select
    activate: activate
    execute: execute
    clip: clip
    _actions: _actions
    getCursorPosition: -> _actions.getCursorPosition()
    autoResize: -> _actions.autoResize()
    scrollIntoView: -> _actions.scrollIntoView()
    templateOf: (view) -> view.template
    template: 'flow-cell'

