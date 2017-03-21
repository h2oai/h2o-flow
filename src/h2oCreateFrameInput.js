import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oCreateFrameInput(_, _go) {
  const lodash = window._;
  const Flow = window.Flow;
  const _key = Flow.Dataflow.signal('');
  const _rows = Flow.Dataflow.signal(10000);
  const _columns = Flow.Dataflow.signal(100);
  const _seed = Flow.Dataflow.signal(7595850248774472000);
  const _seedForColumnTypes = Flow.Dataflow.signal(-1);
  const _randomize = Flow.Dataflow.signal(true);
  const _value = Flow.Dataflow.signal(0);
  const _realRange = Flow.Dataflow.signal(100);
  const _categoricalFraction = Flow.Dataflow.signal(0.1);
  const _factors = Flow.Dataflow.signal(5);
  const _integerFraction = Flow.Dataflow.signal(0.5);
  const _binaryFraction = Flow.Dataflow.signal(0.1);
  const _binaryOnesFraction = Flow.Dataflow.signal(0.02);
  const _timeFraction = Flow.Dataflow.signal(0);
  const _stringFraction = Flow.Dataflow.signal(0);
  const _integerRange = Flow.Dataflow.signal(1);
  const _missingFraction = Flow.Dataflow.signal(0.01);
  const _responseFactors = Flow.Dataflow.signal(2);
  const _hasResponse = Flow.Dataflow.signal(false);
  const createFrame = () => {
    const opts = {
      dest: _key(),
      rows: _rows(),
      cols: _columns(),
      seed: _seed(),
      seed_for_column_types: _seedForColumnTypes(),
      randomize: _randomize(),
      value: _value(),
      real_range: _realRange(),
      categorical_fraction: _categoricalFraction(),
      factors: _factors(),
      integer_fraction: _integerFraction(),
      binary_fraction: _binaryFraction(),
      binary_ones_fraction: _binaryOnesFraction(),
      time_fraction: _timeFraction(),
      string_fraction: _stringFraction(),
      integer_range: _integerRange(),
      missing_fraction: _missingFraction(),
      response_factors: _responseFactors(),
      has_response: _hasResponse(),
    };
    return _.insertAndExecuteCell('cs', `createFrame ${flowPrelude.stringify(opts)}`);
  };
  lodash.defer(_go);
  return {
    key: _key,
    rows: _rows,
    columns: _columns,
    seed: _seed,
    seed_for_column_types: _seedForColumnTypes,
    randomize: _randomize,
    value: _value,
    realRange: _realRange,
    categoricalFraction: _categoricalFraction,
    factors: _factors,
    integerFraction: _integerFraction,
    binaryFraction: _binaryFraction,
    binaryOnesFraction: _binaryOnesFraction,
    timeFraction: _timeFraction,
    stringFraction: _stringFraction,
    integerRange: _integerRange,
    missingFraction: _missingFraction,
    responseFactors: _responseFactors,
    hasResponse: _hasResponse,
    createFrame,
    template: 'flow-create-frame-input',
  };
}

