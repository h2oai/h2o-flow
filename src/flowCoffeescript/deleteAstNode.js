export function deleteAstNode(parent, i) {
  const lodash = window._;
  if (lodash.isArray(parent)) {
    return parent.splice(i, 1);
  } else if (lodash.isObject(parent)) {
    return delete parent[i];
  }
}
