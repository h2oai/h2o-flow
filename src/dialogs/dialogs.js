import { flowConfirmDialog } from '../flowConfirmDialog';
import { flowAlertDialog } from '../flowAlertDialog';

export function dialogs() {
  const Flow = window.Flow;
  const $ = window.jQuery;
  const __slice = [].slice;
  Flow.dialogs = _ => {
    const _dialog = Flow.Dataflow.signal(null);
    const showDialog = (ctor, args, _go) => {
      let dialog;
      let responded;
      responded = false;
      _dialog(dialog = ctor(...[_].concat(args).concat(go)));
      const $dialog = $(`#${dialog.template}`);
      $dialog.modal();
      $dialog.on('hidden.bs.modal', e => {
        if (!responded) {
          responded = true;
          _dialog(null);
          if (_go) {
            return _go(null);
          }
        }
      });
      function go(response) {
        if (!responded) {
          responded = true;
          $dialog.modal('hide');
          if (_go) {
            return _go(response);
          }
        }
      }
    };
    Flow.Dataflow.link(_.dialog, function () {
      let _i;
      const ctor = arguments[0];
      const args = arguments.length >= 3 ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []);
      const go = arguments[_i++];
      return showDialog(ctor, args, go);
    });
    Flow.Dataflow.link(_.confirm, (message, opts, go) => showDialog(flowConfirmDialog, [
      message,
      opts,
    ], go));
    Flow.Dataflow.link(_.alert, (message, opts, go) => showDialog(flowAlertDialog, [
      message,
      opts,
    ], go));
    return {
      dialog: _dialog,
      template(dialog) {
        return `flow-${dialog.template}`;
      },
    };
  };
}
