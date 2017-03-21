export function getModelParameterValue(type, value) {
  switch (type) {
    case 'Key<Frame>':
    case 'Key<Model>':
      if (value != null) {
        return value.name;
      }
      return void 0;
      // break; // no-unreachable
    case 'VecSpecifier':
      if (value != null) {
        return value.column_name;
      }
      return void 0;
      // break; // no-unreachable
    default:
      if (value != null) {
        return value;
      }
      return void 0;
  }
}
