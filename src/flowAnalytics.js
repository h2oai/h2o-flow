import { postEchoRequest } from './h2oProxy/postEchoRequest';

export function flowAnalytics(_) {
  const lodash = window._;
  const Flow = window.Flow;
  if (typeof window.ga !== 'undefined') {
    Flow.Dataflow.link(_.trackEvent, (category, action, label, value) => lodash.defer(() => window.ga('send', 'event', category, action, label, value)));
    return Flow.Dataflow.link(_.trackException, description => lodash.defer(() => {
      postEchoRequest(_, `FLOW: ${description}`, () => {});
      return window.ga('send', 'exception', {
        exDescription: description,
        exFatal: false,
        appName: 'Flow',
        appVersion: Flow.Version,
      });
    }));
  }
}

