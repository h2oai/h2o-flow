export default function findBuildProperty(caption) {
  const lodash = window._;
  const Flow = window.Flow;
  let entry;
  if (Flow.BuildProperties) {
    entry = lodash.find(Flow.BuildProperties, entry => entry.caption === caption);
    if (entry) {
      return entry.value;
    }
    return void 0;
  }
  return void 0;
}
