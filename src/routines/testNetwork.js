import { _fork } from './_fork';
import { requestNetworkTest } from './requestNetworkTest';

export function testNetwork(_) {
  console.log('arguments from testNetwork', arguments);
  return _fork(requestNetworkTest, _);
}
