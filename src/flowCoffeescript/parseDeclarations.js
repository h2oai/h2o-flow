import { identifyDeclarations } from './identifyDeclarations';

export function parseDeclarations(block) {
  const lodash = window._;
  let declaration;
  let declarations;
  let node;
  let _i;
  let _j;
  let _len;
  let _len1;
  const identifiers = [];
  const _ref = block.body;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    declarations = identifyDeclarations(node);
    if (declarations) {
      for (_j = 0, _len1 = declarations.length; _j < _len1; _j++) {
        declaration = declarations[_j];
        identifiers.push(declaration);
      }
    }
  }
  return lodash.indexBy(identifiers, identifier => identifier.name);
}
