import { format6fi } from './format6fi';

export function inspectRawObject_(name, origin, description, obj) {
  return function () {
    const lodash = window._;

    const lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
    if (lightning.settings) {
      lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
      lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
    }
    const createList = lightning.createList;
    const createDataframe = lightning.createFrame;

    let k;
    let v;
    const vectors = (() => {
      const _results = [];
      for (k in obj) {
        if ({}.hasOwnProperty.call(obj, k)) {
          v = obj[k];
          _results.push(createList(k, [v === null ? void 0 : lodash.isNumber(v) ? format6fi(v) : v]));
        }
      }
      return _results;
    })();
    return createDataframe(name, vectors, lodash.range(1), null, {
      description: '',
      origin,
    });
  };
}
