import { parseAndFormatObjectArray } from './parseAndFormatObjectArray';

export function inspectObjectArray_(name, origin, description, array) {
  return function () {
    const lodash = window._;
    const lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
    if (lightning.settings) {
      lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
      lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
    }
    const createList = lightning.createList;
    const createDataframe = lightning.createFrame;

    return createDataframe(name, [createList(name, parseAndFormatObjectArray(array))], lodash.range(array.length), null, {
      description: '',
      origin,
    });
  };
}
