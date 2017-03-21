import { render_ } from './render_';
import { flowForm } from '../flowForm';

export function extendGuiForm(_, form) {
  return render_(_, form, flowForm, form);
}
