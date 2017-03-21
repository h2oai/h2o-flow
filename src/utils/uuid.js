export function uuid() {
  if (typeof window !== 'undefined' && window !== null) {
    return window.uuid();
  }
  return null;
}
