export function getJobProgressPercent(progress) {
  return `${Math.ceil(100 * progress)}%`;
}
