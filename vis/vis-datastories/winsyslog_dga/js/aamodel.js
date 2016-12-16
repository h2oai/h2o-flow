var aam_data = [ 	{source:1, times:10}, 
					{source:2, times:11},
					{source:3, times:12}, 
					{source:4, times:9},
					{source:5, times:2}]

var HIGHLIGHT_COLOR = '#00aaff',
	TEXT_COLOR = 'rgba(255,255,255, 1)',
	LINE_COLOR = 'rgba(255,255,255, 1)'

var ICON_PC = '<svg fill="#fff" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>'
	ICON_USER = '<svg fill="#fff" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
	ICON_HOST = '<svg fill="#fff" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"/></svg>'

var aamodel = function (n){

	var sources = aamLayer.selectAll('g.source')
					.data(aam_data.filter(function(d){ return d.source <= n}));

	var connLines = aamLayer.selectAll('g.connLines')
			.data(aam_data.filter(function(d){ return d.source <= n}))
		
	connLines.enter().append('g')
			.attr('class', 'connLines')
			.each(function(d){

				d3.select(this).append('line')
					.attr('class', 'left_lines')
					.attr("x1", 200)
					.attr("x2", WIDTH/2-200)

				d3.select(this).append('line')
					.attr('class', 'right_lines')
					.attr("x1", WIDTH-200)
					.attr("x2", WIDTH/2+ 250)

				d3.select(this).selectAll('line')
					.style('stroke', LINE_COLOR )
					.style('stroke-width', 1)
					.attr('opacity', 0)
			})


	sources.enter()
		.append('g')
			.attr('class', 'source')
		.each(function(d){

			d3.select(this)
				.attr('transform', 'translate(' + WIDTH/2 + ', ' + HEIGHT + ')').attr('opacity', 0)

			d3.select(this).append("g")
				   .attr('class', 'icon_pc')
				   .html(ICON_PC)

			d3.select(this).select('g.icon_pc svg')
					.attr('fill', LINE_COLOR)
					.attr('fill-opacity', 0.5)
				  	.attr('width', 100)
				   	.attr('height', 100)
				   	.attr('x', -120)
				    .attr('y', -50)

			d3.select(this).append('text')
				.attr('class', 'caption_time')
				.text(function(d) { return d.times })
				.attr('font-size', 72)
				.attr('font-weight', 'bold')
				.attr('fill', TEXT_COLOR )
				.attr('dy', 16)

			d3.select(this).append('text')
				.attr('class', 'static')
				.text('TIMES')
				.attr('font-size', 16)
				.attr('fill', TEXT_COLOR )
				.attr('fill-opacity', 0.5)
				.attr('dx', 100)
				.attr('dy', 16)

			d3.select(this).append('text')
				.attr('class', 'caption_source')
				.text(function(d){ return "SOURCE " + d.source })
				.attr('font-size', 16)
				.attr('font-weight', 'bold')
				.attr('fill', TEXT_COLOR )
				.attr('fill-opacity', 0.5)
				.attr('dy', 64)
				.attr('dx', -110)
				
		})

		sources.transition()
					.attr('transform', function(d){
						return 'translate(' + WIDTH/2 + ', ' + HEIGHT / (n+1) * d.source + ')'
					})
					.attr('opacity', 1)

		sources.selectAll('text')
			.transition()
				.style('fill', function(d){ if (d.source == n ) { return HIGHLIGHT_COLOR }})

		sources.selectAll('.icon_pc')
			.transition()
			.each(function(d){
				d3.select(this).select('svg').style('fill', function(d){ if (d.source == n ) { return HIGHLIGHT_COLOR }})
			})	

		connLines.selectAll('line')
			.transition()
				.attr("y1", HEIGHT/2)
				.attr("y2", function(d){ return  HEIGHT / (n+1) * d.source })
				.attr('opacity', 0.5)
				.style('stroke', function(d){ if (d.source == n ) { return HIGHLIGHT_COLOR } else {return  LINE_COLOR } })


	sources.exit().remove();
	connLines.exit().remove();

}