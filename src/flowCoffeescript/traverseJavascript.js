export function traverseJavascript(parent, key, node, f) {
  const lodash = window._;
  let child;
  let i;
  if (lodash.isArray(node)) {
    i = node.length;
    // walk backwards to allow callers to delete nodes
    while (i--) {
      child = node[i];
      if (lodash.isObject(child)) {
        traverseJavascript(node, i, child, f);
        f(node, i, child);
      }
    }
  } else {
    for (i in node) {
      if ({}.hasOwnProperty.call(node, i)) {
        child = node[i];
        if (lodash.isObject(child)) {
          traverseJavascript(node, i, child, f);
          f(node, i, child);
        }
      }
    }
  }
}
