define(["../app/utils", "moment"], function(utils, moment) {
    var visualization = {};
    
    visualization.getVisitData = function(data, categories) {
		    console.log("categories "+categories);
		    console.log("domain"+domain);
		    var domains = utils.countsOfProperty(data, "domain");
		    var catU = utils.countsOfProperty(categories, "category");
		    console.log(catU.length + " " + domains.length);
		   	
        
	        for (var i = 0; i < domains.length; i++) {
	            var hit = 0;
	            var domain = domains[i].counter;
	            var size = domains[i].count;
	            
	            //urlExact, domainExact,  topDomainExact, domainSearch
	            
	            //if (utils.contains(specified, domain)) {
	            //	console.log(domain);
	            //}
	         }

	            
	        var dataFake = (		{
	            name: "Domains", children: 
	            [
	                {
	                	name: "Blog", 
	                	children: [
	                	{name: "wordpress.com", size: 15},
	                	{name: "blogspot.com", size: 5}
	                	], 
	                },
	                {
	                	name: "Video", 
	                	children: [
	                	{name: "youtube.com", size: 124},
	                	{name: "hulu.com", size: 2}
	                	]
	                }
	            ]
	        });
	         
	        
	        return dataFake; 
	    };

	function catAsync(callback) {
		var cats = [];
	   	$.getJSON('https://dl.dropboxusercontent.com/u/3755456/categories.json', function (cat) {		  
	        for (var j in cat.children) {
				cats.push({search: cat.children[j]["search"], category: cat.children[j]["category"], value: cat.children[j]["value"]});
			}
		callback(cats);
        });
	}
    
    visualization.compileHabitData = function(data) {
    	var biggestSize = 0;
        var biggestDomain = "";
		//to do
    };
    
    visualization.display = function(history, data)
    {
        $("input#start_date").datepicker().on("changeDate", function(e)
        {
            visualization.display(history, data);
        });

        $("input#end_date").datepicker().on("changeDate", function(e)
        {
            visualization.display(history, data);
        });

        d3.selectAll("#viz_selector a").classed("active", false);
        d3.select("#web_visit").classed("active", true);
        vizSelected = "web_visit";

        utils.clearVisualization();
        utils.clearOptions();

		catAsync(function(categories) {
		    console.log("these are the categories: "+categories);
		    
		    var startDate = utils.startDate();
			var endDate = utils.endDate();
			var filteredData = utils.filterByDates(data, startDate, endDate);
			var dataset = visualization.getVisitData(filteredData, categories);
                
	        var numDomains = utils.countUniqueProperty(data, "domain");
	        
	        d3.select("#title").append("h1").text("What websites do you visit?").attr("id", "viz_title");
	        
	        d3.select("#title").append("h2").text(numDomains + " websites visited from " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY")).attr("id", "viz_subtitle");
	        $("#above_visual").html("<div class=\"btn-group\" data-toggle=\"buttons\"> <label class=\"btn btn-primary active\"> <input type=\"radio\" name=\"options\" id=\"visits\" autocomplete=\"off\" checked> All Visits  </label> <label class=\"btn btn-primary\"> <input type=\"radio\"name=\"options\" id=\"habits\" autocomplete=\"off\"> Daily Habits  </label></div>");
	        d3.select("#below_visual").append("p").text("A larger circle means that the website was visited more.").attr("id", "viz_p");
	
			$("#visual_div").height($("#visual_div").width());
	
	        var r = $("#visual_div").height(),
	            format = d3.format(",d"),
	            fill = d3.scale.category20();
	
	        var bubble = d3.layout.pack()
	            .sort(null)
	            .size([r, r])
	            .padding(1.5);
	            
	        var siteClasses = utils.classes(dataset);
	            
	        var vis = d3.select("#visual_div").append("svg")
	            .attr("width", r)
	            .attr("height", r)
	            .attr("class", "bubble")
	            .attr("id", "visualization");
	
	        var node = vis.selectAll("g.node")
	            .data(bubble.nodes(siteClasses)
	                .filter(function (d) {
	                    return !d.children;
	                }))
	            .enter().append("g")
	            .attr("class", "node")
	            .attr("transform", function (d) {
	                return "translate(" + d.x + "," + d.y + ")";
	            });
	
	        node.append("title")
	            .text(function (d) {
	                return d.className + ": " + format(d.value);
	            });
	
	        node.append("circle")
	            .attr("r", function (d) {
	                return d.r;
	            })
	            .style("fill", function (d) {
	                return fill(d.packageName);
	            });
	
	        node.append("text")
	            .attr("text-anchor", "middle")
	            .attr("dy", ".3em")
	            .text(function (d) {
	            return d.className.substring(0, d.r / 3);
            });
		});
    };
    
    return visualization;
});
