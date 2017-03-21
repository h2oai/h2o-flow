import { render_ } from './render_';
import { inspect_ } from './inspect_';
import { createArrays } from './createArrays';

import { h2oColumnSummaryOutput } from '../h2oColumnSummaryOutput';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function extendColumnSummary(_, frameKey, frame, columnName) {
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
  const column = lodash.head(frame.columns);
  const rowCount = frame.rows;
  const inspectPercentiles = () => {
    const vectors = [
      createVector('percentile', 'Number', frame.default_percentiles),
      createVector('value', 'Number', column.percentiles),
    ];
    return createDataframe('percentiles', vectors, lodash.range(frame.default_percentiles.length), null, {
      description: `Percentiles for column \'${column.label}\' in frame \'${frameKey}\'.`,
      origin: `getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`,
    });
  };
  const inspectDistribution = () => {
    let binCount;
    let binIndex;
    let count;
    let countData;
    let i;
    let intervalData;
    let m;
    let n;
    let widthData;
    let _i;
    let _j;
    let _k;
    let _l;
    let _len;
    let _ref1;
    const minBinCount = 32;
    const base = column.histogram_base;
    const stride = column.histogram_stride;
    const bins = column.histogram_bins;
    const width = Math.ceil(bins.length / minBinCount);
    const interval = stride * width;
    const rows = [];
    if (width > 0) {
      binCount = minBinCount + (bins.length % width > 0 ? 1 : 0);
      intervalData = new Array(binCount);
      widthData = new Array(binCount);
      countData = new Array(binCount);

      // Trim off empty bins from the end
      for (i = _i = 0; binCount >= 0 ? _i < binCount : _i > binCount; i = binCount >= 0 ? ++_i : --_i) {
        m = i * width;
        n = m + width;
        count = 0;
        for (binIndex = _j = m; m <= n ? _j < n : _j > n; binIndex = m <= n ? ++_j : --_j) {
          if (binIndex < bins.length) {
            count += bins[binIndex];
          }
        }
        intervalData[i] = base + i * interval;
        widthData[i] = interval;
        countData[i] = count;
      }
    } else {
      binCount = bins.length;
      intervalData = new Array(binCount);
      widthData = new Array(binCount);
      countData = new Array(binCount);
      for (i = _k = 0, _len = bins.length; _k < _len; i = ++_k) {
        count = bins[i];
        intervalData[i] = base + i * stride;
        widthData[i] = stride;
        countData[i] = count;
      }
    }
    for (i = _l = _ref1 = binCount - 1; _ref1 <= 0 ? _l <= 0 : _l >= 0; i = _ref1 <= 0 ? ++_l : --_l) {
      if (countData[i] !== 0) {
        binCount = i + 1;
        intervalData = intervalData.slice(0, binCount);
        widthData = widthData.slice(0, binCount);
        countData = countData.slice(0, binCount);
        break;
      }
    }
    const vectors = [
      createFactor('interval', 'String', intervalData),
      createVector('width', 'Number', widthData),
      createVector('count', 'Number', countData),
    ];
    return createDataframe('distribution', vectors, lodash.range(binCount), null, {
      description: `Distribution for column \'${column.label}\' in frame \'${frameKey}\'.`,
      origin: `getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`,
      plot: `plot inspect \'distribution\', getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`,
    });
  };
  const inspectCharacteristics = () => {
    let count;
    const missing_count = column.missing_count; // eslint-disable-line camelcase
    const zero_count = column.zero_count; // eslint-disable-line camelcase
    const positive_infinity_count = column.positive_infinity_count; // eslint-disable-line camelcase
    const negative_infinity_count = column.negative_infinity_count; // eslint-disable-line camelcase
    const other = rowCount - missing_count - zero_count - positive_infinity_count - negative_infinity_count; // eslint-disable-line camelcase
    const characteristicData = [
      'Missing',
      '-Inf',
      'Zero',
      '+Inf',
      'Other',
    ];
    const countData = [
      missing_count, // eslint-disable-line camelcase
      negative_infinity_count, // eslint-disable-line camelcase
      zero_count, // eslint-disable-line camelcase
      positive_infinity_count, // eslint-disable-line camelcase
      other,
    ];
    const percentData = (() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = countData.length; _i < _len; _i++) {
        count = countData[_i];
        _results.push(100 * count / rowCount);
      }
      return _results;
    })();
    const vectors = [
      createFactor('characteristic', 'String', characteristicData),
      createVector('count', 'Number', countData),
      createVector('percent', 'Number', percentData),
    ];
    return createDataframe('characteristics', vectors, lodash.range(characteristicData.length), null, {
      description: `Characteristics for column \'${column.label}\' in frame \'${frameKey}\'.`,
      origin: `getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`,
      plot: `plot inspect \'characteristics\', getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`,
    });
  };
  const inspectSummary = () => {
    const defaultPercentiles = frame.default_percentiles;
    const percentiles = column.percentiles;
    const mean = column.mean;
    const q1 = percentiles[defaultPercentiles.indexOf(0.25)];
    const q2 = percentiles[defaultPercentiles.indexOf(0.5)];
    const q3 = percentiles[defaultPercentiles.indexOf(0.75)];
    const outliers = lodash.unique(column.mins.concat(column.maxs));
    const minimum = lodash.head(column.mins);
    const maximum = lodash.head(column.maxs);
    const vectors = [
      createFactor('column', 'String', [columnName]),
      createVector('mean', 'Number', [mean]),
      createVector('q1', 'Number', [q1]),
      createVector('q2', 'Number', [q2]),
      createVector('q3', 'Number', [q3]),
      createVector('min', 'Number', [minimum]),
      createVector('max', 'Number', [maximum]),
    ];
    return createDataframe('summary', vectors, lodash.range(1), null, {
      description: `Summary for column \'${column.label}\' in frame \'${frameKey}\'.`,
      origin: `getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`,
      plot: `plot inspect \'summary\', getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`,
    });
  };
  const inspectDomain = () => {
    let i;
    let level;
    let _i;
    let _len;
    const levels = lodash.map(column.histogram_bins, (count, index) => ({
      count,
      index,
    }));
    const sortedLevels = lodash.sortBy(levels, level => -level.count);
    const _ref1 = createArrays(3, sortedLevels.length);
    const labels = _ref1[0];
    const counts = _ref1[1];
    const percents = _ref1[2];
    for (i = _i = 0, _len = sortedLevels.length; _i < _len; i = ++_i) {
      level = sortedLevels[i];
      labels[i] = column.domain[level.index];
      counts[i] = level.count;
      percents[i] = 100 * level.count / rowCount;
    }
    const vectors = [
      createFactor('label', 'String', labels),
      createVector('count', 'Number', counts),
      createVector('percent', 'Number', percents),
    ];
    return createDataframe('domain', vectors, lodash.range(sortedLevels.length), null, {
      description: `Domain for column \'${column.label}\' in frame \'${frameKey}\'.`,
      origin: `getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`,
      plot: `plot inspect \'domain\', getColumnSummary ${flowPrelude.stringify(frameKey)}, ${flowPrelude.stringify(columnName)}`,
    });
  };
  const inspections = { characteristics: inspectCharacteristics };
  switch (column.type) {
    case 'int':
    case 'real':
      // Skip for columns with all NAs
      if (column.histogram_bins.length) {
        inspections.distribution = inspectDistribution;
      }
      // Skip for columns with all NAs
      if (!lodash.some(column.percentiles, a => a === 'NaN')) {
        inspections.summary = inspectSummary;
        inspections.percentiles = inspectPercentiles;
      }
      break;
    case 'enum':
      inspections.domain = inspectDomain;
      break;
    default:
      // do nothing
  }
  inspect_(frame, inspections);
  return render_(_, frame, h2oColumnSummaryOutput, frameKey, frame, columnName);
}
