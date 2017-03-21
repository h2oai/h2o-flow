import { multilineTextToHTML } from './utils/multilineTextToHTML';

export function flowAlertDialog(_, _message, _opts, _go) {
  const lodash = window._;
  const Flow = window.Flow;
  if (_opts == null) {
    _opts = {};
  }
  lodash.defaults(_opts, {
    title: 'Alert',
    acceptCaption: 'OK',
  });
  const accept = () => _go(true);
  return {
    title: _opts.title,
    acceptCaption: _opts.acceptCaption,
    message: multilineTextToHTML(_message),
    accept,
    template: 'alert-dialog',
  };
}

