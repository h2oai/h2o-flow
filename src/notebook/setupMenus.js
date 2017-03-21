import { requestModelBuilders } from '../h2oProxy/requestModelBuilders';
import initializeMenus from './initializeMenus';

export default function setupMenus(_, menuCell) {
  return requestModelBuilders(_, (error, builders) => _.menus(initializeMenus(
      _,
      menuCell,
      error ? [] : builders
    )));
}
