export default function downloadPojo(_) {
  return window.open(`/3/Models.java/${encodeURIComponent(_.model.model_id.name)}`, '_blank');
}
