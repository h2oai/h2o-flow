import { postModelInputValidationRequest } from '../../h2oProxy/postModelInputValidationRequest';

export function performValidations(
  _,
  checkForErrors,
  go,
  _exception,
  collectParameters,
  _controlGroups,
  control,
  _gridId,
  _gridStrategy,
  _gridMaxModels,
  _gridMaxRuntime,
  _gridStoppingRounds,
  _gridStoppingTolerance,
  _gridStoppingMetric,
  _validationFailureMessage,
  _algorithm
) {
  const lodash = window._;
  const Flow = window.Flow;
  _exception(null);
  const parameters = collectParameters(
      true,
      _controlGroups,
      control,
      _gridId,
      _gridStrategy,
      _gridMaxModels,
      _gridMaxRuntime,
      _gridStoppingRounds,
      _gridStoppingTolerance,
      _gridStoppingMetric
    );
  if (parameters.hyper_parameters) {
        // parameter validation fails with hyper_parameters, so skip.
    return go();
  }
  _validationFailureMessage('');
  return postModelInputValidationRequest(_, _algorithm, parameters, (error, modelBuilder) => {
    let controls;
    let hasErrors;
    let validation;
    let validations;
    let validationsByControlName;
    let _l;
    let _len3;
    let _len4;
    let _len5;
    let _m;
    let _n;
    if (error) {
      return _exception(Flow.failure(_, new Flow.Error('Error fetching initial model builder state', error)));
    }
    hasErrors = false;
    if (modelBuilder.messages.length) {
      validationsByControlName = lodash.groupBy(modelBuilder.messages, validation => validation.field_name);
      for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
        controls = _controlGroups[_l];
        for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
          control = controls[_m];
          validations = validationsByControlName[control.name];
          if (validations) {
            for (_n = 0, _len5 = validations.length; _n < _len5; _n++) {
              validation = validations[_n];
              if (validation.message_type === 'TRACE') {
                control.isVisible(false);
              } else {
                control.isVisible(true);
                if (checkForErrors) {
                  switch (validation.message_type) {
                    case 'INFO':
                      control.hasInfo(true);
                      control.message(validation.message);
                      break;
                    case 'WARN':
                      control.hasWarning(true);
                      control.message(validation.message);
                      break;
                    case 'ERRR':
                      control.hasError(true);
                      control.message(validation.message);
                      hasErrors = true;
                      break;
                    default:
                          // do nothing
                  }
                }
              }
            }
          } else {
            control.isVisible(true);
            control.hasInfo(false);
            control.hasWarning(false);
            control.hasError(false);
            control.message('');
          }
        }
      }
    }
    if (hasErrors) {
          // Do not pass go(). Do not collect $200.
      return _validationFailureMessage('Your model parameters have one or more errors. Please fix them and try again.');
    }
        // Proceed with form submission
    _validationFailureMessage('');
    return go();
  });
}
