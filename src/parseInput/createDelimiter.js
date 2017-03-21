export function createDelimiter(caption, charCode) {
  return {
    charCode,
    caption: `${caption}: \'${(`00${charCode}`).slice(-2)}\'`,
  };
}
