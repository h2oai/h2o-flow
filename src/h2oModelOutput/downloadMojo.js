export default function downloadMojo(_) {
  return window.open(`/3/Models/${encodeURIComponent(_.model.model_id.name)}/mojo`, '_blank');
}
