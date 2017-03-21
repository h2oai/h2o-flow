export function validateFileExtension(filename, extension) {
  return filename.indexOf(extension, filename.length - extension.length) !== -1;
}
