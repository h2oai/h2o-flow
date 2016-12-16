var c1ClusterPrep = function (data) {


	var clusters = data.clusters;

	/*
	clusters.forEach(function(cluster) {
		var cellsGreaterThanZero = _.countBy(cluster.values.count, (c) => { return c > 0 });
		console.log('In cluster ' + cluster.key + ' there are ' + cellsGreaterThanZero['true'] + ' cell with value > 0');
	});
	*/


	clusters = clusters.sort(function(a, b) {
		return b.values.count.length - a.values.count.length;
	});

	var cells = [];
	for (var i = 0; i <= clusters[0].values.count.length - 1; i++) {
		cells.push(clusters.map(function(cluster) {
			return {
				key: cluster.key,
				value: cluster.values.count[i]
			}
		}));
	}

	var xLength = data.axis.x.bins.length;

	var across = data.axis.x.bins.map(function() {
		return clusters.map(function(cluster) {
			return {
				key: cluster.key,
				sum: 0
			}
		});
	});

	clusters.forEach(function(c, j) {
		c.values.count.forEach(function(cell, i) {
			across[Math.floor(i / xLength)][j].sum += cell;
		});
	});

	var down = data.axis.x.bins.map(function() {
		return clusters.map(function(cluster) {
			return {
				key: cluster.key,
				sum: 0
			}
		});
	});

	clusters.forEach(function(c, j) {
		c.values.count.forEach(function(cell, i) {
			down[i % xLength][j].sum += cell;
		});
	});

	var keys = clusters.map(function(d) { return d.key; });

	var summary = clusters.map(function(c) { 
		return {
			key: c.key,
			label: c.label,
			sum: d3.sum(c.values.count, function(d) { return d; })
		}
	});

	return {
		keys: keys,
		summary: summary,
		width: data.axis.x.bins.length,
		cells: cells,
		across: {
			axis: data.axis.y,
			values: across
		},
		down: {
			axis: data.axis.x,
			values: down
		}
	}
}

var clusterColors = function(d) {
	switch (true) {
		case d === '1':
			return d3.hsl(230, 0.45, 0.5).toString();
			break;
		case d === '2':
			return d3.hsl(180, 0.45, 0.5).toString();
			break;
		case d === '3':
			return d3.hsl(130, 0.45, 0.5).toString();
			break;
		case d === '4':
			return d3.hsl(80, 0.45, 0.5).toString();
			break;
		case d === '5':
			return d3.hsl(30, 0.45, 0.5).toString();
			break;
		default:
			return '#fff';
			break;
	}
}

var heatmap = (function(WIDTH, HEIGHT, MARGIN) {
	var layer, data;

	var clusterKeys = [];
	var focusKey = null;

	// Geometry Prep
	var MAX_HEIGHT = HEIGHT - MARGIN * 2;
	var MAX_WIDTH = WIDTH - MARGIN * 2;
	var MIN_GAP = 40;

	var BAR_HEIGHT = 70;
	var HISTOGRAM_MARGIN = 15;

	var STACKED_BAR_GAP = 40;
	var STACKED_BAR_WIDTH = 70;

	var heatColorSaturation = 0.6;
	var heatColorHue = d3.scale.pow().exponent(0.2)
		.range([359, 200])
		.clamp(true);

	var radiusScale = d3.scale.pow().exponent(0.5); // d3.scale.log(); // d3.scale.linear();
	var columnScale = d3.scale.linear()
		.range([0, BAR_HEIGHT]);
	
	var rowScale = d3.scale.linear()
		.range([0, BAR_HEIGHT]);

	var stackedBarScale = d3.scale.linear();

	var boxSize, boxSizePlusGap, gridCount;
	var boxGap = 1;

	var cellSum = function(cell) { 
		return d3.sum(cell, function(d) { return d.value; });
	}

	var barSum = function(bars) {
		return d3.sum(bars, function(d) { return d.sum; });	
	}

	var heatmap = function(l) {
		layer = l;
		data = c1ClusterPrep(layer.datum());

		clusterKeys = ['1'];

		var maxBin = d3.max(data.cells, cellSum);
		
		heatColorHue.domain([1, maxBin / 100]);
		radiusScale.domain([1, maxBin / 2]);

		// Binned Heatmap
		gridCount = data.width;
		var gridSize = MAX_HEIGHT;
		var gridX = (WIDTH - gridSize) * 0.8;

		boxSizePlusGap = Math.floor(gridSize / gridCount);
		boxSize = boxSizePlusGap - boxGap;

		radiusScale.range([0, boxSize * 2]);

		var boxeslayer = layer.append('g').attr('class', 'boxeslayer');
		boxeslayer.attr('transform', 'translate(' + gridX + ', ' + MARGIN + ')');

		// Column Histogram
		var maxColumn = d3.max(data.down, barSum);
		columnScale.domain([0, maxColumn]);

		var colHistogramLayer = layer.append('g').attr('class', 'colHistogram');
		colHistogramLayer.attr('transform', 'translate(' + gridX + ', -' + HISTOGRAM_MARGIN + ')');

		// Row Histogram
		var maxRow = d3.max(data.across, barSum);
		rowScale.domain([0, maxColumn]);

		var rowHistogramLayer = layer.append('g').attr('class', 'rowHistogram');
		rowHistogramLayer.attr('transform', 'translate(' + (gridX - MARGIN - HISTOGRAM_MARGIN) + ', ' + (MARGIN) + ')');

		// Summary
		var summaryExtent = [0, d3.sum(data.summary, function(d) { return d.sum; })];

		stackedBarScale
			.domain(summaryExtent)
			.range([0, MAX_HEIGHT - (data.summary.length - 1) * STACKED_BAR_GAP])
		
		var stackedBarsLayer = layer.append('g').attr('class', 'stackedBars');
		stackedBarsLayer.attr('transform', 'translate(' + (MARGIN + (WIDTH - gridSize) * 0.1) + ', ' + MARGIN + ')');

		draw(data);
	}

	var toggleClusters = function(arrayOfClusterKeys) {
		clusterKeys = arrayOfClusterKeys;
	}

	var toggleFocus = function(key) {
		focusKey = key;
	}

	var draw = function() {
		drawCells(data.cells);
		drawColumnHistogram(data.down);
		drawRowsHistogram(data.across);
		drawStackedBars(data.summary);
	}

	var drawStackedBars = function(barsData) {
		var countsTotal = d3.sum(data.summary, function(d) { return d.sum; });
		var stackedBarsLayer = layer.select('g.stackedBars');

		barsData = barsData.sort(function(a, b) {
			var aSum = (a.key === focusKey) ? Infinity : a.sum;
			var bSum = (b.key === focusKey) ? Infinity : b.sum;

			return bSum - aSum;
		});

		var culmulativeY = 0;
		barsData.forEach(function(d) {
			d.y = culmulativeY;
			d.height = stackedBarScale(d.sum);
			culmulativeY += d.height + STACKED_BAR_GAP;
		});

		barsData = barsData.sort(function(a, b) {
			var aSum = (a.key === focusKey) ? Infinity : a.sum;
			var bSum = (b.key === focusKey) ? Infinity : b.sum;

			return aSum - bSum;
		});

		var bars = stackedBarsLayer.selectAll('g.bar')
			.data(barsData, function(d) { return d.key; });

		bars.enter().append('g')
			.attr('class', 'bar');

		bars.each(function(d, i) {
			var barLayer = d3.select(this);

			var bar = barLayer.select('rect');
			if (bar.empty()) { bar = barLayer.append('rect'); }

			bar
				.attr('width', STACKED_BAR_WIDTH)
				.attr('height', d.height)
				.attr('fill', clusterColors(d.key));

			var label = barLayer.select('text.label');
			if (label.empty()) { 
				label = barLayer.append('text').attr('class', 'label'); 
			}

			label
				.attr('x', STACKED_BAR_WIDTH + 10)
				.attr('y', Math.min(22, d.height - 18))
				.attr('fill', '#ddd')
				.attr('font-size', 20)
				.text(d.label);

			var count = barLayer.select('text.count');
			if (count.empty()) { 
				count = barLayer.append('text').attr('class', 'count'); 
			}

			count
				.attr('x', STACKED_BAR_WIDTH + 10)
				.attr('y', Math.min(40, d.height))
				.attr('fill', '#ddd')
				.attr('font-size', 14)
				.text((Math.round(d.sum / countsTotal * 1000) / 10) + '% (' + numberFormat(d.sum) + ')');
		});

		bars
			.transition()
			.attr('opacity', function(d) {
				if (focusKey && d.key !== focusKey) {
					return 0.2;
				} else {
					return 1;
				}
			})
			.attr('transform', function(d) {
				return 'translate(0, ' + d.y + ')';
			});

		bars.exit().remove();
	}

	var drawColumnHistogram = function(data) {
		var down = data.values;

		var maxCol = d3.max(down, function(cell) {
			return d3.sum(cell, function(d) { 
				if (clusterKeys.indexOf(d.key) >= 0) {
					return d.sum;	
				} else {
					return 0;
				}
			});
		});
		columnScale.domain([0, maxCol]);

		var histogramLayer = layer.select('g.colHistogram');

		var title = histogramLayer.select('text.axis');
		if (title.empty()) {
			title = histogramLayer.append('text')
				.attr('x', MAX_HEIGHT)
				.attr('y', MARGIN)
				.attr('fill', '#555')
				.attr('class', 'axis')
				.text(data.axis.title);
		}

		var line = histogramLayer.select('rect.divider');
		if (line.empty()) {
			line = histogramLayer.append('rect')
				.attr('class', 'divider')
				.attr('height', 1)
				.attr('width', MAX_HEIGHT)
				.attr('y', MARGIN + 3)
				.attr('fill', '#555');
		}

		var bars = histogramLayer.selectAll('g.colBar').data(down);

		bars.enter().append('g')
			.attr('class', 'colBar')
			.attr('transform', function(d, i) {
				return 'translate(' + (i * boxSizePlusGap) + ', 0)';
			})

		bars.each(function(d, i) {
			var barLayer = d3.select(this);

			var bars = barLayer.selectAll('rect').data(d);
			var sum = d3.sum(d, function(c) {
				if (clusterKeys.indexOf(c.key) >= 0) {
					return c.sum;	
				} else {
					return 0;
				}
			});

			var culmulativeY = MARGIN - Math.ceil(columnScale(sum));
			d.forEach(function(sbar, i) {
				if (clusterKeys.indexOf(sbar.key) >= 0) {
					sbar.height = Math.ceil(columnScale(sbar.sum));
					sbar.y = culmulativeY;
					culmulativeY += sbar.height;
				} else {
					sbar.y = culmulativeY;
					sbar.height = 0;
				}
			});

			bars.enter().append('rect')
				.attr('height', 0)
				.attr('y', MARGIN)
				.attr('width', boxSize)
				.attr('fill', function(d) {
					return clusterColors(d.key)
				});

			bars
				.transition()
				.attr('y', function(d) { return d.y; })
				.attr('height', function(d) { return d.height; })

			bars.exit().remove();
		});

		bars.exit().remove();
	}

	var drawRowsHistogram = function(data) {
		var across = data.values;

		var maxRow = d3.max(across, function(cell) {
			return d3.sum(cell, function(d) { 
				if (clusterKeys.indexOf(d.key) >= 0) {
					return d.sum;	
				} else {
					return 0;
				}
			});
		});
		rowScale.domain([0, maxRow]);

		var histogramLayer = layer.select('g.rowHistogram');

		var title = histogramLayer.select('text.axis');
		if (title.empty()) {
			title = histogramLayer.append('text')
				.attr('x', MARGIN)
				.attr('y', MAX_HEIGHT + 16)
				.attr('text-anchor', 'end')
				.attr('fill', '#555')
				.attr('class', 'axis')
				.text(data.axis.title);
		}

		var line = histogramLayer.select('rect.divider');
		if (line.empty()) {
			line = histogramLayer.append('rect')
				.attr('class', 'divider')
				.attr('width', 1)
				.attr('height', MAX_HEIGHT)
				.attr('x', MARGIN + 3)
				.attr('fill', '#555');
		}

		var bars = histogramLayer.selectAll('g.rowBar').data(across);

		bars.enter().append('g')
			.attr('class', 'rowBar')
			.attr('transform', function(d, i) {
				return 'translate(0, ' + (i * boxSizePlusGap) + ')';
			});

		bars
			.each(function(d, i) {
				var barLayer = d3.select(this);

				var bars = barLayer.selectAll('rect').data(d);
				var sum = d3.sum(d, function(c) {
					if (clusterKeys.indexOf(c.key) >= 0) {
						return c.sum;	
					} else {
						return 0;
					}
				});

				var culmulativeX = MARGIN - Math.ceil(rowScale(sum));
				d.forEach(function(sbar, i) {
					if (clusterKeys.indexOf(sbar.key) >= 0) {
						sbar.width = Math.ceil(rowScale(sbar.sum));
						sbar.x = culmulativeX;
						culmulativeX += sbar.width;
					} else {
						sbar.x = culmulativeX;
						sbar.width = 0;
					}
				});

				bars.enter().append('rect')
					.attr('width', 0)
					.attr('x', MARGIN)
					.attr('height', boxSize)
					.attr('fill', function(d) {
						return clusterColors(d.key)
					});

				bars
					.transition()
					.attr('x', function(d) { return d.x; })
					.attr('width', function(d) { return d.width; })

				bars.exit().remove();
			});

		bars.exit().remove();

	}

	var drawCells = function(cells) {
		 maxBin = d3.max(cells, function(cell) {
			return d3.sum(cell, function(d) { 
				if (clusterKeys.indexOf(d.key) >= 0) {
					return d.value;	
				} else {
					return 0;
				}
			});
		});
		radiusScale.domain([0, maxBin]);

		var boxeslayer = layer.select('g.boxeslayer');

		var boxes = boxeslayer.selectAll('circle').data(cells);

		boxes.enter()
			.append('circle')
			.attr('cx', function(d, i) {
				return (i % data.width) * (boxSize + boxGap) + boxSize / 2;
			})
			.attr('cy', function(d, i) {
				return Math.floor(i / data.width) * (boxSize + boxGap) + boxSize / 2;
			})
			.attr('fill', '#333')
			.attr('r', 0);

		boxes.exit().remove();

		boxes
			.transition()
			.attr('r', function(d) {
				var sum = d3.sum(d, function(c) {
					if (clusterKeys.indexOf(c.key) >= 0) {
						return c.value;	
					} else {
						return 0;
					}
				});

				if (sum) {
					return Math.max(1.5, radiusScale(sum));
				} else {
					return 0;
				}
			})
			.attr('opacity', 0.9)
			.attr('fill', function(d) {
				var sum = cellSum(d);
				var h = heatColorHue(sum);

				if (clusterKeys.length === 1) {
					return clusterColors(clusterKeys[0]);
				} else {
					return '#ddd';	
				}
			});

	}

	heatmap.toggleClusters = toggleClusters;
	heatmap.toggleFocus = toggleFocus;
	heatmap.draw = draw;

	return heatmap;
})(WIDTH, HEIGHT, MARGIN);