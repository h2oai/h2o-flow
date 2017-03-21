import { requestPojoPreview } from '../h2oProxy/requestPojoPreview';
import { highlight } from '../utils/highlight';

export default function previewPojo(_) {
  const lodash = window._;
  return requestPojoPreview(_.model.model_id.name, (error, result) => {
    if (error) {
      return _.pojoPreview(`<pre>${lodash.escape(error)}</pre>`);
    }
    return _.pojoPreview(`<pre>${highlight(result, 'java')}</pre>`);
  });
}
