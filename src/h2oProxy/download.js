export function download(type, url, go) {
  const Flow = window.Flow;
  const $ = window.jQuery;
  if (url.substring(0, 1) === '/') {
    url = window.Flow.ContextPath + url.substring(1);
  }
  return $.ajax({
    dataType: type,
    url,
    success(data, status, xhr) {
      return go(null, data);
    },
    error(xhr, status, error) {
      return go(new Flow.Error(error));
    },
  });
}
