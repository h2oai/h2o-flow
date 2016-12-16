var presentationStepper = function(arrayOfFunctions, startAt) {
	var current = (startAt) ? startAt : 0;
	var steps = arrayOfFunctions;

	var stepper = function() {}

	stepper.goToStep = function(step) {
		current = step;
		steps[step]();
	}

	stepper.stepForward = function() {
		if (current < steps.length - 1) {
			step = current + 1;

			stepper.goToStep(step);
		}
	}

	stepper.stepBackward = function() {
		if (current > 0) {
			step = current - 1;

			stepper.goToStep(step);
		}
	}

	Mousetrap.bind(['left', 'pageup'], function() {
		stepper.stepBackward();
	});
	Mousetrap.bind(['right', 'space', 'pagedown'], function() {
		stepper.stepForward();
	});

	return stepper;
}