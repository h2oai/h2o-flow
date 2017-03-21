export default function goToUrl(url) {
  return () => window.open(url, '_blank');
}
