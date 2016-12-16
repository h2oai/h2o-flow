var WIDTH = 1440;
var HEIGHT = 900;
var MARGIN = 100;

var LABEL_WIDTH = Math.floor(WIDTH * 0.25);
var GUTTERS = 20;
var DISTRIBUTION_WIDTH = WIDTH - LABEL_WIDTH - GUTTERS - MARGIN * 2;

var BAR_WIDTH = 6;
var BAR_GAP = 2;
var BIN_WIDTH = BAR_WIDTH * 2 + BAR_GAP;

var ATTRIBUTES_PER_PAGE = 5;
var ATTRIBUTE_HEIGHT = (HEIGHT - (GUTTERS * (ATTRIBUTES_PER_PAGE + 1))) / ATTRIBUTES_PER_PAGE;
var ATTRIBUTE_LABEL = 20;
var BAR_MAX = ATTRIBUTE_HEIGHT - ATTRIBUTE_LABEL;

var svg = d3.select('#main').append('svg')
	.attr("preserveAspectRatio", "xMinYMin meet")
	.attr('style', 'margin: 0 auto')
	.attr('width', '100%')
	.attr('height', '100%')
	.attr('viewBox', '0 0 ' + WIDTH + ' ' + HEIGHT);

var aamSlide = svg.append('g').attr('class', 'slide aamSlide');
var titleSlide = svg.append('g').attr('class', 'slide titleSlide');
var sampleDomainSlide = svg.append('g').attr('class', 'slide sampleDomainSlide');
var featuresSlide = svg.append('g').attr('class', 'slide featuresSlide');
var confusionMatrixSlide = svg.append('g').attr('class', 'slide confusionMatrixSlide');

svg.selectAll('.slide')
	.attr('transform', 'translate(0, ' + HEIGHT + ')').attr('opacity', 0);

var introLayer = svg.append('g').attr('class', 'introLayer')
	.call(function(introLayer) {
		introLayer.append('text')
			.text('finding anomalies in')
			.attr('font-size', 36)
			.attr('font-weight', 'bold')
			.attr('fill', '#aaa')
			.attr('y', HEIGHT / 2 - 105)
			.attr('x', WIDTH / 2)
			.attr('text-anchor', 'middle');

		introLayer.append('text')
			.text('4,000,000')
			.attr('font-size', 96)
			.attr('font-weight', 'bold')
			.attr('fill', '#fff')
			.attr('y', HEIGHT / 2)
			.attr('x', WIDTH / 2)
			.attr('text-anchor', 'middle');

		introLayer.append('text')
			.text('system logins')
			.attr('font-size', 36)
			.attr('font-weight', 'bold')
			.attr('fill', '#aaa')
			.attr('y', HEIGHT / 2 + 60)
			.attr('x', WIDTH / 2)
			.attr('text-anchor', 'middle');
	});

var variablesLayer = svg.append('g').attr('class', 'variablesLayer');
variablesLayer.attr('transform', 'translate(0, ' + HEIGHT + ')').attr('opacity', 0);
variablesLayer.datum([
	{	
		key: 'Account Domain',
		values: ['ACC_DOM_1', 'NT AUTHORITY', 'OTHER', 'MAIL', 'ACC_DOM_2', 'ACC_DOM_3']
	},
	{	
		key: 'Authentication Package',
		values : ['Kerberos', 'NTLM', 'Negotiate', 'MICROSOFT_AUTHENTICATION_PACKAGE_V1_0', 'iwsuid', 'ATTACHMATE_SSH_AUTHENTICATION_PACKAGE_V2', '-']
	},
	{	
		key: 'Key Length',
		values : [0, 128]
	},
	{	
		key: 'Logon Process',
		values : ['Kerberos', 'NtLmSsp ', 'Advapi  ', 'AzRoles ', '.Jobs   ', 'IMA', 'Authz   ', 'iwsuid', 'C', 'User32 ', 'SSHSrv', 'Negotiat', 'rsshap', 'seclogo', 'ssptest', '-', 'N']
	},
	{	
		key: 'Logon Type',
		values : ['Network', 'NewCredentials', 'Service', 'Interactive', 'Batch', 'NetworkCleartext', 'RemoteInteractive', 'Unlock', 'System Logon']
	},
	{	
		key: 'NTLM Version',
		values: ['-', 'NTLM V1', 'NTLM V2']
	}
]).call(function(variablesLayer) {
	var data = variablesLayer.datum();
	var rows = variablesLayer.selectAll('g.variableRow').data(data);

	rows.enter().append('g').attr('class', 'variableRow');

	rows.attr('transform', function(d, i) {
			return 'translate(0, ' + (MARGIN + i * (HEIGHT - 2 * MARGIN) / 6) + ')';
		})
		.each(function(d) {
			var layer = d3.select(this);

			var key = layer.select('text.key');
			if (key.empty()) { key = layer.append('text').attr('class', 'key'); }

			key.text(d.key + ' (' + d.values.length + ')')
				.attr('x', MARGIN)
				.attr('fill', '#fff')
				.attr('font-size', 48);

			var values = layer.select('text.values');
			if (values.empty()) { values = layer.append('text').attr('class', 'values'); }

			values.text(d.values.join(', '))
				.attr('x', MARGIN)
				.attr('fill', '#ddd')
				.attr('y', 40)
				.attr('font-size', 16);
		})
});

var intrigueLayer = svg.append('g').attr('class', 'intrigueLayer');
intrigueLayer.attr('transform', 'translate(0, ' + (HEIGHT) + ')').attr('opacity', 0);
intrigueLayer.call(function(intrigueLayer) {
	intrigueLayer.append('text')
		.text('6 * 7 * 2 * 17 * 9 * 3')
		.attr('font-size', 36)
		.attr('font-weight', 'bold')
		.attr('fill', '#aaa')
		.attr('y', HEIGHT / 2 - 105)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');

	intrigueLayer.append('text')
		.text('38,556')
		.attr('font-size', 96)
		.attr('font-weight', 'bold')
		.attr('fill', '#fff')
		.attr('y', HEIGHT / 2)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');

	intrigueLayer.append('text')
		.text('combinations')
		.attr('font-size', 36)
		.attr('font-weight', 'bold')
		.attr('fill', '#aaa')
		.attr('y', HEIGHT / 2 + 60)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');
});

var pivotLayer = svg.append('g').attr('class', 'pivotLayer');
pivotLayer.attr('transform', 'translate(0, ' + (HEIGHT) + ')').attr('opacity', 0);
pivotLayer.call(function(pivotLayer) {
	pivotLayer.append('text')
		.text('Principal Components Analysis')
		.attr('font-size', 72)
		.attr('font-weight', 'bold')
		.attr('fill', '#fff')
		.attr('y', HEIGHT / 2 - 20)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');

	pivotLayer.append('text')
		.text('A method for statistically summarizing')
		.attr('font-size', 36)
		.attr('font-weight', 'bold')
		.attr('fill', '#aaa')
		.attr('y', HEIGHT / 2 + 40)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');

	pivotLayer.append('text')
		.text('the variation that are actually significant.')
		.attr('font-size', 36)
		.attr('font-weight', 'bold')
		.attr('fill', '#aaa')
		.attr('y', HEIGHT / 2 + 80)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');
});

var circadianLayer = svg.append('g').attr('class', 'circadianLayer');
circadianLayer.attr('transform', 'translate(0, ' + (HEIGHT) + ')').attr('opacity', 0);
circadianLayer.datum(aggregatedData).call(circadian);

var heatmapLayer = svg.append('g').attr('class', 'heatmapLayer');
heatmapLayer.attr('transform', 'translate(0, ' + (HEIGHT) + ')').attr('opacity', 0);


// if db used call url to request db data for cluster population
// d3.json("/query", function(error, json) {
// 	  if (error) return console.warn(error);

// 	  partial_clusters.clusters = json;

// 	  partial_clusters.clusters.forEach(function(d){
// 	  	d.values = JSON.parse(d.values);
// 	  })

// 	  heatmapLayer.datum(partial_clusters).call(heatmap);
// });

// if db is not used, just used hard-coded data
heatmapLayer.datum(clustersData).call(heatmap);


// Title Slide
titleSlide.call(function(titleSlide) {
	titleSlide.append('text')
		.text('Identifying')
		.attr('font-size', 36)
		.attr('font-weight', 'bold')
		.attr('fill', '#aaa')
		.attr('y', HEIGHT / 2 - 105)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');

	titleSlide.append('text')
		.text('Anomalous Domain Names')
		.attr('font-size', 96)
		.attr('font-weight', 'bold')
		.attr('fill', '#fff')
		.attr('y', HEIGHT / 2)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');

	titleSlide.append('text')
		.text('combinations')
		.attr('font-size', 36)
		.attr('font-weight', 'bold')
		.attr('fill', '#aaa')
		.attr('y', HEIGHT / 2 + 60)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');
});

// Account Affinity Model Slide
aamSlide.call(function(aamSlide) {
	// titleSlide.append('text')
	// 	.text('Identifying')
	// 	.attr('font-size', 36)
	// 	.attr('font-weight', 'bold')
	// 	.attr('fill', '#aaa')
	// 	.attr('y', HEIGHT / 2 - 105)
	// 	.attr('x', WIDTH / 2)
	// 	.attr('text-anchor', 'middle');

	aamSlide.append('text')
		.text('Account Affinity Model')
		.attr('font-size', 96)
		.attr('font-weight', 'bold')
		.attr('fill', '#fff')
		.attr('y', HEIGHT / 2)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');

	aamSlide.append('text')
		.text('(2am) model')
		.attr('font-size', 36)
		.attr('font-weight', 'bold')
		.attr('fill', '#aaa')
		.attr('y', HEIGHT / 2 + 60)
		.attr('x', WIDTH / 2)
		.attr('text-anchor', 'middle');
});

// Sample Domain Names Slide
sampleDomainSlide.datum({
	normal: {
		key: "Normal Domains",
		fill: "#00aaff",
		values: ['google', 'facebook', 'tumblr', 'wikipedia', 'amazon', 'hao123', 'aliexpress', 'stackoverflow']
	},
	fake: {
		key: "Generated Domains",
		fill: "#ff00aa",
		values: ['boykrjjngjkmib', '17d86naxtlmf3r1p52q6g8565', 'dhfddeaolictu', 'gtjroqafraxyp', 'cijceaphymiy', 'eaikblpegqwblw', '10cgaik1yev8h07l57r61cg7qe2', '6yjhm1231eel1o8861911d6yk0']
	}
})
.call(function(sampleDomainSlide) {
	var data = sampleDomainSlide.datum();

	var sampleDomainListing = function(layer) {
		var data = layer.datum();

		var title = layer.select('text.title');
		if (title.empty()) {
			title = layer.append('text').attr('class', 'title');
		}

		title
			.attr('y', MARGIN + 80)
			.attr('font-size', 60)
			.attr('font-weight', 'bold')
			.attr('fill', data.fill)
			.text(data.key);

		urls = layer.selectAll('text.urls').data(data.values);

		urls.enter().append('text')
			.attr('class', 'urls')
			.attr('font-size', 36)
			.attr('fill', '#fff');

		urls.text(function(d) {
				return d;
			})
			.attr('y', function(d, i) {
				return MARGIN + 150 + i * 60;
			});

	}

	var normalLayer = sampleDomainSlide.select('g.normal');
	if (normalLayer.empty()) {
		normalLayer = sampleDomainSlide.append('g').attr('class', 'normal');
	}

	normalLayer.attr('transform', 'translate(' + MARGIN + ', 0)');
	normalLayer.datum(data.normal).call(sampleDomainListing);

	var fakeLayer = sampleDomainSlide.select('g.fake');
	if (fakeLayer.empty()) {
		fakeLayer = sampleDomainSlide.append('g').attr('class', 'fake');
	}

	fakeLayer.attr('transform', 'translate(' + (WIDTH / 2) + ', 0)');
	fakeLayer.datum(data.fake).call(sampleDomainListing);

});

/*
var columns = [
	{"key":"Entropy","min":0,"max":4.504706483564823,"ticks":[0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2.1,2.2,2.3,2.4,2.5,2.6,2.7,2.8,2.9,3,3.1,3.2,3.3,3.4,3.5,3.6,3.7,3.8,3.9,4,4.1,4.2,4.3,4.4,4.5],"maxBinCount":2698,"bins":[{"x":0,"y":0,"dx":0.1,"isTarget":0,"isNot":40},{"x":0.1,"y":0,"dx":0.1,"isTarget":0,"isNot":0},{"x":0.2,"y":0,"dx":0.09999999999999998,"isTarget":0,"isNot":0},{"x":0.3,"y":0,"dx":0.10000000000000003,"isTarget":0,"isNot":0},{"x":0.4,"y":0,"dx":0.09999999999999998,"isTarget":0,"isNot":1},{"x":0.5,"y":0,"dx":0.09999999999999998,"isTarget":0,"isNot":0},{"x":0.6,"y":0,"dx":0.09999999999999998,"isTarget":0,"isNot":1},{"x":0.7,"y":0,"dx":0.10000000000000009,"isTarget":0,"isNot":6},{"x":0.8,"y":0,"dx":0.09999999999999998,"isTarget":0,"isNot":20},{"x":0.9,"y":0,"dx":0.09999999999999998,"isTarget":0,"isNot":133},{"x":1,"y":0,"dx":0.10000000000000009,"isTarget":0,"isNot":305},{"x":1.1,"y":0,"dx":0.09999999999999987,"isTarget":0,"isNot":0},{"x":1.2,"y":0,"dx":0.10000000000000009,"isTarget":0,"isNot":6},{"x":1.3,"y":0,"dx":0.09999999999999987,"isTarget":0,"isNot":60},{"x":1.4,"y":0,"dx":0.10000000000000009,"isTarget":0,"isNot":18},{"x":1.5,"y":0,"dx":0.10000000000000009,"isTarget":0,"isNot":1348},{"x":1.6,"y":0,"dx":0.09999999999999987,"isTarget":0,"isNot":5},{"x":1.7,"y":0,"dx":0.10000000000000009,"isTarget":0,"isNot":85},{"x":1.8,"y":0,"dx":0.09999999999999987,"isTarget":0,"isNot":36},{"x":1.9,"y":0,"dx":0.10000000000000009,"isTarget":0,"isNot":991},{"x":2,"y":0,"dx":0.10000000000000009,"isTarget":0,"isNot":964},{"x":2.1,"y":1,"dx":0.10000000000000009,"isTarget":1,"isNot":197},{"x":2.2,"y":3,"dx":0.09999999999999964,"isTarget":3,"isNot":1217},{"x":2.3,"y":3,"dx":0.10000000000000009,"isTarget":3,"isNot":1085},{"x":2.4,"y":4,"dx":0.10000000000000009,"isTarget":4,"isNot":315},{"x":2.5,"y":13,"dx":0.10000000000000009,"isTarget":13,"isNot":2698},{"x":2.6,"y":55,"dx":0.10000000000000009,"isTarget":55,"isNot":393},{"x":2.7,"y":87,"dx":0.09999999999999964,"isTarget":87,"isNot":1809},{"x":2.8,"y":310,"dx":0.10000000000000009,"isTarget":310,"isNot":1227},{"x":2.9,"y":269,"dx":0.10000000000000009,"isTarget":269,"isNot":1588},{"x":3,"y":1277,"dx":0.10000000000000009,"isTarget":1277,"isNot":1571},{"x":3.1,"y":885,"dx":0.10000000000000009,"isTarget":885,"isNot":1035},{"x":3.2,"y":1566,"dx":0.09999999999999964,"isTarget":1566,"isNot":713},{"x":3.3,"y":2124,"dx":0.10000000000000009,"isTarget":2124,"isNot":560},{"x":3.4,"y":760,"dx":0.10000000000000009,"isTarget":760,"isNot":269},{"x":3.5,"y":1492,"dx":0.10000000000000009,"isTarget":1492,"isNot":182},{"x":3.6,"y":854,"dx":0.10000000000000009,"isTarget":854,"isNot":95},{"x":3.7,"y":886,"dx":0.09999999999999964,"isTarget":886,"isNot":11},{"x":3.8,"y":1334,"dx":0.10000000000000009,"isTarget":1334,"isNot":7},{"x":3.9,"y":1953,"dx":0.10000000000000009,"isTarget":1953,"isNot":2},{"x":4,"y":2210,"dx":0.09999999999999964,"isTarget":2210,"isNot":0},{"x":4.1,"y":1685,"dx":0.10000000000000053,"isTarget":1685,"isNot":1},{"x":4.2,"y":933,"dx":0.09999999999999964,"isTarget":933,"isNot":5},{"x":4.3,"y":244,"dx":0.10000000000000053,"isTarget":244,"isNot":1},{"x":4.4,"y":52,"dx":0.09999999999999964,"isTarget":52,"isNot":0}]},
	{"key":"Domain Length","min":1,"max":59,"ticks":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59],"maxBinCount":3198,"bins":[{"x":1,"y":0,"dx":1,"isTarget":0,"isNot":11},{"x":2,"y":0,"dx":1,"isTarget":0,"isNot":281},{"x":3,"y":0,"dx":1,"isTarget":0,"isNot":1041},{"x":4,"y":0,"dx":1,"isTarget":0,"isNot":1338},{"x":5,"y":0,"dx":1,"isTarget":0,"isNot":1833},{"x":6,"y":0,"dx":1,"isTarget":0,"isNot":2314},{"x":7,"y":1,"dx":1,"isTarget":1,"isNot":2287},{"x":8,"y":0,"dx":1,"isTarget":0,"isNot":2103},{"x":9,"y":0,"dx":1,"isTarget":0,"isNot":1909},{"x":10,"y":0,"dx":1,"isTarget":0,"isNot":1579},{"x":11,"y":0,"dx":1,"isTarget":0,"isNot":1240},{"x":12,"y":2287,"dx":1,"isTarget":2287,"isNot":960},{"x":13,"y":2277,"dx":1,"isTarget":2277,"isNot":621},{"x":14,"y":2439,"dx":1,"isTarget":2439,"isNot":457},{"x":15,"y":2350,"dx":1,"isTarget":2350,"isNot":363},{"x":16,"y":0,"dx":1,"isTarget":0,"isNot":240},{"x":17,"y":2,"dx":1,"isTarget":2,"isNot":156},{"x":18,"y":6,"dx":1,"isTarget":6,"isNot":89},{"x":19,"y":16,"dx":1,"isTarget":16,"isNot":73},{"x":20,"y":33,"dx":1,"isTarget":33,"isNot":22},{"x":21,"y":56,"dx":1,"isTarget":56,"isNot":31},{"x":22,"y":120,"dx":1,"isTarget":120,"isNot":16},{"x":23,"y":214,"dx":1,"isTarget":214,"isNot":9},{"x":24,"y":633,"dx":1,"isTarget":633,"isNot":11},{"x":25,"y":1897,"dx":1,"isTarget":1897,"isNot":1},{"x":26,"y":3198,"dx":1,"isTarget":3198,"isNot":6},{"x":27,"y":2529,"dx":1,"isTarget":2529,"isNot":2},{"x":28,"y":797,"dx":1,"isTarget":797,"isNot":2},{"x":29,"y":88,"dx":1,"isTarget":88,"isNot":0},{"x":30,"y":45,"dx":1,"isTarget":45,"isNot":0},{"x":31,"y":11,"dx":1,"isTarget":11,"isNot":0},{"x":32,"y":1,"dx":1,"isTarget":1,"isNot":1},{"x":33,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":34,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":35,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":36,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":37,"y":0,"dx":1,"isTarget":0,"isNot":1},{"x":38,"y":0,"dx":1,"isTarget":0,"isNot":1},{"x":39,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":40,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":41,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":42,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":43,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":44,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":45,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":46,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":47,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":48,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":49,"y":0,"dx":1,"isTarget":0,"isNot":1},{"x":50,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":51,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":52,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":53,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":54,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":55,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":56,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":57,"y":0,"dx":1,"isTarget":0,"isNot":0},{"x":58,"y":0,"dx":1,"isTarget":0,"isNot":1}]},
	{"key":"Ratio of Letters to Numbers","min":0,"max":1,"ticks":[0,0.02,0.04,0.06,0.08,0.1,0.12,0.14,0.16,0.18,0.2,0.22,0.24,0.26,0.28,0.3,0.32,0.34,0.36,0.38,0.4,0.42,0.44,0.46,0.48,0.5,0.52,0.54,0.56,0.58,0.6,0.62,0.64,0.66,0.68,0.7,0.72,0.74,0.76,0.78,0.8,0.82,0.84,0.86,0.88,0.9,0.92,0.94,0.96,0.98,1],"maxBinCount":2492,"bins":[{"x":0,"y":0,"dx":0.02,"isTarget":0,"isNot":225},{"x":0.02,"y":0,"dx":0.02,"isTarget":0,"isNot":0},{"x":0.04,"y":0,"dx":0.019999999999999997,"isTarget":0,"isNot":0},{"x":0.06,"y":0,"dx":0.020000000000000004,"isTarget":0,"isNot":0},{"x":0.08,"y":0,"dx":0.020000000000000004,"isTarget":0,"isNot":0},{"x":0.1,"y":0,"dx":0.01999999999999999,"isTarget":0,"isNot":1},{"x":0.12,"y":0,"dx":0.020000000000000018,"isTarget":0,"isNot":2},{"x":0.14,"y":0,"dx":0.01999999999999999,"isTarget":0,"isNot":4},{"x":0.16,"y":0,"dx":0.01999999999999999,"isTarget":0,"isNot":32},{"x":0.18,"y":0,"dx":0.020000000000000018,"isTarget":0,"isNot":0},{"x":0.2,"y":1,"dx":0.01999999999999999,"isTarget":1,"isNot":56},{"x":0.22,"y":4,"dx":0.01999999999999999,"isTarget":4,"isNot":3},{"x":0.24,"y":8,"dx":0.020000000000000018,"isTarget":8,"isNot":85},{"x":0.26,"y":7,"dx":0.020000000000000018,"isTarget":7,"isNot":1},{"x":0.28,"y":27,"dx":0.019999999999999962,"isTarget":27,"isNot":41},{"x":0.3,"y":29,"dx":0.020000000000000018,"isTarget":29,"isNot":4},{"x":0.32,"y":91,"dx":0.020000000000000018,"isTarget":91,"isNot":283},{"x":0.34,"y":88,"dx":0.019999999999999962,"isTarget":88,"isNot":1},{"x":0.36,"y":122,"dx":0.020000000000000018,"isTarget":122,"isNot":63},{"x":0.38,"y":193,"dx":0.020000000000000018,"isTarget":193,"isNot":1},{"x":0.4,"y":256,"dx":0.019999999999999962,"isTarget":256,"isNot":368},{"x":0.42,"y":279,"dx":0.020000000000000018,"isTarget":279,"isNot":188},{"x":0.44,"y":458,"dx":0.020000000000000018,"isTarget":458,"isNot":132},{"x":0.46,"y":459,"dx":0.019999999999999962,"isTarget":459,"isNot":22},{"x":0.48,"y":528,"dx":0.020000000000000018,"isTarget":528,"isNot":0},{"x":0.5,"y":1001,"dx":0.020000000000000018,"isTarget":1001,"isNot":1498},{"x":0.52,"y":960,"dx":0.020000000000000018,"isTarget":960,"isNot":69},{"x":0.54,"y":429,"dx":0.020000000000000018,"isTarget":429,"isNot":476},{"x":0.56,"y":886,"dx":0.019999999999999907,"isTarget":886,"isNot":716},{"x":0.58,"y":431,"dx":0.020000000000000018,"isTarget":431,"isNot":167},{"x":0.6,"y":826,"dx":0.020000000000000018,"isTarget":826,"isNot":1193},{"x":0.62,"y":288,"dx":0.020000000000000018,"isTarget":288,"isNot":1083},{"x":0.64,"y":620,"dx":0.020000000000000018,"isTarget":620,"isNot":137},{"x":0.66,"y":692,"dx":0.020000000000000018,"isTarget":692,"isNot":2492},{"x":0.68,"y":662,"dx":0.019999999999999907,"isTarget":662,"isNot":272},{"x":0.7,"y":567,"dx":0.020000000000000018,"isTarget":567,"isNot":1622},{"x":0.72,"y":653,"dx":0.020000000000000018,"isTarget":653,"isNot":551},{"x":0.74,"y":681,"dx":0.020000000000000018,"isTarget":681,"isNot":1662},{"x":0.76,"y":805,"dx":0.020000000000000018,"isTarget":805,"isNot":805},{"x":0.78,"y":712,"dx":0.020000000000000018,"isTarget":712,"isNot":127},{"x":0.8,"y":828,"dx":0.019999999999999907,"isTarget":828,"isNot":1381},{"x":0.82,"y":786,"dx":0.020000000000000018,"isTarget":786,"isNot":781},{"x":0.84,"y":1456,"dx":0.020000000000000018,"isTarget":1456,"isNot":596},{"x":0.86,"y":697,"dx":0.020000000000000018,"isTarget":697,"isNot":307},{"x":0.88,"y":119,"dx":0.020000000000000018,"isTarget":119,"isNot":202},{"x":0.9,"y":560,"dx":0.020000000000000018,"isTarget":560,"isNot":213},{"x":0.92,"y":1203,"dx":0.019999999999999907,"isTarget":1203,"isNot":24},{"x":0.94,"y":44,"dx":0.020000000000000018,"isTarget":44,"isNot":1},{"x":0.96,"y":22,"dx":0.020000000000000018,"isTarget":22,"isNot":0},{"x":0.98,"y":522,"dx":0.020000000000000018,"isTarget":522,"isNot":1113}]},
	{"key":"Number Unique Characters","min":1,"max":24,"ticks":[1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12,12.5,13,13.5,14,14.5,15,15.5,16,16.5,17,17.5,18,18.5,19,19.5,20,20.5,21,21.5,22,22.5,23,23.5,24],"maxBinCount":3015,"bins":[{"x":1,"y":0,"dx":0.5,"isTarget":0,"isNot":40},{"x":1.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":2,"y":0,"dx":0.5,"isTarget":0,"isNot":466},{"x":2.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":3,"y":0,"dx":0.5,"isTarget":0,"isNot":1432},{"x":3.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":4,"y":0,"dx":0.5,"isTarget":0,"isNot":2066},{"x":4.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":5,"y":1,"dx":0.5,"isTarget":1,"isNot":2459},{"x":5.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":6,"y":9,"dx":0.5,"isTarget":9,"isNot":3015},{"x":6.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":7,"y":78,"dx":0.5,"isTarget":78,"isNot":2954},{"x":7.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":8,"y":481,"dx":0.5,"isTarget":481,"isNot":2471},{"x":8.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":9,"y":1396,"dx":0.5,"isTarget":1396,"isNot":1891},{"x":9.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":10,"y":2447,"dx":0.5,"isTarget":2447,"isNot":1101},{"x":10.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":11,"y":2621,"dx":0.5,"isTarget":2621,"isNot":622},{"x":11.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":12,"y":1630,"dx":0.5,"isTarget":1630,"isNot":295},{"x":12.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":13,"y":691,"dx":0.5,"isTarget":691,"isNot":134},{"x":13.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":14,"y":388,"dx":0.5,"isTarget":388,"isNot":37},{"x":14.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":15,"y":585,"dx":0.5,"isTarget":585,"isNot":7},{"x":15.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":16,"y":1171,"dx":0.5,"isTarget":1171,"isNot":2},{"x":16.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":17,"y":1769,"dx":0.5,"isTarget":1769,"isNot":1},{"x":17.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":18,"y":2178,"dx":0.5,"isTarget":2178,"isNot":0},{"x":18.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":19,"y":1863,"dx":0.5,"isTarget":1863,"isNot":1},{"x":19.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":20,"y":1082,"dx":0.5,"isTarget":1082,"isNot":1},{"x":20.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":21,"y":447,"dx":0.5,"isTarget":447,"isNot":2},{"x":21.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":22,"y":139,"dx":0.5,"isTarget":139,"isNot":1},{"x":22.5,"y":0,"dx":0.5,"isTarget":0,"isNot":0},{"x":23,"y":22,"dx":0.5,"isTarget":22,"isNot":1},{"x":23.5,"y":2,"dx":0.5,"isTarget":2,"isNot":1}]}
]
*/
var columns = [
	{"format": ".2f", "maxBinCount": 28324, "min": 0.0, "max": 0.38888888888899997, "ticks": [-0.000388888888889, 0.012962962962966666, 0.025925925925933332, 0.0388888888889, 0.051851851851866665, 0.06481481481483334, 0.0777777777778, 0.09074074074076666, 0.10370370370373333, 0.1166666666667, 0.12962962962966668, 0.14259259259263332, 0.1555555555556, 0.16851851851856667, 0.1814814814815333, 0.1944444444445, 0.20740740740746666, 0.22037037037043333, 0.2333333333334, 0.24629629629636665, 0.25925925925933335, 0.27222222222229997, 0.28518518518526664, 0.2981481481482333, 0.3111111111112, 0.32407407407416666, 0.33703703703713334, 0.3500000000001, 0.3629629629630666, 0.3759259259260333, 0.388888888889], "key": "Frequency of Letter A", "bins": [{"isTarget": 28324, "isNot": 19374}, {"isTarget": 0, "isNot": 2}, {"isTarget": 3936, "isNot": 45}, {"isTarget": 2666, "isNot": 455}, {"isTarget": 44, "isNot": 1668}, {"isTarget": 10025, "isNot": 3122}, {"isTarget": 3497, "isNot": 1605}, {"isTarget": 149, "isNot": 4314}, {"isTarget": 324, "isNot": 2711}, {"isTarget": 144, "isNot": 2936}, {"isTarget": 874, "isNot": 700}, {"isTarget": 1552, "isNot": 3542}, {"isTarget": 621, "isNot": 2624}, {"isTarget": 5, "isNot": 188}, {"isTarget": 12, "isNot": 1231}, {"isTarget": 152, "isNot": 2074}, {"isTarget": 121, "isNot": 324}, {"isTarget": 89, "isNot": 1265}, {"isTarget": 2, "isNot": 52}, {"isTarget": 73, "isNot": 1544}, {"isTarget": 14, "isNot": 79}, {"isTarget": 0, "isNot": 275}, {"isTarget": 15, "isNot": 672}, {"isTarget": 12, "isNot": 361}, {"isTarget": 0, "isNot": 24}, {"isTarget": 12, "isNot": 730}, {"isTarget": 0, "isNot": 2}, {"isTarget": 0, "isNot": 18}, {"isTarget": 0, "isNot": 219}, {"isTarget": 2, "isNot": 19}]},
	// {"format": ".2f", "maxBinCount": 44745, "min": 0, "max": 1, "ticks": [-0.001, 0.03333333333333333, 0.06666666666666667, 0.1, 0.13333333333333333, 0.16666666666666666, 0.2, 0.23333333333333334, 0.26666666666666666, 0.3, 0.3333333333333333, 0.36666666666666664, 0.4, 0.43333333333333335, 0.4666666666666667, 0.5, 0.5333333333333333, 0.5666666666666667, 0.6, 0.6333333333333333, 0.6666666666666666, 0.7, 0.7333333333333333, 0.7666666666666666, 0.8, 0.8333333333333334, 0.8666666666666667, 0.9, 0.9333333333333333, 0.9666666666666667, 1.0], "key": "Frequency of Letter F", "bins": [{"isTarget": 28068, "isNot": 44745}, {"isTarget": 6613, "isNot": 1271}, {"isTarget": 13686, "isNot": 3248}, {"isTarget": 1512, "isNot": 1436}, {"isTarget": 1589, "isNot": 589}, {"isTarget": 821, "isNot": 865}, {"isTarget": 240, "isNot": 86}, {"isTarget": 87, "isNot": 254}, {"isTarget": 27, "isNot": 38}, {"isTarget": 21, "isNot": 106}, {"isTarget": 0, "isNot": 0}, {"isTarget": 1, "isNot": 10}, {"isTarget": 0, "isNot": 1}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 12}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 1}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 1}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 2}]},
	{"format": ".2f", "maxBinCount": 14781, "min": 0, "max": 1, "ticks": [-0.001, 0.03333333333333333, 0.06666666666666667, 0.1, 0.13333333333333333, 0.16666666666666666, 0.2, 0.23333333333333334, 0.26666666666666666, 0.3, 0.3333333333333333, 0.36666666666666664, 0.4, 0.43333333333333335, 0.4666666666666667, 0.5, 0.5333333333333333, 0.5666666666666667, 0.6, 0.6333333333333333, 0.6666666666666666, 0.7, 0.7333333333333333, 0.7666666666666666, 0.8, 0.8333333333333334, 0.8666666666666667, 0.9, 0.9333333333333333, 0.9666666666666667, 1.0], "key": "Percent of Coverage (English Words)", "bins": [{"isTarget": 47, "isNot": 146}, {"isTarget": 8457, "isNot": 59}, {"isTarget": 6975, "isNot": 147}, {"isTarget": 4518, "isNot": 196}, {"isTarget": 11334, "isNot": 516}, {"isTarget": 14781, "isNot": 2054}, {"isTarget": 5233, "isNot": 3140}, {"isTarget": 1014, "isNot": 4550}, {"isTarget": 271, "isNot": 6746}, {"isTarget": 29, "isNot": 7911}, {"isTarget": 5, "isNot": 4821}, {"isTarget": 0, "isNot": 6170}, {"isTarget": 1, "isNot": 3368}, {"isTarget": 0, "isNot": 2562}, {"isTarget": 0, "isNot": 4096}, {"isTarget": 0, "isNot": 1593}, {"isTarget": 0, "isNot": 716}, {"isTarget": 0, "isNot": 1639}, {"isTarget": 0, "isNot": 518}, {"isTarget": 0, "isNot": 123}, {"isTarget": 0, "isNot": 940}, {"isTarget": 0, "isNot": 255}, {"isTarget": 0, "isNot": 47}, {"isTarget": 0, "isNot": 142}, {"isTarget": 0, "isNot": 68}, {"isTarget": 0, "isNot": 6}, {"isTarget": 0, "isNot": 70}, {"isTarget": 0, "isNot": 7}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 59}]},
	{"format": ".2f", "maxBinCount": 9438, "min": 0, "max": 4.5047064835599997, "ticks": [-0.00450470648356, 0.15015688278533332, 0.30031376557066664, 0.4504706483559999, 0.6006275311413333, 0.7507844139266666, 0.9009412967119999, 1.0510981794973333, 1.2012550622826665, 1.3514119450679998, 1.5015688278533332, 1.6517257106386665, 1.8018825934239997, 1.9520394762093332, 2.1021963589946666, 2.25235324178, 2.402510124565333, 2.5526670073506663, 2.7028238901359996, 2.8529807729213332, 3.0031376557066665, 3.1532945384919997, 3.303451421277333, 3.453608304062666, 3.6037651868479994, 3.753922069633333, 3.9040789524186663, 4.0542358352039995, 4.204392717989333, 4.354549600774666, 4.50470648356], "key": "Entropy of Characters", "bins": [{"isTarget": 0, "isNot": 6}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 7}, {"isTarget": 0, "isNot": 20}, {"isTarget": 0, "isNot": 169}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 11}, {"isTarget": 0, "isNot": 559}, {"isTarget": 0, "isNot": 719}, {"isTarget": 0, "isNot": 158}, {"isTarget": 0, "isNot": 1403}, {"isTarget": 0, "isNot": 1504}, {"isTarget": 2, "isNot": 2735}, {"isTarget": 12, "isNot": 1898}, {"isTarget": 60, "isNot": 4649}, {"isTarget": 261, "isNot": 3382}, {"isTarget": 555, "isNot": 7553}, {"isTarget": 1889, "isNot": 7161}, {"isTarget": 5099, "isNot": 6644}, {"isTarget": 8671, "isNot": 5986}, {"isTarget": 9438, "isNot": 4283}, {"isTarget": 6325, "isNot": 2508}, {"isTarget": 3841, "isNot": 1020}, {"isTarget": 4494, "isNot": 213}, {"isTarget": 5730, "isNot": 46}, {"isTarget": 4341, "isNot": 19}, {"isTarget": 1764, "isNot": 10}, {"isTarget": 183, "isNot": 2}]},
	{"format": ".0f", "maxBinCount": 17280, "min": 1, "max": 60, "ticks": [0.941, 2.966666666666667, 4.933333333333334, 6.8999999999999995, 8.866666666666667, 10.833333333333332, 12.799999999999999, 14.766666666666666, 16.733333333333334, 18.7, 20.666666666666664, 22.633333333333333, 24.599999999999998, 26.566666666666666, 28.53333333333333, 30.5, 32.46666666666667, 34.43333333333333, 36.4, 38.36666666666667, 40.33333333333333, 42.3, 44.266666666666666, 46.233333333333334, 48.199999999999996, 50.166666666666664, 52.13333333333333, 54.099999999999994, 56.06666666666666, 58.03333333333333, 60.0], "key": "Domain Length", "bins": [{"isTarget": 0, "isNot": 54}, {"isTarget": 0, "isNot": 2592}, {"isTarget": 0, "isNot": 6743}, {"isTarget": 0, "isNot": 9829}, {"isTarget": 0, "isNot": 10299}, {"isTarget": 8545, "isNot": 8444}, {"isTarget": 17280, "isNot": 5980}, {"isTarget": 8494, "isNot": 3870}, {"isTarget": 42, "isNot": 2311}, {"isTarget": 210, "isNot": 1225}, {"isTarget": 769, "isNot": 671}, {"isTarget": 2682, "isNot": 331}, {"isTarget": 9068, "isNot": 150}, {"isTarget": 4973, "isNot": 77}, {"isTarget": 552, "isNot": 40}, {"isTarget": 50, "isNot": 16}, {"isTarget": 0, "isNot": 8}, {"isTarget": 0, "isNot": 8}, {"isTarget": 0, "isNot": 5}, {"isTarget": 0, "isNot": 1}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 1}, {"isTarget": 0, "isNot": 1}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 1}, {"isTarget": 0, "isNot": 0}, {"isTarget": 0, "isNot": 8}]}
]

featuresSlide.datum(columns).call(function(featuresSlide) {
	var columns = featuresSlide.datum();

	var attributes = featuresSlide.selectAll('g.attribute').data(columns);

	var distributionPainter = attributeValueDistribution()
		.setGutters(GUTTERS)
		.setHeight(ATTRIBUTE_HEIGHT);

	attributes.enter()
		.append('g')
			.attr('class', 'attribute')
			.attr('transform', function(d, i) {
				return 'translate(0, ' + (i * (ATTRIBUTE_HEIGHT + GUTTERS) + MARGIN) + ')';
			})
		.each(distributionPainter);
});

var matrix = confusionMatrix();
var matrixData = {
	current: 0,
	features: ['Always Negative', 'Alphanumeric Frequency (All Letters)', 'Domain Length', 'Entropy of Characters', 'Percent of Coverage'],
	rows: [
		{
			features: ['Baseline (Always No)'],
			tn: 915133,
			fn: 52665,
			fp: 0,
			tp: 0,
			total: 967798
		},
		{
			features: ['Alphanumeric Frequencies'],
			tn: 908759,
			fn: 6374,
			fp: 9731,
			tp: 42934,
			total: 967798
		},
		{
			features: ['Alphanumeric Frequencies', 'Domain Length'],
			tn: 908591,
			fn: 6542,
			fp: 9581,
			tp: 43084,
			total: 967798
		},
		{
			features: ['Alphanumeric Frequencies', 'Domain Length', 'Entropy of Characters'],
			tn: 910817,
			fn: 4316,
			fp: 7802,
			tp: 44863,
			total: 967798
		},
		{
			features: ['Alphanumeric Frequencies', 'Domain Length', 'Entropy of Characters', 'Percent of Coverage'],
			tn: 912736,
			fn: 2397,
			fp: 3655,
			tp: 49010,
			total: 967798
		}
	]
}

confusionMatrixSlide.datum(matrixData).call(matrix);

var aamLayer = svg.append('g').attr('class', 'aamLayer');
aamLayer.attr('transform', 'translate(0, ' + (HEIGHT) + ')').attr('opacity', 0);

aamLayer.call(function(aamLayer) {


	var user_icon = aamLayer.append('g')
						.attr('transform', 'translate(100,'+ HEIGHT/2 + ')' )

		user_icon.attr('class', 'icon_user')
				.html(ICON_USER)
					// .attr('y', HEIGHT / 2 )
					// .attr('x', 100)
		user_icon.select('.icon_user svg')
					.style('fill', LINE_COLOR)
					.style('fill-opacity', 0.5)
					.attr('width', 100)
					.attr('height', 100)
					.attr('x', -50)
					.attr('y', -50)

		user_icon.append('text')
			.attr('font-size', 16)
			.attr('font-weight', 'bold')
			.attr('fill', LINE_COLOR)
			.attr('text-anchor', 'middle')
			.attr('dy',60)
			.text('USER');

	var end_host_icon = aamLayer.append('g')
						.attr('transform', 'translate('+ (WIDTH-100)+ ','+ HEIGHT/2 + ')' )

		end_host_icon.attr('class', 'icon_end_host')
				.html(ICON_HOST)
					// .attr('y', HEIGHT / 2 )
					// .attr('x', 100)
		end_host_icon.select('.icon_end_host svg')
					.style('fill', LINE_COLOR)
					.style('fill-opacity', 0.5)
					.attr('width', 100)
					.attr('height', 100)
					.attr('x', -50)
					.attr('y', -50)

		end_host_icon.append('text')
			.attr('font-size', 16)
			.attr('font-weight', 'bold')
			.attr('fill', LINE_COLOR)
			.attr('text-anchor', 'middle')
			.attr('dy',60)
			.text('END HOST');


	aamLayer.append('circle')
			.attr('class', 'connPt')
			.attr('cx', 200)

	aamLayer.append('circle')
			.attr('class', 'connPt')
			.attr('cx', WIDTH-200)


	aamLayer.selectAll('.connPt')
			.attr('cy', HEIGHT/2)
			.attr('r', 5)
			.attr('fill', HIGHLIGHT_COLOR)
});
/*
d3.csv(DATA_FILE, function(d, i) {
	return {
		domain: d[0],
		isFake: (d.label === "1"),
		entropy: parseFloat(d.entropy),
		length: parseInt(d.length),
		ratio: parseFloat(d.ratio),
		diff_char: parseInt(d.diff_char)
	}
}, function(error, results) {
	if (error) throw error;

	var columns = domainFeaturesPrep(results);

	console.log(JSON.stringify(columns));

	
});
*/

var stepper = presentationStepper([
	function() {
		introLayer
			.transition()
			.attr('transform', 'translate(0, ' + (HEIGHT) + ')')
			.attr('opacity', 0);

	},
	function() {
		circadianLayer
			.transition()
			.attr('transform', 'translate(0, ' + (HEIGHT) + ')')
			.attr('opacity', 0);

		introLayer
			.transition()
			.attr('transform', 'translate(0, 0)').attr('opacity', 1);
	},
	function() {
		introLayer
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')').attr('opacity', 0);

		circadian.setKey('auth', true);

		circadianLayer
			.transition()
			.attr('transform', 'translate(0, 0)')
			.attr('opacity', 1);

		circadian.setKey('auth', false);
	},
	function() {
		circadian.setKey('accountDomain', true);
	},
	function() {
		circadian.setKey('logonType', true);
	},
	function() {
		circadian.setKey('auth', true);
		circadianLayer
			.transition()
			.attr('transform', 'translate(0, 0)')
			.attr('opacity', 1);

		variablesLayer
			.transition()
			.attr('transform', 'translate(0, ' + (HEIGHT) + ')')
			.attr('opacity', 0);	
	},
	function() {
		circadianLayer
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')')
			.attr('opacity', 0);

		variablesLayer
			.transition()
			.attr('transform', 'translate(0, 0)')
			.attr('opacity', 1);

		intrigueLayer
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')')
			.attr('opacity', 0);
	},
	function() {
		variablesLayer
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')')
			.attr('opacity', 0);

		intrigueLayer
			.transition()
			.attr('transform', 'translate(0, 0)')
			.attr('opacity', 1);

		pivotLayer
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')')
			.attr('opacity', 0);
	},
	function() {
		intrigueLayer
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')')
			.attr('opacity', 0);

		pivotLayer
			.transition()
			.attr('transform', 'translate(0, 0)')
			.attr('opacity', 1);

		heatmapLayer
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')')
			.attr('opacity', 0);
	},
	function() {
		pivotLayer
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')')
			.attr('opacity', 0);

		heatmapLayer
			.transition()
			.attr('transform', 'translate(0, 0)')
			.attr('opacity', 1);

		heatmap.toggleClusters(['1','2','3','4','5']);
		heatmap.toggleFocus(null);
		heatmap.draw();
	},
	function() {
		heatmap.toggleClusters(['1']);
		heatmap.toggleFocus('1');
		heatmap.draw();
	},
	function() {
		heatmap.toggleClusters(['3']);
		heatmap.toggleFocus('3');
		heatmap.draw();
	},
	function() {
		heatmap.toggleClusters(['4']);
		heatmap.toggleFocus('4');
		heatmap.draw();
	},
	function() {
		heatmap.toggleClusters(['2']);
		heatmap.toggleFocus('2');
		heatmap.draw();
	},
	function() {
		heatmap.toggleClusters(['5']);
		heatmap.toggleFocus('5');
		heatmap.draw();

		heatmapLayer
			.transition()
			.attr('transform', 'translate(0, 0)').attr('opacity', 1);
	},
	function() {
		heatmapLayer
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')').attr('opacity', 0);
		
		aamSlide
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')').attr('opacity', 0);
	},
	function() {
		aamSlide
			.transition()
			.attr('transform', 'translate(0, 0)').attr('opacity', 1);

		aamLayer
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')').attr('opacity', 0);
	},
	function(){
		aamSlide
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')').attr('opacity', 0);

		aamLayer
			.transition()
			.attr('transform', 'translate(0, 0)').attr('opacity', 1);

		aamodel(1);

	},
	function(){
		aamodel(2);
	}, 
	function(){
		aamodel(3);
	}, 
	function(){
		aamodel(4);
	}, 
	function(){
		aamodel(5);

		titleSlide
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')').attr('opacity', 0);
	 }, 
	function() {

		aamLayer
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')').attr('opacity', 0);

		titleSlide
			.transition()
			.attr('transform', 'translate(0, 0)').attr('opacity', 1);

		sampleDomainSlide
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')').attr('opacity', 0);
	},
	function() {
		titleSlide
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')').attr('opacity', 0);

		sampleDomainSlide
			.transition()
			.attr('transform', 'translate(0, 0)').attr('opacity', 1);

		featuresSlide
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')').attr('opacity', 0);
	},
	function() {
		sampleDomainSlide
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')').attr('opacity', 0);

		featuresSlide
			.transition()
			.attr('transform', 'translate(0, 0)').attr('opacity', 1);

		confusionMatrixSlide
			.transition()
			.attr('transform', 'translate(0, ' + HEIGHT + ')').attr('opacity', 0);
	},
	function() {
		featuresSlide
			.transition()
			.attr('transform', 'translate(0, ' + (-HEIGHT) + ')').attr('opacity', 0);

		confusionMatrixSlide
			.transition()
			.attr('transform', 'translate(0, 0)').attr('opacity', 1);

		matrix.setRow(0);
	},
	function() {
		matrix.setRow(1);
	},
	function() {
		matrix.setRow(2);
	},
	function() {
		matrix.setRow(3);
	},
	function() {
		matrix.setRow(4);
	}
])

stepper.goToStep(0);
