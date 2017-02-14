export default function doFlow(flowName, excludeFlowsNames) {
  let f;
  let _j;
  let _len1;
  for (_j = 0, _len1 = excludeFlowsNames.length; _j < _len1; _j++) {
    f = excludeFlowsNames[_j];
    if (flowName === f) {
      return false;
    }
  }
  return true;
}
