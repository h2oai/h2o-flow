import { createLocalScope } from './createLocalScope';
import { coalesceScopes } from './coalesceScopes';

export function traverseJavascriptScoped(scopes, parentScope, parent, key, node, f) {
  const lodash = window._;
  let child;
  let currentScope;
  const isNewScope = node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
  if (isNewScope) {
      // create and push a new local scope onto scope stack
    scopes.push(createLocalScope(node));
    currentScope = coalesceScopes(scopes);
  } else {
    currentScope = parentScope;
  }
  for (key in node) {
    if ({}.hasOwnProperty.call(node, key)) {
      child = node[key];
      if (lodash.isObject(child)) {
        traverseJavascriptScoped(scopes, currentScope, node, key, child, f);
        f(currentScope, node, key, child);
      }
    }
  }
  if (isNewScope) {
      // discard local scope
    scopes.pop();
  }
}
