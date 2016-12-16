var domainFeaturesPrep = function(results) {
	var attributeKeys = _.keys(results[0]).slice(2);
	var columns = attributeKeys.map(function(c) {
		return {
			key: c,
			values: [],
			min: Infinity,
			max: -Infinity
		}
	});

	results.forEach(function(row) {
		columns.forEach(function(c) {
			c.max = (row[c.key] > c.max) ? row[c.key] : c.max;
			c.min = (row[c.key] < c.min) ? row[c.key] : c.min;
			c.values.push(row[c.key]);
		});
	});

	columns.forEach(function(c) {
		var extent = [c.min, c.max];

		var scale = d3.scale.linear()
			.domain(extent);
		// c.scale = scale;

		var bins = _.chain(c.values)
			.partition(function(d, i) {
				return results[i].isFake;
			}).map(function(values) {
				return d3.layout.histogram()
					.bins(ticks)(values);	
			})
			.value();

		c.maxBinCount = 0;

		c.bins = bins[0].map(function(d, i) {
			c.maxBinCount = (d.length > c.maxBinCount) ? d.length : c.maxBinCount;
			c.maxBinCount = (bins[1][i].length > c.maxBinCount) ? bins[1][i].length : c.maxBinCount;

			return {
				x: d.x,
				y: d.y,
				dx: d.dx,
				isTarget: d.length,
				isNot: bins[1][i].length,
			}
		});

		delete c.values;
	});

	console.log(columns);
	return columns;
}

var attributeValueDistribution = function() {
	var WIDTH = 1440;
	var HEIGHT = 300;
	var GUTTERS = 30;
	var BAR_WIDTH = 12;
	var BAR_GAP = 2;
	var ATTRIBUTE_LABEL = 40;
	var ATTRIBUTES_PER_PAGE = 4;

	var LABEL_WIDTH, DISTRIBUTION_WIDTH, BIN_WIDTH, ATTRIBUTE_HEIGHT, BAR_MAX;

	var binPosition;
	var heightScale = d3.scale.linear();

	var bin = function(binData) {
		var binLayer = d3.select(this);

		var isTarget = binLayer.select('rect.isTarget');
		if (isTarget.empty()) {
			isTarget = binLayer.append('rect').attr('class', 'isTarget');
		}

		isTarget
			.attr('width', BAR_WIDTH)
			.attr('height', function(d) {
				return heightScale(d.isTarget);
			})
			.attr('x', -BAR_WIDTH)
			.attr('y', function(d) {
				return ATTRIBUTE_HEIGHT - heightScale(d.isTarget);
			})
			.attr('fill', '#ff00aa');

		var isNot = binLayer.select('rect.isNot');
		if (isNot.empty()) {
			isNot = binLayer.append('rect').attr('class', 'isNot');
		}

		isNot
			.attr('width', BAR_WIDTH)
			.attr('height', function(d) {
				return heightScale(d.isNot);
			})
			.attr('x', 0)
			.attr('y', function(d) {
				return ATTRIBUTE_HEIGHT - heightScale(d.isNot);
			})
			.attr('fill', '#00aaff');
			
	}

	var distribution = function(data) {
		var layer = d3.select(this);
		var scale = d3.scale.linear()
			.domain([data.min, data.max]);
		
		// Distribution Bins
		var distribution = layer.select('g.distribution');
		if (distribution.empty()) {
			distribution = layer.append('g')
				.attr('class', 'distribution')
				.attr('transform', 'translate(' + (MARGIN + BAR_WIDTH) + ', 0)');
		}

		heightScale.domain([0, data.maxBinCount]);
		var bins = distribution.selectAll('g.bin').data(data.bins);

		bins.enter().append('g').attr('class', 'bin');

		bins.attr('transform', function(d, i) {
			// var x = scale(d.x) * DISTRIBUTION_WIDTH;
			var x = i * DISTRIBUTION_WIDTH / data.bins.length;
			return 'translate(' + x + ', 0)';
		}).each(bin);

		// Title
		var title = layer.select('text.title');
		if (title.empty()) {
			title = layer.append('text')
				.attr('fill', '#fff')
				.attr('class', 'title')
				.attr('x', MARGIN)
				.attr('y', 30)
				.attr('font-size', 30)
				.attr('font-weight', 'bold')
		}

		title.text(data.key);

		// Axis
		var axisLayer = layer.select('g.axis');
		if (axisLayer.empty()) {
			axisLayer = layer.append('g')
				.attr('class', 'axis')
				.attr('transform', 'translate(' + (MARGIN + BAR_WIDTH) + ', 0)')
		}

		var interval = 4;
		// var ticksData = scale.ticks(Math.floor(DISTRIBUTION_WIDTH / BIN_WIDTH));
		
		var ticksData = data.ticks;
		var ticks = axisLayer.selectAll('g.tick').data(ticksData.filter(function(d, i) {
			return (i % interval === 0);
		}));

		var format = d3.format(data.format);

		ticks.enter().append('g').attr('class', 'tick');
		ticks.attr('transform', function(d, i) {
				// var x = scale(d) * DISTRIBUTION_WIDTH;
				var x = i * (DISTRIBUTION_WIDTH / data.bins.length) * interval;

				return 'translate(' + x + ', ' + (ATTRIBUTE_HEIGHT + 20) + ')';
			}).each(function(d) {
				console.log(d);

				var tickLayer = d3.select(this);

				var tickText = tickLayer.select('text');
				if (tickText.empty()) {
					tickText = tickLayer.append('text')
						.attr('font-size', 12)
						.attr('text-anchor', 'middle');
				}

				tickText
					.attr('fill', '#777')
					.text(format(parseFloat(d)));
			});

		var axisLine = axisLayer.select('rect.axisLine');
		if (axisLine.empty()) {
			axisLine = axisLayer.append('rect').attr('class', 'axisLine');
		}

		axisLine
			.attr('x', - BAR_WIDTH - BAR_GAP / 2)
			.attr('y', ATTRIBUTE_HEIGHT + 2)
			.attr('fill', '#777')
			.attr('width', DISTRIBUTION_WIDTH)
			.attr('height', 1);
	}

	distribution.setWidth = function(width) {
		WIDTH = width;
		deriveGeometries();

		return distribution;
	}

	distribution.setHeight = function(height) {
		HEIGHT = height;
		deriveGeometries();

		return distribution;
	}

	distribution.setGutters = function(gutters) {
		GUTTERS = gutters;

		deriveGeometries();
		return distribution;
	}

	var deriveGeometries = function() {
		LABEL_WIDTH = Math.floor(WIDTH * 0);
		DISTRIBUTION_WIDTH = WIDTH - LABEL_WIDTH - MARGIN * 2;
		BIN_WIDTH = BAR_WIDTH * 2 + BAR_GAP * 3;
		ATTRIBUTE_HEIGHT = HEIGHT - ATTRIBUTE_LABEL - 10;
		BAR_MAX = ATTRIBUTE_HEIGHT - ATTRIBUTE_LABEL;

		binPosition = function(i) {
			return i * BIN_WIDTH
		}

		heightScale.range([0, BAR_MAX]);
	}

	deriveGeometries();

	return distribution;
}
