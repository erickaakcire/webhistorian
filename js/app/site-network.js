define(["../app/utils", "moment"], function(utils, moment) 
{
    var visualization = {};
        
    visualization.display = function(history, data) 
    {
        utils.clearVisualization();
        utils.clearOptions();

        $("input#start_date").datepicker().on("changeDate", function(e)
        {
            visualization.display(history, data);
        });

        $("input#end_date").datepicker().on("changeDate", function(e)
        {
            visualization.display(history, data);
        });

        var startDate = utils.startDate();
        var endDate = utils.endDate();
        
        var filteredData = utils.filterByDates(data, startDate, endDate);

        var allEdges = [];
        var uniqueEdges = [];
        var edgeList = [];
        var sorted = [];

		var idMap = {};

// id
        for (var i = 0; i < filteredData.length; i++) {
            var dataItem = filteredData[i];
//            console.log('DATA: ' + JSON.stringify(dataItem, 2));
            
            var refId = dataItem.id;
                        
            idMap["" + refId] = i;
		}

        for (var i = 0; i < filteredData.length; i++) 
        {
            var dataItem = filteredData[i];
            var refId = dataItem.refVisitId;
            var id = dataItem.id;
            var domain = dataItem.domain;
            var protocol = dataItem.protocol;
            var transition = dataItem.transType;
            var refIdInd = idMap["" + refId]; // findIndexByKeyValue(fullData, "id", refId);

            if (refIdInd !== undefined && refId !== "0") 
            {
                var refDomain = filteredData[refIdInd].domain;
                var refProtocol = filteredData[refIdInd].protocol;
                
                if (domain != refDomain && refDomain != null && refDomain != "" && domain != "" && domain != null) 
                {
                    allEdges.push({sort: refDomain + domain, source: refDomain, target: domain});
                }
            }
        }

        sorted = allEdges.sort(function(a, b) 
        {
			if (a.sort < b.sort)
				return -1;
			if (a.sort > b.sort)
				return 1;
			return 0;
		});
		
        totalLinks = allEdges.length + 1;

        var countEdges = 1;

        for (var j = 0; j < sorted.length; j++) {
            var sortedItem = sorted[j];
            var countThing = sorted[j].sort;
            var sourceItem = sorted[j].source;
            var targetItem = sorted[j].target;
            var nextCountThing = "";
            if (j < sorted.length - 1) {
                nextCountThing = sorted[j + 1].sort;
            }
            if (countThing === nextCountThing) {
                countEdges++;
            }
            else {
                edgeList.push({source: sourceItem, target: targetItem, value: countEdges});
                //console.log(sourceItem, targetItem, countEdges);
                countEdges = 1;
            }
        }

// ---------------->

        // Network visualization based on  http://www.d3noob.org/2013/03/d3js-force-directed-graph-example-basic.html and http://bl.ocks.org/mbostock/3750558
        // temporary labeling fix: if node has more than two edges (in or out) show label, otherwise hover for label

        d3.select("#" + history.timeSelection).classed("active", true);
        var numSites = edgeList.length + 1;

        d3.select("#title").append("h1").text("How did you get there?").attr("id", "viz_title");
        d3.select("#title").append("h2").text(totalLinks + " links between " + numSites + " websites from: " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY"));
        d3.select("#below_visual").append("p").text("This is a network based on how you navigate to the websites you visit. There is a link between two websites if you click on a link from one to the other. Drag to move websites to a fixed position. Double click to release the dragged website back to the normal layout.").attr("id", "viz_p");

        var nodes = {};
        var edgesMaxValue = 0;

        // Compute the distinct nodes from the links.
        edgeList.forEach(function (link) {
            link.source = nodes[link.source] ||
            (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] ||
            (nodes[link.target] = {name: link.target});
            link.value = +link.value;
            if (edgesMaxValue < link.value) {
                edgesMaxValue = link.value;
            }
        });

        var width = $("#visual_div").width();
        var height = width;

		$("#visual_div").height(height);
		// $("#visual_div").css("border", "thin solid red");
		
        var force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(edgeList)
            .size([width, height])
            .linkDistance(90)
            .charge(-350)
            .gravity(0.05)
            .on("tick", tick)
            .start();

        var svg = d3.select("#visual_div").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "visualization");

        var drag = force.drag().on("dragstart", dragstart);

        function dblclick(d) {
            d3.select(this).classed("fixed", d.fixed = false);
        }

        function dragstart(d) {
            d3.select(this).classed("fixed", d.fixed = true);
        }

        // build the arrow.
        svg.append("svg:defs").selectAll("marker")
            .data(["end"])      // Different link/path types can be defined here
            .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 17)
            .attr("refY", -1.5)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .attr("class", "marker")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        // add the links and the arrows
        var path = svg.append("svg:g").selectAll("path")
            .data(force.links())
            .enter().append("svg:path")
            .style("userSpaceOnUse", 1.5)
            //function(d,i){ return links[i].value/(edgesMaxValue/5);}
            //    .attr("class", function(d) { return "link " + d.type; })
            .attr("class", "link")
            .attr("marker-end", "url(#end)");

        // define the nodes
        var node = svg.selectAll(".node")
            .data(force.nodes())
            .enter().append("g")
            .attr("class", "node")
            //.call(force.drag);
            .on("dblclick", dblclick)
            .call(drag);

        // add the nodes
        node.append("circle")
            .attr("r", 5)
            .attr("class", "network");
        //replace 5 with function(d, i) { return d.weight * 4;}

        // add the text
        node.append("text")
          .attr("dy", ".35em")
          .attr("text-anchor", "left")
          .attr("font-size", "10px")
            .text(function (d) {
                return d.name;
            });

        // add the curvy lines
        function tick() {
            path.attr("d", function (d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" +
                    d.source.x + "," +
                    d.source.y + "A" +
                    dr + "," + dr + " 0 0,1 " +
                    d.target.x + "," +
                    d.target.y;
            });

            node
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
        }
    };
        
    return visualization;
});
