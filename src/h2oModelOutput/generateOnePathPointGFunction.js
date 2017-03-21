export default function generateOnePathPointGFunction(a, table) {
  const positionKeyA = a[0];
  const positionValueA = a[1];
  const strokeColorValueA = a[2];
  return g => g(
    g.path(
      g.position(positionKeyA, positionValueA),
      g.strokeColor(
        g.value(strokeColorValueA)
      )
    ),
    g.point(
      g.position(positionKeyA, positionValueA),
      g.strokeColor(
        g.value(strokeColorValueA)
      )
    ),
    g.from(table)
  );
}
