import { format4f } from './format4f';
import { parseNulls } from './parseNulls';
import { parseNaNs } from './parseNaNs';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function inspectFrameData(frameKey, frame) {
  return function () {
    const lodash = window._;
    const lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
    if (lightning.settings) {
      lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
      lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
    }
    const createVector = lightning.createVector;
    const createFactor = lightning.createFactor;
    const createList = lightning.createList;
    const createDataframe = lightning.createFrame;
    let column;
    let domain;
    let index;
    let rowIndex;
    const frameColumns = frame.columns;
    const vectors = (() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = frameColumns.length; _i < _len; _i++) {
        column = frameColumns[_i];
        switch (column.type) {
          case 'int':
          case 'real':
            _results.push(createVector(column.label, 'Number', parseNaNs(column.data), format4f));
            break;
          case 'enum':
            domain = column.domain;
            _results.push(createFactor(column.label, 'String', (() => {
              let _j;
              let _len1;
              const _ref1 = column.data;
              const _results1 = [];
              for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                index = _ref1[_j];
                _results1.push(index != null ? domain[index] : void 0);
              }
              return _results1;
            })()));
            break;
          case 'time':
            _results.push(createVector(column.label, 'Number', parseNaNs(column.data)));
            break;
          case 'string':
          case 'uuid':
            _results.push(createList(column.label, parseNulls(column.string_data)));
            break;
          default:
            _results.push(createList(column.label, parseNulls(column.data)));
        }
      }
      return _results;
    })();
    vectors.unshift(createVector('Row', 'Number', (() => {
      let _i;
      let _ref1;
      let _ref2;
      const _results = [];
      for (rowIndex = _i = _ref1 = frame.row_offset, _ref2 = frame.row_count; _ref1 <= _ref2 ? _i < _ref2 : _i > _ref2; rowIndex = _ref1 <= _ref2 ? ++_i : --_i) {
        _results.push(rowIndex + 1);
      }
      return _results;
    })()));
    return createDataframe('data', vectors, lodash.range(frame.row_count - frame.row_offset), null, {
      description: 'A partial list of rows in the H2O Frame.',
      origin: `getFrameData ${flowPrelude.stringify(frameKey)}`,
    });
  };
}
