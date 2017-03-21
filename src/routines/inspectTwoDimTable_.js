import { convertTableToFrame } from './convertTableToFrame';

export function inspectTwoDimTable_(origin, tableName, table) {
  return function () {
    return convertTableToFrame(table, tableName, {
      description: table.description || '',
      origin,
    });
  };
}
