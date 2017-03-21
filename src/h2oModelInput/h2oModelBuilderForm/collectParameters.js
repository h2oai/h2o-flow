export function collectParameters(
  includeUnchangedParameters,
  _controlGroups,
  control,
  _gridId,
  _gridStrategy,
  _gridMaxModels,
  _gridMaxRuntime,
  _gridStoppingRounds,
  _gridStoppingTolerance,
  _gridStoppingMetric
) {
  const lodash = window._;
  let controls;
  let entry;
  let gridStoppingRounds;
  let isGrided;
  let item;
  let maxModels;
  let maxRuntime;
  let searchCriteria;
  let selectedValues;
  let stoppingTolerance;
  let value;
  let _l;
  let _len3;
  let _len4;
  let _len5;
  let _m;
  let _n;
  let _ref;
  if (includeUnchangedParameters == null) {
    includeUnchangedParameters = false;
  }
  isGrided = false;
  const parameters = {};
  const hyperParameters = {};
  for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
    controls = _controlGroups[_l];
    for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
      control = controls[_m];
      if (control.isGrided()) {
        isGrided = true;
        switch (control.kind) {
          case 'textbox':
            hyperParameters[control.name] = control.valueGrided();
            break;
          case 'dropdown':
            hyperParameters[control.name] = selectedValues = [];
            _ref = control.gridedValues();
            for (_n = 0, _len5 = _ref.length; _n < _len5; _n++) {
              item = _ref[_n];
              if (item.value()) {
                selectedValues.push(item.label);
              }
            }
            break;
          default:
                // checkbox
            hyperParameters[control.name] = [
              true,
              false,
            ];
        }
      } else {
        value = control.value();
        if (control.isVisible() && (includeUnchangedParameters || control.isRequired || control.defaultValue !== value)) {
          switch (control.kind) {
            case 'dropdown':
              if (value) {
                parameters[control.name] = value;
              }
              break;
            case 'list':
              if (value.length) {
                selectedValues = (() => {
                  let _len6;
                  let _o;
                  const _results = [];
                  for (_o = 0, _len6 = value.length; _o < _len6; _o++) {
                    entry = value[_o];
                    if (entry.isSelected()) {
                      _results.push(entry.value);
                    }
                  }
                  return _results;
                })();
                parameters[control.name] = selectedValues;
              }
              break;
            default:
              parameters[control.name] = value;
          }
        }
      }
    }
  }
  if (isGrided) {
    parameters.grid_id = _gridId();
    parameters.hyper_parameters = hyperParameters;
        // { 'strategy': "RandomDiscrete/Cartesian", 'max_models': 3, 'max_runtime_secs': 20 }
    searchCriteria = { strategy: _gridStrategy() };
    switch (searchCriteria.strategy) {
      case 'RandomDiscrete':
        maxModels = parseInt(_gridMaxModels(), 10);
        if (!lodash.isNaN(maxModels)) {
          searchCriteria.max_models = maxModels;
        }
        maxRuntime = parseInt(_gridMaxRuntime(), 10);
        if (!lodash.isNaN(maxRuntime)) {
          searchCriteria.max_runtime_secs = maxRuntime;
        }
        gridStoppingRounds = parseInt(_gridStoppingRounds(), 10);
        if (!lodash.isNaN(gridStoppingRounds)) {
          searchCriteria.stopping_rounds = gridStoppingRounds;
        }
        stoppingTolerance = parseFloat(_gridStoppingTolerance());
        if (!lodash.isNaN(stoppingTolerance)) {
          searchCriteria.stopping_tolerance = stoppingTolerance;
        }
        searchCriteria.stopping_metric = _gridStoppingMetric();
        break;
      default:
            // do nothing
    }
    parameters.search_criteria = searchCriteria;
  }
  return parameters;
}
