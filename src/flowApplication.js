import { flowApplicationContext } from './flowApplicationContext';
import { flowSandbox } from './flowSandbox';
import { flowAnalytics } from './flowAnalytics';
import { flowGrowl } from './flowGrowl';
import { flowAutosave } from './flowAutosave';
import { flowRenderers } from './notebook/flowRenderers';
import flowNotebook from './notebook/flowNotebook';
import { requestPack } from './h2oProxy/requestPack';
import { requestFlow } from './h2oProxy/requestFlow';
import { requestRemoveAll } from './routines/requestRemoveAll';

export function flowApplication(_, routines) {
  const Flow = window.Flow;
  flowApplicationContext(_);
  const _sandbox = flowSandbox(_, routines(_));
  // TODO support external renderers
  _.renderers = flowRenderers(_, _sandbox);
  console.log('_.renderers from flowApplication', _.renderers);
  flowAnalytics(_);
  flowGrowl(_);
  flowAutosave(_);
  const _notebook = flowNotebook(_);
  _.requestPack = requestPack;
  _.requestFlow = requestFlow;
  _.requestRemoveAll = requestRemoveAll;
  return {
    context: _,
    sandbox: _sandbox,
    view: _notebook,
  };
}
