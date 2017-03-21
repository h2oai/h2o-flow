import { uuid } from '../utils/uuid';

export function createTempKey() {
  const Flow = window.Flow;
  return `flow_${uuid().replace(/\-/g, '')}`;
}
