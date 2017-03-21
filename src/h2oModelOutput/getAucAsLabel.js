export default function getAucAsLabel(_, model, tableName) {
  const metrics = _.inspect(tableName, model);
  if (metrics) {
    return ` , AUC = ${metrics.schema.AUC.at(0)}`;
  }
  return '';
}
