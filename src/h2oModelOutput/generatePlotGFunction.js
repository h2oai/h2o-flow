/* eslint-disable */
export default function generatePlotGFunction(...args) {
  const table = args[0];
  const plotOptions = args.slice(1);
  const gArguments = [];
  plotOptions.forEach(d => {
    const positionKey = d[0];
    const positionValue = d[1];
    const strokeColorValue = d[2];
    // add a path g
    gArguments.push(
      g.path(
        g.position(positionKey, positionValue),
        g.strokeColor(g.value(strokeColorValue))
      )
    );
    // add a point g
    gArguments.push(
      g.point(
        g.position(positionKey, positionValue),
        g.strokeColor(g.value(strokeColorValue))
      )
    );
  });
  gArguments.push(g.from(table));
  return g => g(...gArguments);
}
