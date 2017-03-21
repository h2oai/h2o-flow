import { parseDeclarations } from './parseDeclarations';

export function createLocalScope(node) {
  let param;
  let _i;
  let _len;
    // parse all declarations in this scope
  const localScope = parseDeclarations(node.body);

    // include formal parameters
  const _ref = node.params;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    param = _ref[_i];
    if (param.type === 'Identifier') {
      localScope[param.name] = {
        name: param.name,
        object: 'local',
      };
    }
  }
  return localScope;
}
