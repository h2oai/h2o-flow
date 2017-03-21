import { _schemaHacks } from './_schemaHacks';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function blacklistedAttributesBySchema() {
  let attrs;
  let dict;
  let field;
  let schema;
  let _i;
  let _len;
  let _ref1;
  const dicts = {};
  for (schema in _schemaHacks) {
    if ({}.hasOwnProperty.call(_schemaHacks, schema)) {
      console.log('schema from blacklistedAttributesBySchema', schema);
      attrs = _schemaHacks[schema];
      dicts[schema] = dict = { __meta: true };
      if (attrs.fields) {
        _ref1 = flowPrelude.words(attrs.fields);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          field = _ref1[_i];
          dict[field] = true;
        }
      }
    }
  }
  return dicts;
}
