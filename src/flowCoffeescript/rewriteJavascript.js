import { createGlobalScope } from './createGlobalScope';
import { traverseJavascriptScoped } from './traverseJavascriptScoped';

export function rewriteJavascript(sandbox) {
  const Flow = window.Flow;
  return (rootScope, program, go) => {
    let error;
    const globalScope = createGlobalScope(rootScope, sandbox.routines);
    try {
      traverseJavascriptScoped([globalScope], globalScope, null, null, program, (globalScope, parent, key, node) => {
        let identifier;
        if (node.type === 'Identifier') {
          // ignore var declarations
          if (parent.type === 'VariableDeclarator' && key === 'id') {
            return;
          }
          // ignore members
          if (key === 'property') {
            return;
          }
          identifier = globalScope[node.name];
          if (!identifier) {
            return;
          }

          // qualify identifier with '_h2o_context_'
          parent[key] = {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'Identifier',
              name: identifier.object,
            },
            property: {
              type: 'Identifier',
              name: identifier.name,
            },
          };
          return parent[key];
        }
      });
      return go(null, program);
    } catch (_error) {
      error = _error;
      return go(new Flow.Error('Error rewriting javascript', error));
    }
  };
}
