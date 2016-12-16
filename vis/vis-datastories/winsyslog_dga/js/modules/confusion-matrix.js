var confusionMatrix = (function() {
	var WIDTH = 620;
	var HEIGHT = 620;
	var GUTTER = 20;

	var MAX_BAR_HEIGHT = 600;
	var BAR_WIDTH = 120;

	var currentStep = 0;
	var layer, data, maxAmount, scale;
	var featuresLayer, shapesLayer, labelsLayer;

	var tpFill = d3.hsl(140, 0.8, 0.15).toString();
	var tnFill = d3.hsl(140, 0.55, 0.35).toString();
	var fpFill = d3.hsl(1, 0.8, 0.2).toString();
	var fnFill = d3.hsl(1, 0.55, 0.4).toString();

	var numberFormat = d3.format(',');
	var percentFormat = d3.format('.2f');
	var signedPercentFormat = d3.format('+.3f');

	var matrix = function(l) {
		layer = l;
		data = layer.datum();

		var maxAmount = d3.max(data.rows, function(d) {
			return d3.max(['tp', 'tn', 'fp', 'fn'], function(q) {
				return d[q];
			});
		});

		scale = d3.scale.linear()
			.domain([0, maxAmount])
			// .range([0, Math.pow(maxSide, 2)]);
			.range([0, MAX_BAR_HEIGHT]);

		shapesLayer = layer.append('g').attr('class', 'shapesLayer')
			.attr('transform', 'translate(720, 140)');

		labelsLayer = layer.append('g').attr('class', 'labelsLayer')
			.attr('transform', 'translate(720, 140)');

		featuresLayer = layer.append('g').attr('class', 'featuresLayer')
			.attr('transform', 'translate(100, 100)');

		draw();
	}

	var draw = function() {
		var row = data.rows[currentStep];

		// Features
		var features = featuresLayer.selectAll('text.feature').data(data.rows[currentStep].features, function(d) {
			return d;
		});

		features.exit()
			.transition()
			.attr('y', HEIGHT * 2)
			.remove();

		features.enter()
			.append('text')
				.attr('y', HEIGHT * 2)
				.attr('class', 'feature')
				.attr('font-size', 36)
				.attr('fill', '#fff')
				.text(function(d) {
					return d
				});

		features
			.transition()			
			.attr('y', function(d, i) {
				return 250 + HEIGHT / 6 * i;
			});

		// True Negative
		var trueNegative = shapesLayer.select('rect.tn');
		if (trueNegative.empty()) {
			trueNegative = shapesLayer.append('rect')
				.attr('class', 'tn')
				.attr('fill', tnFill)
		}

		// var tnArea = scale(data.rows[currentStep].tn);
		// var tnLength = Math.sqrt(tnArea);
		var tnLength = scale(data.rows[currentStep].tn);

		trueNegative
			.transition()
			.attr('x', 0)
			.attr('y', MAX_BAR_HEIGHT - tnLength)
			.attr('width', BAR_WIDTH)
			.attr('height', tnLength);

		var tnLabel = labelsLayer.select('text.tn');
		if (tnLabel.empty()) {
			tnLabel = labelsLayer.append('text')
				.attr('class', 'tn label')
				.attr('fill', '#fff')
				.attr('text-anchor', 'end')
				.attr('x', -10)
				.attr('y', MAX_BAR_HEIGHT)
		}

		var tnCount = labelsLayer.select('text.tnCount');
		if (tnCount.empty()) {
			tnCount = labelsLayer.append('text')
				.attr('class', 'tnCount')
				.attr('fill', '#fff')
				.attr('text-anchor', 'middle')
				.attr('x', BAR_WIDTH / 2);
		}

		// tnLabel.text(numberFormat(data.rows[currentStep].tn));
		tnLabel.text('TN');
		tnCount
			.transition()
			.attr('y', MAX_BAR_HEIGHT - tnLength - 3)
			.text(data.rows[currentStep].tn);


		// True Positive
		var truePositive = shapesLayer.select('rect.tp');
		if (truePositive.empty()) {
			truePositive = shapesLayer.append('rect')
				.attr('class', 'tp')
				.attr('fill', tpFill)
		}

		// var tpArea = scale(data.rows[currentStep].tp);
		// var tpLength = Math.sqrt(tpArea);
		var tpLength = scale(data.rows[currentStep].tp);

		truePositive
			.transition()
			.attr('x', BAR_WIDTH + 20)
			.attr('y', MAX_BAR_HEIGHT - tpLength)
			.attr('width', BAR_WIDTH)
			.attr('height', tpLength);

		var tpLabel = labelsLayer.select('text.tp');
		if (tpLabel.empty()) {
			tpLabel = labelsLayer.append('text')
				.attr('class', 'tp label')
				.attr('fill', '#fff')
				.attr('x', BAR_WIDTH + 20 + BAR_WIDTH + 10)
				.attr('y', MAX_BAR_HEIGHT)
		}

		var tpCount = labelsLayer.select('text.tpCount');
		if (tpCount.empty()) {
			tpCount = labelsLayer.append('text')
				.attr('class', 'tpCount')
				.attr('fill', '#fff')
				.attr('text-anchor', 'middle')
				.attr('x', BAR_WIDTH + 20 + BAR_WIDTH / 2)
		}


		// tpLabel.text(numberFormat(data.rows[currentStep].tp));
		tpLabel.text('TP');
		tpCount
			.transition()
			.attr('y', MAX_BAR_HEIGHT - tpLength - 3)
			.text(data.rows[currentStep].tp);

		// False Negative
		var falseNegative = shapesLayer.select('rect.fn');
		if (falseNegative.empty()) {
			falseNegative = shapesLayer.append('rect')
				.attr('class', 'fn')
				.attr('fill', fnFill)
		}

		// Incorrect
		var incorrectLeftOffset = 360;

		// var fnArea = scale(data.rows[currentStep].fn);
		// var fnLength = Math.sqrt(fnArea);
		var fnLength = scale(data.rows[currentStep].fn);

		falseNegative
			.transition()
			.attr('x', incorrectLeftOffset)
			.attr('y', MAX_BAR_HEIGHT - fnLength)
			.attr('width', BAR_WIDTH)
			.attr('height', fnLength);

		var fnLabel = labelsLayer.select('text.fn');
		if (fnLabel.empty()) {
			fnLabel = labelsLayer.append('text')
				.attr('class', 'fn label')
				.attr('fill', '#fff')
				.attr('text-anchor', 'end')
				.attr('x', incorrectLeftOffset - 10)
				.attr('y', MAX_BAR_HEIGHT)
		}

		var fnCount = labelsLayer.select('text.fnCount');
		if (fnCount.empty()) {
			fnCount = labelsLayer.append('text')
				.attr('class', 'fnCount')
				.attr('fill', '#fff')
				.attr('text-anchor', 'middle')
				.attr('x', incorrectLeftOffset + BAR_WIDTH / 2)
		}

		// fnLabel.text(numberFormat(data.rows[currentStep].fn));
		fnLabel.text('FN');
		fnCount
			.transition()
			.attr('y', MAX_BAR_HEIGHT - fnLength - 3)
			.text(data.rows[currentStep].fn);


		// False Positive
		var falsePositive = shapesLayer.select('rect.fp');
		if (falsePositive.empty()) {
			falsePositive = shapesLayer.append('rect')
				.attr('class', 'fp')
				.attr('fill', fpFill)
		}

		// var fpArea = scale(data.rows[currentStep].fp);
		// var fpLength = Math.sqrt(fpArea);
		var fpLength = scale(data.rows[currentStep].fp);

		falsePositive
			.transition()
			.attr('x', incorrectLeftOffset + BAR_WIDTH + 20)
			.attr('y', MAX_BAR_HEIGHT - fpLength)
			.attr('width', BAR_WIDTH)
			.attr('height', fpLength);

		var fpLabel = labelsLayer.select('text.fp');
		if (fpLabel.empty()) {
			fpLabel = labelsLayer.append('text')
				.attr('class', 'fp label')
				.attr('fill', '#fff')
				.attr('x', incorrectLeftOffset + BAR_WIDTH + 20 + BAR_WIDTH + 10)
				.attr('y', MAX_BAR_HEIGHT)
				
		}

		var fpCount = labelsLayer.select('text.fpCount');
		if (fpCount.empty()) {
			fpCount = labelsLayer.append('text')
				.attr('class', 'fpCount')
				.attr('fill', '#fff')
				.attr('text-anchor', 'middle')
				.attr('x', incorrectLeftOffset + BAR_WIDTH + 20 + BAR_WIDTH / 2)
		}

		// fpLabel.text(numberFormat(data.rows[currentStep].fp));
		fpLabel.text('FP');
		fpCount
			.transition()
			.attr('y', MAX_BAR_HEIGHT - fpLength - 3)
			.text(data.rows[currentStep].fp);


		// All Labels
		labels = labelsLayer.selectAll('text.label')
			.attr('opacity', 0.9)
			.attr('font-size', 16);

		// Overall Metric
		var overallMetric = featuresLayer.select('text.overallMetric');
		if (overallMetric.empty()) {
			overallMetric = featuresLayer.append('text')
				.attr('class', 'overallMetric')
				.attr('x', 0)
				.attr('y', 110)
				.attr('fill', '#fff')
				.attr('font-weight', 'bold')
				.attr('font-size', 96);
		}

		overallMetric
			.text(percentFormat((data.rows[currentStep].tp + data.rows[currentStep].tn) / data.rows[currentStep].total * 100) + '%');

		if (currentStep) {
			var prevAccuracy = (data.rows[currentStep - 1].tp + data.rows[currentStep - 1].tn) / data.rows[currentStep].total;
			var curAccuracy = (data.rows[currentStep].tp + data.rows[currentStep].tn) / data.rows[currentStep].total;
			var delta = (curAccuracy - prevAccuracy) * 100;
		} else {
			var delta = null;
		}

		var accuracyDelta = featuresLayer.select('text.accuracyDelta');
		if (accuracyDelta.empty()) {
			accuracyDelta = featuresLayer.append('text')
				.attr('class', 'accuracyDelta')
				.attr('x', 335)
				.attr('y', 110)
				.attr('font-size', 34);
		}

		if (!delta) {
			accuracyDelta.attr('opacity', 0);
		} else {
			accuracyDelta
				.attr('opacity', 1)
				.attr('fill', function() {
					if (delta > 0) {
						return tnFill;
					} else {
						return fnFill;
					}
				})
				.text(signedPercentFormat(delta) + '%');
		}



	}

	var setRow = function(row) {
		currentStep = row;
		draw();
	}

	matrix.setRow = setRow;

	return matrix;
})