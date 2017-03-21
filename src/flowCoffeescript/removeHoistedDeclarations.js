import { traverseJavascript } from './traverseJavascript';
import { deleteAstNode } from './deleteAstNode';

// TODO DO NOT call this for raw javascript:
// Require alternate strategy:
//  Declarations with 'var' need to be local to the cell.
//  Undeclared identifiers are assumed to be global.
//  'use strict' should be unsupported.
export function removeHoistedDeclarations(rootScope, program, go) {
  const Flow = window.Flow;
  let error;
  try {
    traverseJavascript(null, null, program, (parent, key, node) => {
      let declarations;
      if (node.type === 'VariableDeclaration') {
        declarations = node.declarations.filter(declaration => declaration.type === 'VariableDeclarator' && declaration.id.type === 'Identifier' && !rootScope[declaration.id.name]);
        if (declarations.length === 0) {
            // purge this node so that escodegen doesn't fail
          return deleteAstNode(parent, key);
        }
          // replace with cleaned-up declarations
        node.declarations = declarations;
        return node.declarations;
      }
    });
    return go(null, rootScope, program);
  } catch (_error) {
    error = _error;
    return go(new Flow.Error('Error rewriting javascript', error));
  }
}
