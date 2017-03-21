export function describeCount(count, singular, plural) {
  if (!plural) {
    plural = `${singular}s`;
  }
  switch (count) {
    case 0:
      return `No ${plural}`;
    case 1:
      return `1 ${singular}`;
    default:
      return `${count} ${plural}`;
  }
}
