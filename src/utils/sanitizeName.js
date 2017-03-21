export function sanitizeName(name) {
  return name.replace(/[^a-z0-9_ \(\)-]/gi, '-').trim();
}
