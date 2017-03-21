import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function renderGrid(_, render) {
  const $ = window.jQuery;
  return render((error, vis) => {
    if (error) {
      return console.debug(error);
    }
    $('a', vis.element).on('click', e => {
      const $a = $(e.target);
      switch ($a.attr('data-type')) {
        case 'summary-link':
          return _.insertAndExecuteCell('cs', `getColumnSummary ${flowPrelude.stringify(_.frame.frame_id.name)}, ${flowPrelude.stringify($a.attr('data-key'))}`);
        case 'as-factor-link':
          return _.insertAndExecuteCell('cs', `changeColumnType frame: ${flowPrelude.stringify(_.frame.frame_id.name)}, column: ${flowPrelude.stringify($a.attr('data-key'))}, type: \'enum\'`);
        case 'as-numeric-link':
          return _.insertAndExecuteCell('cs', `changeColumnType frame: ${flowPrelude.stringify(_.frame.frame_id.name)}, column: ${flowPrelude.stringify($a.attr('data-key'))}, type: \'int\'`);
        default:
          // do nothing
      }
    });
    return _.grid(vis.element);
  });
}
