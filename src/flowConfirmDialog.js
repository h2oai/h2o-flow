import { multilineTextToHTML } from './utils/multilineTextToHTML';

export function flowConfirmDialog(_, _message, _opts, _go) {
  const lodash = window._;
  const Flow = window.Flow;
  if (_opts == null) {
    _opts = {};
  }
  lodash.defaults(_opts, {
    title: 'Confirm',
    acceptCaption: 'Yes',
    declineCaption: 'No',
  });
  const accept = () => _go(true);
  const decline = () => _go(false);
  return {
    title: _opts.title,
    acceptCaption: _opts.acceptCaption,
    declineCaption: _opts.declineCaption,
    message: multilineTextToHTML(_message),
    accept,
    decline,
    template: 'confirm-dialog',
  };
}

