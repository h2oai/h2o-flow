import { uuid } from './utils/uuid';
import showRoomscaleScatterplot from './showRoomscaleScatterplot';

import { requestFrameSummaryWithoutData } from './h2oProxy/requestFrameSummaryWithoutData';

import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export default function roomscaleScatterplotInput(_, _go) {
  const lodash = window._;
  const Flow = window.Flow;

  const _exception = Flow.Dataflow.signal(null);
  const _destinationKey = Flow.Dataflow.signal(`ppd-${uuid()}`);
  const _frames = Flow.Dataflow.signals([]);
  const _models = Flow.Dataflow.signals([]);
  const _selectedModel = Flow.Dataflow.signals(null);
  _.selectedFrame = Flow.Dataflow.signal(null);
  _.selectedXVariable = Flow.Dataflow.signal(null);
  _.selectedYVariable = Flow.Dataflow.signal(null);
  _.selectedZVariable = Flow.Dataflow.signal(null);
  _.selectedColorVariable = Flow.Dataflow.signal(null);
  const _useCustomColumns = Flow.Dataflow.signal(false);
  const _columns = Flow.Dataflow.signal([]);
  const _nbins = Flow.Dataflow.signal(20);

  //  a conditional check that makes sure that
  //  all fields in the form are filled in
  //  before the button is shown as active
  const _canCompute = Flow.Dataflow.lift(_.selectedFrame, (sf) => sf);
  const _compute = () => {
    if (!_canCompute()) {
      return;
    }

    // parameters are selections from Flow UI
    // form dropdown menus, text boxes, etc
    let col;
    let cols;
    let i;
    let len;

    cols = '';

    const ref = _columns();
    for (i = 0, len = ref.length; i < len; i++) {
      col = ref[i];
      // if (col.isSelected()) {
      //   cols = `${cols}"${col.value}",`;
      // }
    }

    if (cols !== '') {
      cols = `[${cols}]`;
    }

    const opts = {
      // destination_key: _destinationKey(),
      frameID: _.selectedFrame(),
      xVariable: _.selectedXVariable(),
      yVariable: _.selectedYVariable(),
      zVariable: _.selectedZVariable(),
      colorVariable: _.selectedColorVariable(),
    };

    // assemble a string
    // this contains the function to call
    // along with the options to pass in
    const cs = `showRoomscaleScatterplot ${flowPrelude.stringify(opts)}`;

    // insert a cell with the expression `cs`
    // into the current Flow notebook
    // and run the cell
    return _.insertAndExecuteCell('cs', cs);
  };

  _.requestFrames(_, (error, frames) => {
    let frame;
    if (error) {
      return _exception(new Flow.Error('Error fetching frame list.', error));
    }
    return _frames((() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = frames.length; _i < _len; _i++) {
        frame = frames[_i];
        if (!frame.is_text) {
          _results.push(frame.frame_id.name);
        }
      }
      return _results;
    })());
  });

  const _updateColumns = () => {
    const frameKey = _.selectedFrame();
    if (frameKey) {
      return requestFrameSummaryWithoutData(_, frameKey, (error, frame) => {
        let columnLabels;
        let columnValues;
        if (!error) {
          columnValues = frame.columns.map(column => column.label);
          columnLabels = frame.columns.map(column => {
            const missingPercent = 100 * column.missing_count / frame.rows;
            console.log('column from _updateColumns', column);
            return {
              type: column.type === 'enum' ? `enum(${column.domain_cardinality})` : column.type,
              value: column.label,
              missingPercent,
              missingLabel: missingPercent === 0 ? '' : `${Math.round(missingPercent)}% NA`,
            };
          });
          console.log('columnLabels from _updateColumns', columnLabels);
          _columns(columnLabels.map(d => d.value));
        }
      });
    }
  };

  lodash.defer(_go);
  return {
    exception: _exception,
    destinationKey: _destinationKey,
    frames: _frames,
    columns: _columns,
    updateColumns: _updateColumns,
    selectedFrame: _.selectedFrame,
    selectedXVariable: _.selectedXVariable,
    selectedYVariable: _.selectedYVariable,
    selectedZVariable: _.selectedZVariable,
    selectedColorVariable: _.selectedColorVariable,
    nbins: _nbins,
    compute: _compute,
    canCompute: _canCompute,
    template: 'flow-roomscale-scatterplot-input',
  };
}
