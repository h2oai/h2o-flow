  export function trackPath(_, path) {
    let base;
    let e;
    let name;
    let other;
    let root;
    let version;
    let _ref;
    let _ref1;
    try {
      _ref = path.split('/');
      root = _ref[0];
      version = _ref[1];
      name = _ref[2];
      _ref1 = name.split('?');
      base = _ref1[0];
      other = _ref1[1];
      if (base !== 'Typeahead' && base !== 'Jobs') {
        _.trackEvent('api', base, version);
      }
    } catch (_error) {
      e = _error;
    }
  }
