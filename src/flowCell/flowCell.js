/* eslint no-unused-vars: "error"*/

import templateOf from './templateOf';
import scrollIntoView from './scrollIntoView';
import autoResize from './autoResize';
import getCursorPosition from './getCursorPosition';
import execute from './execute';
import clear from './clear';
import toggleOutput from './toggleOutput';
import toggleInput from './toggleInput';
import clip from './clip';
import activate from './activate';
import navigate from './navigate';
import select from './select';

export function flowCell(_, type, input) {
  console.log('arguments from flowCell', arguments);
  const lodash = window._;
  const Flow = window.Flow;
  if (type == null) {
    type = 'cs';
  }
  if (input == null) {
    input = '';
  }
  const _guid = lodash.uniqueId();
  const _type = Flow.Dataflow.signal(type);
  const _render = Flow.Dataflow.lift(_type, type => _.renderers[type](_guid));
  const _isCode = Flow.Dataflow.lift(_render, render => render.isCode);
  const _isSelected = Flow.Dataflow.signal(false);
  const _isActive = Flow.Dataflow.signal(false);
  const _hasError = Flow.Dataflow.signal(false);
  const _isBusy = Flow.Dataflow.signal(false);
  const _isReady = Flow.Dataflow.lift(_isBusy, isBusy => !isBusy);
  const _time = Flow.Dataflow.signal('');
  const _hasInput = Flow.Dataflow.signal(true);
  const _input = Flow.Dataflow.signal(input);
  const _outputs = Flow.Dataflow.signals([]);
  // Only for headless use.
  const _errors = [];
  const _result = Flow.Dataflow.signal(null);
  const _hasOutput = Flow.Dataflow.lift(_outputs, outputs => outputs.length > 0);
  const _isInputVisible = Flow.Dataflow.signal(true);
  const _isOutputHidden = Flow.Dataflow.signal(false);

  // This is a shim for ko binding handlers to attach methods to
  // The ko 'cursorPosition' custom binding attaches a getCursorPosition() method to this.
  // The ko 'autoResize' custom binding attaches an autoResize() method to this.
  const _actions = {};

  // select and display input when activated
  Flow.Dataflow.act(_isActive, isActive => {
    if (isActive) {
      _.selectCell(self);
      _hasInput(true);
      if (!_isCode()) {
        _outputs([]);
      }
    }
  });

  // deactivate when deselected
  Flow.Dataflow.act(_isSelected, isSelected => {
    if (!isSelected) {
      return _isActive(false);
    }
  });

  const self = {
    guid: _guid,
    type: _type,
    isCode: _isCode,
    isSelected: _isSelected,
    isActive: _isActive,
    hasError: _hasError,
    isBusy: _isBusy,
    isReady: _isReady,
    time: _time,
    input: _input,
    hasInput: _hasInput,
    outputs: _outputs,
    result: _result,
    hasOutput: _hasOutput,
    isInputVisible: _isInputVisible,
    toggleInput: toggleInput.bind(this, _isInputVisible),
    isOutputHidden: _isOutputHidden,
    toggleOutput: toggleOutput.bind(this, _isOutputHidden),
    activate: activate.bind(this, _isActive),
    execute: execute.bind(
      this,
      _,
      _time,
      input,
      _input,
      _render,
      _isBusy,
      clear.bind(
        this,
        _result,
        _outputs,
        _errors,
        _hasError,
        _isCode,
        _hasInput
      ),
      _type,
      _outputs,
      _result,
      _hasError,
      _errors,
      _hasInput,
      _isActive,
      _isCode
    ),
    clear: clear.bind(
      this,
      _result,
      _outputs,
      _errors,
      _hasError,
      _isCode,
      _hasInput
    ),
    clip: clip.bind(
      this,
      _,
      _type,
      _input
    ),
    _actions,
    getCursorPosition: getCursorPosition.bind(this, _actions),
    autoResize: autoResize.bind(this, _actions),
    scrollIntoView: scrollIntoView.bind(this, _actions),
    templateOf,
    template: 'flow-cell',
  };
  const boundSelect = select.bind(this, _, self);
  self.select = boundSelect;
  const boundNavigate = navigate.bind(this, _, self);
  self.navigate = boundNavigate;
  return self;
}

