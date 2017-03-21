import { convertTableToFrame } from './convertTableToFrame';

export function inspectNetworkTestResult(testResult) {
  return function () {
    return convertTableToFrame(testResult.table, testResult.table.name, {
      description: testResult.table.name,
      origin: 'testNetwork',
    });
  };
}
