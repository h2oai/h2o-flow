import { getAboutRequest } from '../h2oProxy/getAboutRequest';

export function about() {
  const Flow = window.Flow;
  Flow.Version = '0.6.1';
  Flow.about = _ => {
    const _properties = Flow.Dataflow.signals([]);
    Flow.Dataflow.link(_.ready, () => {
      if (Flow.BuildProperties) {
        return _properties(Flow.BuildProperties);
      }
      return getAboutRequest(_, (error, response) => {
        let name;
        let value;
        let _i;
        let _len;
        let _ref;
        let _ref1;
        const properties = [];
        if (!error) {
          _ref = response.entries;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            _ref1 = _ref[_i];
            name = _ref1.name;
            value = _ref1.value;
            properties.push({
              caption: `H2O ${name}`,
              value,
            });
          }
        }
        properties.push({
          caption: 'Flow version',
          value: Flow.Version,
        });
        Flow.BuildProperties = properties;
        return _properties(Flow.BuildProperties);
      });
    });
    return { properties: _properties };
  };
}
