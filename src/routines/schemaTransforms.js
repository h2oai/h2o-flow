import { _schemaHacks } from './_schemaHacks';

export function schemaTransforms() {
  let attrs;
  let schema;
  let transform;
  const transforms = {};
  for (schema in _schemaHacks) {
    if ({}.hasOwnProperty.call(_schemaHacks, schema)) {
      attrs = _schemaHacks[schema];
      transform = attrs.transform;
      if (transform) {
        transforms[schema] = transform;
      }
    }
  }
  return transforms;
}
