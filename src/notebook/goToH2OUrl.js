export default function goToH2OUrl(url) {
  return () => window.open(window.Flow.ContextPath + url, '_blank');
}
