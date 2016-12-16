var HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
					13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

var circadianDataPrep = function(data, groupKey) {
	// Data Prep
	var circadianData = data.map(function(d) {
		var date = d['datetime'];

		var startOfDay = moment(date).startOf('day');
		var m = moment(date);

		return {
			date: d['datetime'],
			moment: m,
			dayOfWeek: m.day(),
			hourOfDay: m.hour(),
			msOfDay: m.diff(startOfDay),
			auth: d['Authentication Package'],
			logonType: d['Logon Type']
		}
	});

	var nestByHour = d3.nest()
		.key(function(d) {
			return d.hourOfDay;
		})
		.rollup(function(v) {
			return v.length;
		})
		.entries(circadianData);

	var nestedByKeyThenHour = d3.nest()
		.key(function(d) {
			return d[groupKey];
		})
		.key(function(d) {
			return d.hourOfDay;
		})
		.rollup(function(v) {
			return v.length
		})
		.entries(circadianData);

	var countsByHour = d3.nest()
		.key(function(d) {
			return d.hourOfDay;
		})
		.rollup(function(v) {
			return v.length;
		})
		.entries(circadianData);

	HOURS.forEach(function(h) {
		if (!countsByHour[h]) {
			countsByHour = {
				values: 0
			}
		}
	});

	var results = {
		nested: nestedByKeyThenHour,
		countsByHour: countsByHour,
		countsExtent: [0, d3.max(nestByHour, function(d) { return d.values; })]
	};

	return results;
}

var circadianDataFromAggregatedCSV = function(error, results) {
	if (error) throw error;

	var headers = ['hourOfLogin','clusterid','Logon Type','Authentication Package','Account Domain','Count'];
	var keys = [
		{
			key: 'auth',
			title: 'Authentication Package'
		},
		{
			key: 'logonType',
			title: 'Logon Type'
		},
		{
			key: 'accountDomain',
			title: 'Account Domain'
		}
	]

	var pages = {}
	var sum = d3.sum(results, function(d) {
		return parseInt(d['Count']);
	});

	keys.forEach(function(k) {
		var nested = d3.nest()
			.key(function(d) {
				return d[k.title]
			})
			.key(function(d) {
				return d['hourOfLogin']
			})
			.rollup(function(v) {
				return d3.sum(v, function(d) {
					return parseInt(d['Count']);
				});
			})
			.entries(results);

		var countsByHour = d3.nest()
			.key(function(d) {
				return d['hourOfLogin'];
			})
			.rollup(function(v) {
				return d3.sum(v, function(d) {
					return parseInt(d['Count']);
				});
			})
			.entries(results);

		pages[k.key] = {
			title: k.title,
			nested: nested,
			countsByHour: countsByHour,
			countsExtent: [0, sum]
		}
	});

	return pages;
}

var circadian = (function(WIDTH, HEIGHT, MARGIN) {
	var layer, data, aggregationKey, subset;
	var split = false;

	// Geometry Prep
	var MAX_HEIGHT = HEIGHT - MARGIN * 2;
	var MAX_BIN_HEIGHT = MAX_HEIGHT * 2 / 3;
	var MAX_WIDTH = WIDTH - MARGIN * 2;
	var MIN_GAP = 40;

	var circadianScale = d3.scale.linear()
		.domain([0, 60 * 60 * 24 * 1000])
		.range([0, WIDTH - MARGIN * 2]);

	var binWidth = MAX_WIDTH / HOURS.length;
	var circadianBinX = function(hour) {
		return MARGIN + hour * binWidth;
	}

	var circadian = function(l) {
		layer = l;
		data = layer.datum();

		var workday = layer.select('g.workday');
		if (workday.empty()) { 
			workday = layer.append('g').attr('class', 'workday'); 
		}

		var workRect = workday.append('rect')
			.attr('x', circadianBinX(8) - 5)
			.attr('width', circadianBinX(16) - circadianBinX(8))
			.attr('y', MARGIN / 2)
			.attr('height', HEIGHT - MARGIN)
			.attr('fill', '#3f3f3f');

		var eightam = workday.append('text')
			.attr('x', circadianBinX(8) + 5)
			.attr('y', MARGIN / 2 + 34)
			.attr('font-size', 28)
			.attr('font-weight', 'bold')
			.attr('fill', '#777')
			.text('9a');

		var fivepm = workday.append('text')
			.attr('x', circadianBinX(16) + 5)
			.attr('y', MARGIN / 2 + 34)
			.attr('font-size', 28)
			.attr('font-weight', 'bold')
			.attr('fill', '#555')
			.text('5p');

		setKey('auth', false);
	}

	var setKey = function(key, shouldSplit) {
		aggregationKey = key;	
		subset = data[key];
		title = data[key].title;

		split = (typeof shouldSplit === 'boolean') ? shouldSplit : false;

		// Data Prep
		subset.nested.forEach(function(group, i) {
			HOURS.forEach(function(key) {
				var hour = _.find(group.values, function(h) { return parseInt(h.key) === key; });
				if (!hour) {
					group.values.push({
						key: ''+key,
						values: 0
					})
				}
			});

			group.values = group.values.sort(function(a, b) {
				return parseInt(a.key) - parseInt(b.key);
			});

			group.total = d3.sum(group.values, function(d) { return d.values; });
		});

		subset.nested.sort(function(a, b) {
			return b.total - a.total;
		});

		var gapCount = [];
		for (var i = -1; i < subset.nested.length; i++) {
			if (i < 0 || i === subset.nested.length - 1) {
				var key = (i < 0) ? 0 : subset.nested.length - 1;
				var margin = {};

				HOURS.forEach(function(h) {
					margin[h] = 0;

					var hour = _.find(subset.nested[key].values, function(d) { return parseInt(d.key) === h; });

					if (hour) { margin[h] += hour.values / 2; }
				});			

				gapCount.push(margin);
			} else {
				var margin = {};
				var topRow = subset.nested[i];
				var bottomRow = subset.nested[i + 1];

				HOURS.forEach(function(h) {
					margin[h] = 0;
					topRowHour = _.find(topRow.values, function(d) { return parseInt(d.key) === h; });
					if (topRowHour) { margin[h] += topRowHour.values / 2; }

					bottomRowHour = _.find(bottomRow.values, function(d) { return parseInt(d.key) === h; });
					if (bottomRowHour) { margin[h] += bottomRowHour.values / 2; }
				});

				gapCount.push(margin);
			}
		}

		var maxCounts = gapCount.map(function(gapsByHour) {
			return d3.max(HOURS, function(h) { 
				return gapsByHour[h]; 
			});
		});

		var maxBinCount = d3.sum(maxCounts, function(d) { return d; });

		var binHeightScale = d3.scale.linear()
			.domain([0, maxBinCount])
			.range([0, MAX_HEIGHT - subset.nested.length * MIN_GAP]);

		/*
		var nestedByWeekdayThenHour = d3.nest()
			.key(function(d) {
				return d.dayOfWeek;
			})
			.key(function(d) {
				return d.hourOfDay;
			})
			.rollup(function(v) {
				return {
					samples: v,
					count: v.length,
					height: binHeightScale(v.length)
				}
			})
			.entries(circadianData);
		*/

		/*
		nestedByWeekdayThenHour.forEach(function(d) {
			d.values = d.values.sor
		});
		*/

		// Precalculations
		var culmulativeAnchor = MARGIN;

		subset.nested.forEach(function(group, i) {
			group.values.forEach(function(hour) {
				hour.height = binHeightScale(hour.values);
			});

			var additionalHeight = binHeightScale(maxCounts[i]) + MIN_GAP;

			group.anchorY = culmulativeAnchor + additionalHeight;
			culmulativeAnchor += additionalHeight;
		});

		for (var binID = 0; binID < 24; binID++) {
			var totalHeight = binHeightScale(subset.countsByHour[binID].values);
			// var culmulativeHeight = MAX_BIN_HEIGHT - totalHeight + ((HEIGHT - MAX_BIN_HEIGHT) / 2);
			var culmulativeHeight = MAX_BIN_HEIGHT - totalHeight + ((HEIGHT - MAX_BIN_HEIGHT) / 2);

			subset.nested.forEach(function(group) {
				var hour = _.find(group.values, function(d) { return parseInt(d.key) === binID; });

				if (hour) {
					hour.y = culmulativeHeight;
					culmulativeHeight += hour.height;
				}
			});
		}

		// DOM Helpers
		var circadianYScaleFactory = function(itemsCount) {
			if (itemsCount <= 1) {
				return function() {
					return HEIGHT / 2;
				}
			} else {
				return function(i) {
					return i * (HEIGHT - MARGIN * 2) / (itemsCount - 1);
				}			
			}
		}

		draw(subset.nested, title);
	}

	var draw = function(binData, title) {
		var circadianTitle = layer.select('g.titleGroup');
		var circadianTitleMainText = circadianTitle.select('text.main');
		if (circadianTitle.empty()) {
			circadianTitle = layer.append('g')
				.attr('transform', 'translate(' + MARGIN + ', ' + (MARGIN / 2 + 34) + ')')
				.attr('class', 'titleGroup');

			circadianTitleMainText = circadianTitle.append('text')
				.attr('class', 'main')
				.attr('font-size', 24)
				.attr('font-weight', 'bold')
				.attr('fill', '#fff');
		}

		if (!split) {
			circadianTitleMainText.text('System Logins by Hour of Day');
		} else {
			circadianTitleMainText.text(title);
		}

		// DOM manipulations for Histograms
		var binData = subset.nested;

		var binGroups = layer.selectAll('g.binGroup')
			.data(binData);

		binGroups.exit().remove()
		binGroups.enter().append('g').attr('class', 'binGroup');

		binGroups
			.each(function(group, i) {
				var h = 10 + i * 50;
				var color = d3.hsl(h, 0.45, 0.5);

				var binLayer = d3.select(this);

				// Background Line
				var lineY = function(d) { return (split) ? group.anchorY : d.y;	}
				var lineOpacity = function(d) { return (split) ? 0.1 : 0; }

				var line = binLayer.select('rect.line');
				if (line.empty()) {
					line = binLayer.append('rect').attr('class', 'line');

					line
						.attr('x', MARGIN)
						.attr('y', lineY)
						.attr('width', MAX_WIDTH)
						.attr('height', 1)
						.attr('fill', '#111')
						.attr('opacity', lineOpacity)
						.attr('stroke', 'none');
				}

				line
					.transition()
					.attr('y', lineY)
					.attr('opacity', lineOpacity);
				
				// Histogram Bars
				var rects = binLayer.selectAll('rect.bar')
					.data(group.values);

				
				rects.enter()
					.append('rect').attr('class', 'bar');

				rects
					.transition()
					.attr('x', function(d) {
						return circadianBinX(parseInt(d.key));
					})
					.attr('y', function(d) {
						if (split) {
							return group.anchorY - d.height / 2;
						} else {
							return Math.floor(d.y);	
						}
					})
					.attr('height', function(d) {
						return (d.height === 0) ? 0 : Math.ceil(Math.max(1, d.height));
					})
					.attr('width', binWidth - 10)
					.attr('fill', function() {
						return (split) ? color.toString() : '#466ab9';
					});

				rects.exit().remove();

				// Text
				var textY = function(d) { return (split) ? (group.anchorY - 5) : (HEIGHT - MARGIN - 5);	}
				var countsY = function(d) { return (split) ? (group.anchorY + 12) : (HEIGHT - MARGIN + 12);	}
				var textOpacity = function(d) { return (split) ? 1 : 0; }

				var text = binLayer.select('text.group');
				if (text.empty()) {
					text = binLayer.append('text').attr('class', 'group');

					text
						.text(group.key)
						.attr('fill', '#ccc')
						.attr('font-size', 18)
						.attr('font-weight', 'bold')
						.attr('y', textY)
						.attr('opacity', textOpacity)
						.attr('x', MARGIN);
				}

				text.transition()
					.text(group.key)
					.attr('y', textY)
					.attr('opacity', textOpacity);

				// Counts
				var counts = binLayer.select('text.count');
				if (counts.empty()) {
					counts = binLayer.append('text').attr('class', 'count');

					counts
						.attr('font-size', 11)
						.attr('fill', '#999')
						.attr('y', countsY)
						.attr('opacity', textOpacity)
						.attr('x', MARGIN);
				}

				counts.transition()
					.text('n: ' + numberFormat(group.total))
					.attr('y', countsY)
					.attr('opacity', textOpacity);

			});

	}

	circadian.setKey = setKey;
	circadian.draw = draw;

	return circadian;
})(WIDTH, HEIGHT, MARGIN);