export default function generateTwoPathPointGFunction(a, b, table) {
  const positionKeyA = a[0];
  const positionValueA = a[1];
  const strokeColorValueA = a[2];
  const positionKeyB = b[0];
  const positionValueB = b[1];
  const strokeColorValueB = b[2];
  return g => g(
    g.path(
      g.position(positionKeyA, positionValueA),
      g.strokeColor(
        g.value(strokeColorValueA)
      )
    ),
    g.path(
      g.position(positionKeyB, positionValueB),
      g.strokeColor(
        g.value(strokeColorValueB)
      )
    ),
    g.point(
      g.position(positionKeyA, positionValueA),
      g.strokeColor(
        g.value(strokeColorValueA)
      )
    ),
    g.point(
      g.position(positionKeyB, positionValueB),
      g.strokeColor(
        g.value(strokeColorValueB)
      )
    ),
    g.from(table)
  );
}
