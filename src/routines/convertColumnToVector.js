import { parseNumbers } from './parseNumbers';
import { format4f } from './format4f';
import { formatConfusionMatrix } from './formatConfusionMatrix';

export function convertColumnToVector(column, data) {
  const lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
  if (lightning.settings) {
    lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
    lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
  }

  const createVector = lightning.createVector;
  const createFactor = lightning.createFactor;
  const createList = lightning.createList;

  switch (column.type) {
    case 'byte':
    case 'short':
    case 'int':
    case 'integer':
    case 'long':
      return createVector(column.name, 'Number', parseNumbers(data));
    case 'float':
    case 'double':
      return createVector(column.name, 'Number', parseNumbers(data), format4f);
    case 'string':
      return createFactor(column.name, 'String', data);
    case 'matrix':
      return createList(column.name, data, formatConfusionMatrix);
    default:
      return createList(column.name, data);
  }
}
