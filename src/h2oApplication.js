import { h2oApplicationContext } from './h2oApplicationContext';
import { h2oProxy } from './h2oProxy/h2oProxy';

export function h2oApplication(_) {
  h2oApplicationContext(_);
  return h2oProxy(_);
}
