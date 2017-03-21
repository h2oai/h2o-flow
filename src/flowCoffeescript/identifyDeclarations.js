export function identifyDeclarations(node) {
  let declaration;
  if (!node) {
    return null;
  }
  switch (node.type) {
    case 'VariableDeclaration':
      return (() => {
        let _i;
        let _len;
        const _ref = node.declarations;
        const _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          declaration = _ref[_i];
          if (declaration.type === 'VariableDeclarator' && declaration.id.type === 'Identifier') {
            _results.push({
              name: declaration.id.name,
              object: '_h2o_context_',
            });
          }
        }
        return _results;
      })();
    case 'FunctionDeclaration':
        //
        // XXX Not sure about the semantics here.
        //
      if (node.id.type === 'Identifier') {
        return [{
          name: node.id.name,
          object: '_h2o_context_',
        }];
      }
      break;
    case 'ForStatement':
      return identifyDeclarations(node.init);
    case 'ForInStatement':
    case 'ForOfStatement':
      return identifyDeclarations(node.left);
    default:
        // do nothing
  }
  return null;
}
