export default function renderTable(indices, subframe, g) {
  const lodash = window._;
  return g(indices.length > 1 ? g.select() : g.select(lodash.head(indices)), g.from(subframe));
}
