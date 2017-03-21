import { flowOutline } from './flowOutline';
import { flowBrowser } from './flowBrowser';

export function flowSidebar(_) {
  const Flow = window.Flow;
  const _mode = Flow.Dataflow.signal('help');
  const _outline = flowOutline(_);
  const _isOutlineMode = Flow.Dataflow.lift(_mode, mode => mode === 'outline');
  const switchToOutline = () => _mode('outline');
  const _browser = flowBrowser(_);
  const _isBrowserMode = Flow.Dataflow.lift(_mode, mode => mode === 'browser');
  const switchToBrowser = () => _mode('browser');
  const _clipboard = Flow.clipboard(_);
  const _isClipboardMode = Flow.Dataflow.lift(_mode, mode => mode === 'clipboard');
  const switchToClipboard = () => _mode('clipboard');
  const _help = Flow.help(_);
  const _isHelpMode = Flow.Dataflow.lift(_mode, mode => mode === 'help');
  const switchToHelp = () => _mode('help');
  Flow.Dataflow.link(_.ready, () => {
    Flow.Dataflow.link(_.showHelp, () => switchToHelp());
    Flow.Dataflow.link(_.showClipboard, () => switchToClipboard());
    Flow.Dataflow.link(_.showBrowser, () => switchToBrowser());
    return Flow.Dataflow.link(_.showOutline, () => switchToOutline());
  });
  return {
    outline: _outline,
    isOutlineMode: _isOutlineMode,
    switchToOutline,
    browser: _browser,
    isBrowserMode: _isBrowserMode,
    switchToBrowser,
    clipboard: _clipboard,
    isClipboardMode: _isClipboardMode,
    switchToClipboard,
    help: _help,
    isHelpMode: _isHelpMode,
    switchToHelp,
  };
}

