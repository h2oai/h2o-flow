import { doGet } from './doGet';

export function getRDDsRequest(_, go) {
  return doGet(_, '/3/RDDs', go);
}
