export default function getThresholdsAndCriteria(_, table, tableName) {
  let criteria;
  let i;
  let idxVector;
  let metricVector;
  let thresholdVector;
  let thresholds;
  const criterionTable = _.inspect(tableName, _.model);
  if (criterionTable) {
        // Threshold dropdown items
    thresholdVector = table.schema.threshold;
    thresholds = (() => {
      let _i;
      let _ref;
      const _results = [];
      for (i = _i = 0, _ref = thresholdVector.count(); _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
        _results.push({
          index: i,
          value: thresholdVector.at(i),
        });
      }
      return _results;
    })();

        // Threshold criterion dropdown item
    metricVector = criterionTable.schema.metric;
    idxVector = criterionTable.schema.idx;
    criteria = (() => {
      let _i;
      let _ref;
      const _results = [];
      for (i = _i = 0, _ref = metricVector.count(); _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
        _results.push({
          index: idxVector.at(i),
          value: metricVector.valueAt(i),
        });
      }
      return _results;
    })();
    return {
      thresholds,
      criteria,
    };
  }
  return void 0;
}
