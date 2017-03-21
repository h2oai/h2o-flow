export function unwrap(go, transform) {
  return (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, transform(result));
  };
}
