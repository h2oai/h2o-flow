import { h2oApplication } from '../h2oApplication';
import { flowApplication } from '../flowApplication';

//
// TODO
//
// XXX how does cell output behave when a widget throws an exception?
// XXX GLM case is failing badly. Investigate. Should catch/handle gracefully.
//
// integrate with groc
// tooltips on celltype flags
// arrow keys cause page to scroll - disable those behaviors
// scrollTo() behavior
//

export function flow() {
  const Flow = window.Flow;
  const ko = window.ko;
  const H2O = window.H2O;
  const $ = window.jQuery;
  const getContextPath = () => {
    window.Flow.ContextPath = '/';
    return $.ajax({
      url: window.referrer,
      type: 'GET',
      success(data, status, xhr) {
        if (xhr.getAllResponseHeaders().indexOf('X-h2o-context-path') !== -1) {
          window.Flow.ContextPath = xhr.getResponseHeader('X-h2o-context-path');
          return window.Flow.ContextPath;
        }
      },
      async: false,
    });
  };
  const checkSparklingWater = context => {
    context.onSparklingWater = false;
    return $.ajax({
      url: `${window.Flow.ContextPath}3/Metadata/endpoints`,
      type: 'GET',
      dataType: 'json',
      success(response) {
        let route;
        let _i;
        let _len;
        const _ref = response.routes;
        const _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          route = _ref[_i];
          if (route.url_pattern === '/3/scalaint') {
            _results.push(context.onSparklingWater = true);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      },
      async: false,
    });
  };
  if ((typeof window !== 'undefined' && window !== null ? window.$ : void 0) != null) {
    $(() => {
      const context = {};
      getContextPath();
      checkSparklingWater(context);
      window.flow = flowApplication(context, H2O.Routines);
      h2oApplication(context);
      ko.applyBindings(window.flow);
      context.ready();
      return context.initialized();
    });
  }
}
