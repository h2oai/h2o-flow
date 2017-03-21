import { format4f } from './format4f';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function inspectFrameColumns(tableLabel, frameKey, frame, frameColumns) {
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
    let attr;
    let column;
    let i;
    let title;
    const attrs = [
      'label',
      'type',
      'missing_count|Missing',
      'zero_count|Zeros',
      'positive_infinity_count|+Inf',
      'negative_infinity_count|-Inf',
      'min',
      'max',
      'mean',
      'sigma',
      'cardinality',
    ];
    const toColumnSummaryLink = label => `<a href=\'#\' data-type=\'summary-link\' data-key=${flowPrelude.stringify(label)}>${lodash.escape(label)}</a>`;
    const toConversionLink = value => {
      const _ref1 = value.split('\0');
      const type = _ref1[0];
      const label = _ref1[1];
      switch (type) {
        case 'enum':
          return `<a href=\'#\' data-type=\'as-numeric-link\' data-key=${flowPrelude.stringify(label)}>Convert to numeric</a>`;
        case 'int':
        case 'string':
          return `<a href=\'#\' data-type=\'as-factor-link\' data-key=${flowPrelude.stringify(label)}>Convert to enum</a>`;
        default:
          return void 0;
      }
    };
    const vectors = (() => {
      // XXX format functions
      let _i;
      let _len;
      let _ref1;
      const _results = [];
      for (_i = 0, _len = attrs.length; _i < _len; _i++) {
        attr = attrs[_i];
        _ref1 = attr.split('|');
        const columnName = _ref1[0];
        title = _ref1[1];
        title = title != null ? title : columnName;
        switch (columnName) {
          case 'min':
            _results.push(createVector(title, 'Number', (() => {
              let _j;
              let _len1;
              const _results1 = [];
              for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                column = frameColumns[_j];
                _results1.push(lodash.head(column.mins));
              }
              return _results1;
            })(), format4f));
            break;
          case 'max':
            _results.push(createVector(title, 'Number', (() => {
              let _j;
              let _len1;
              const _results1 = [];
              for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                column = frameColumns[_j];
                _results1.push(lodash.head(column.maxs));
              }
              return _results1;
            })(), format4f));
            break;
          case 'cardinality':
            _results.push(createVector(title, 'Number', (() => {
              let _j;
              let _len1;
              const _results1 = [];
              for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                column = frameColumns[_j];
                _results1.push(column.type === 'enum' ? column.domain_cardinality : void 0);
              }
              return _results1;
            })()));
            break;
          case 'label':
            _results.push(createFactor(title, 'String', (() => {
              let _j;
              let _len1;
              const _results1 = [];
              for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                column = frameColumns[_j];
                _results1.push(column[columnName]);
              }
              return _results1;
            })(), null, toColumnSummaryLink));
            break;
          case 'type':
            _results.push(createFactor(title, 'String', (() => {
              let _j;
              let _len1;
              const _results1 = [];
              for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                column = frameColumns[_j];
                _results1.push(column[columnName]);
              }
              return _results1;
            })()));
            break;
          case 'mean':
          case 'sigma':
            _results.push(createVector(title, 'Number', (() => {
              let _j;
              let _len1;
              const _results1 = [];
              for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                column = frameColumns[_j];
                _results1.push(column[columnName]);
              }
              return _results1;
            })(), format4f));
            break;
          default:
            _results.push(createVector(title, 'Number', (() => {
              let _j;
              let _len1;
              const _results1 = [];
              for (_j = 0, _len1 = frameColumns.length; _j < _len1; _j++) {
                column = frameColumns[_j];
                _results1.push(column[columnName]);
              }
              return _results1;
            })()));
        }
      }
      return _results;
    })();
    const labelVector = vectors[0];
    const typeVector = vectors[1];
    const actionsData = (() => {
      let _i;
      let _ref1;
      const _results = [];
      for (i = _i = 0, _ref1 = frameColumns.length; _ref1 >= 0 ? _i < _ref1 : _i > _ref1; i = _ref1 >= 0 ? ++_i : --_i) {
        _results.push(`${typeVector.valueAt(i)}\0${labelVector.valueAt(i)}`);
      }
      return _results;
    })();
    vectors.push(createFactor('Actions', 'String', actionsData, null, toConversionLink));
    return createDataframe(tableLabel, vectors, lodash.range(frameColumns.length), null, {
      description: `A list of ${tableLabel} in the H2O Frame.`,
      origin: `getFrameSummary ${flowPrelude.stringify(frameKey)}`,
      plot: `plot inspect \'${tableLabel}\', getFrameSummary ${flowPrelude.stringify(frameKey)}`,
    });
  };
}
