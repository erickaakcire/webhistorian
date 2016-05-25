define(["../app/utils", "moment"], function(utils, moment) {
    var visualization = {};
    
    visualization.getVisitData = function(data, categories) {
	    var domains = utils.countsOfProperty(data, "domain");
	    var catU = utils.countsOfProperty(categories, "category");
	   	var realData = {name: "Domains", children: []};
	   	for (var i in catU) {
	   		realData.children.push({
	   			name: catU[i].counter,
	   			children: []
	   		});
	   	}
	   	var specified = [];
	   	for (var i in categories){
	   		if (categories[i].search === "domainExact"){
	   			specified.push({domain: categories[i].value, category: categories[i].category});
	   		}
	   		else {console.log(categories[i]);}
	   		//urlExact, topDomainExact, domainSearch
	   	}
	   	for (var count in domains) {
	   		var domainName = domains[count].counter;
            var size = domains[count].count;
	   		if (utils.objContains(specified,"domain",domainName)) {
	   			for (var i in specified) {
	   				if (domainName === specified[i].domain) {
	   					var catId = utils.findIndexByKeyValue(realData.children, "name", specified[i].category);
	   					realData.children[catId].children.push({name: domainName, size: size});
	   				}
	   				
	   			}
	   		}
	   		else {
	   					//var catId1 = utils.findIndexByKeyValue(realData.children, "name", "Other");
	   					realData.children[0].children.push({name: domainName, size: size});
	   				}
	   	}

        return realData; 
    };

	function catAsync(callback) {
		var cats = [];
	   	$.getJSON('https://dl.dropboxusercontent.com/u/3755456/categories.json', function (cat) {		  
	        for (var j in cat.children) {
				cats.push({search: cat.children[j]["search"], category: cat.children[j]["category"], value: cat.children[j]["value"]});
			}
		
        }).fail(function(){
        	console.log("error JSON file not found!");
        	cats.push({search: "domainExact", category: "Other", value: " "});
        	callback(cats);
        }).done(function() {
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
