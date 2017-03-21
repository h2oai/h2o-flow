export default function download(_) {
  return window.open(`${window.Flow.ContextPath}${(`3/DownloadDataset?frame_id=${encodeURIComponent(_.frame.frame_id.name)}`)}`, '_blank');
}
