export default function printErrors(errors, prefix) {
  let error;
  if (prefix == null) {
    prefix = '';
  }
  if (errors) {
    if (Array.isArray(errors)) {
      return (((() => {
        let _j;
        let _len1;
        const _results = [];
        for (_j = 0, _len1 = errors.length; _j < _len1; _j++) {
          error = errors[_j];
          _results.push(printErrors(error, `${prefix}  `));
        }
        return _results;
      }))()).join('\n');
    } else if (errors.message) {
      if (errors.cause) {
        return `${errors.message}\n${printErrors(errors.cause, prefix + '  ')}`; // eslint-disable-line prefer-template
      }
      return errors.message;
    }
    return errors;
  }
  return errors;
}
