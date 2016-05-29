define(["../app/utils", "moment"], function(utils, moment) {
    var visualization = {};
    
    //default view
    var habits = 0;
    var change = 0;
    
    visualization.catData = function(data, categories, callback){
    	utils.clearVisualization();
    	
    	var specified = []; //domainExact
	   	var domS = []; //domainSearch - not yet implemented
	   	var top = []; //topDomainExact
    	
    	for (var i in categories){
	   		if (categories[i].search === "domainExact"){
	   			specified.push({domain: categories[i].value, category: categories[i].category});
	   		}
	   		else if (categories[i].search === "domainSearch") {
	   			domS.push({value: categories[i].value, category: categories[i].category});
	   		}
	   		else if (categories[i].search === "topDomainExact") {
	   			top.push({value: categories[i].value, category: categories[i].category});
	   		}
	   	}
	   	var catU = utils.countsOfProperty(categories, "category");
	   	
	   	var catObj = {specified: specified, domS: domS, top: top, catU: catU};
	   	
    	return callback(data, catObj, intoData);
    };
    
    function intoData (catObj, domains) {
    	var realData = {name: "Domains", children: []};
	   	for (var i in catObj.catU) {
	   		realData.children.push({
	   			name: catObj.catU[i].counter,
	   			children: []
	   		});
	   	}
	   	for (var count in domains) {
	   		var domainName = domains[count].domain;
            var size = domains[count].count;
            var topD = domains[count].topD;
	   		if (utils.objContains(catObj.specified,"domain",domainName)) {
	   			for (var i in catObj.specified) {
	   				if (domainName === catObj.specified[i].domain) {
	   					var catId = utils.findIndexByKeyValue(realData.children, "name", catObj.specified[i].category);
	   					realData.children[catId].children.push({name: domainName, size: size});
	   				}
	   			}
	   		} //domainSearch - catObj.domS logic goes here
	   		else if (utils.objContains(catObj.top,"value",topD)){
	   			for (var i in catObj.top) {
	   				if(topD === catObj.top[i].value) {
	   					var catId = utils.findIndexByKeyValue(realData.children, "name", catObj.top[i].category);
	   					realData.children[catId].children.push({name: domainName, size: size});
	   				}
	   			}
	   		}
	   		else { 
	   			var catId1 = utils.findIndexByKeyValue(realData.children, "name", "Other");
	   			realData.children[catId1].children.push({name: domainName, size: size}); 
	   		}
	   	}
	   return realData;	
    }
    
    function getVisitData(data, catObj, callback) {
	    var domains = utils.countPropDomains(data, "domain");
        return callback(catObj, domains); 
    };

	function getHabitData (data, catObj, callback) {
		var biggestSize = 0;
        var biggestDomain = "";
        var domains = utils.countPropDomains(data, "domain");
        var domainDay2 = [];
     	//domains object has unique domains, not using the count for this
        
        for (var i = 0; i < domains.length; i++) {
            var domainDay1 = [];
            var currentDomain = domains[i].domain;
            var currentTopD = domains[i].topD;

            //find the array indexes of the domain in data
            for (var j = 0; j < data.length; j++){
              if (currentDomain === data[j].domain){

                var newDate = new Date(data[j].date);
                var day = ("0" + newDate.getDate()).slice(-2);
                var month = ("0" + (newDate.getMonth() + 1) ).slice(-2);
                var date = newDate.getFullYear() + "/" + month + "/" + day;

                if (domainDay1.indexOf(date) < 0){
                  domainDay1.push(date);
                }
              }
            }
            var size = domainDay1.length;
            
            if (size >= biggestSize){
              biggestSize = size;
              biggestDomain = currentDomain;
            }
			
            //if (size >= 2){
            	//push into domains
            	domainDay2.push({
            		"domain": currentDomain,
            		"count": size,
            		"topD": currentTopD
            //	});
            }); // if if exists just }
           }
           var startDate = utils.startDate();
		   var endDate = utils.endDate();
		   var oneDay = 24 * 60 * 60 * 1000;
	       var utcStart = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
	       var utcEnd = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
	       var diffDays = Math.ceil((utcEnd - utcStart) / oneDay);
           
           d3.select("#title").append("h2").text("You visited " + biggestDomain + " the most for " + biggestSize + " days out of " + diffDays + ". (" + Math.round(biggestSize / diffDays * 100) + "%)");
   			
        return callback(catObj, domainDay2);         
    };
    
    function catAsync(callback) {
		var cats = [];
	   	$.getJSON('https://dl.dropboxusercontent.com/u/3755456/categories.json', function (cat) {		  
	        for (var j in cat.children) {
				cats.push({search: cat.children[j]["search"], category: cat.children[j]["category"], value: cat.children[j]["value"]});
			}
		
        }).fail(function(){
        	console.log("Error! JSON file not found or invalid formatting");
        	cats.push({search: "domainExact", category: "Other", value: " "});
        	callback(cats);
        }).done(function() {
    		callback(cats);
  		});
	}
    
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

		catAsync(function(categories) {
		    
		    var startDate = utils.startDate();
			var endDate = utils.endDate();
			var filteredData = utils.filterByDates(data, startDate, endDate);

			var numDomains = utils.countUniqueProperty(data, "domain");
			
			if (habits === 0) {
				var dataset = visualization.catData(filteredData, categories, getVisitData);
				d3.select("#title").append("h1").text("What websites do you visit most?").attr("id", "viz_title");
				d3.select("#title").append("h2").text(numDomains + " websites visited from " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY")).attr("id", "viz_subtitle");
	       		$("#above_visual").html("<div class=\"btn-group\" data-toggle=\"buttons\"> <label class=\"btn btn-primary active\"> <input type=\"radio\" name=\"options\" id=\"visits\" autocomplete=\"off\" checked> All Visits  </label> <label class=\"btn btn-primary\"> <input type=\"radio\"name=\"options\" id=\"habits\" autocomplete=\"off\"> Daily Habits  </label></div>");
				
	        	} else if (habits === 1) {
				var dataset = visualization.catData(filteredData, categories, getHabitData);
				$("#title").prepend("<h1>What websites do you visit regularly</h1>");
				//d3.select("#title").prepend("h1").text("What websites do you visit regularly?").attr("id", "viz_title");
				//d3.select("#title").append("h2").text("You visited " + "biggestDomain" + " the most for " + "biggestSize" + " days out of " + diffDays + ". (" "+ Math.round(biggestSize / diffDays * 100)" + "%)");
				$("#above_visual").html("<div class=\"btn-group\" data-toggle=\"buttons\"> <label class=\"btn btn-primary\"> <input type=\"radio\" name=\"options\" id=\"visits\" autocomplete=\"off\"> All Visits  </label> <label class=\"btn btn-primary active\"> <input type=\"radio\"name=\"options\" id=\"habits\" autocomplete=\"off\" checked> Daily Habits  </label></div>");
			}

	        
		    $("input[name='options']").on("change", function () {
		        if (this.id === "habits"){
		        	habits = 1;
		        	change = 1;
		        	visualization.display(history, filteredData);
		        }
		        else if (this.id === "visits")  {
		        	habits = 0;
		        	change = 1;
		        	visualization.display(history, filteredData);
		        }
		    });
    

			$("#visual_div").height($("#visual_div").width());
	        var r = $("#visual_div").height(),
	            format = d3.format(",d"),
	            fill = d3.scale.category20();
	
	        var bubble = d3.layout.pack()
	            .sort(null)
	            .size([r, r])
	            .padding(1.5);
	            
	        var siteClasses = utils.classes(dataset);//dataset
	            
	        var vis = d3.select("#visual_div").append("svg")
	            .attr("width", r)
	            .attr("height", r)
	            .attr("class", "bubble")
	            .attr("id", "visualization");
	
	        var tooltip = d3.select("body")
			    .append("div")
			    .style("position", "absolute")
			    .style("z-index", "10")
			    .style("visibility", "hidden")
			    .style("color", "white")
			    .style("padding", "8px")
			    .style("background-color", "rgba(0, 0, 0, 0.75)")
			    .style("border-radius", "6px")
			    .style("font", "12px sans-serif")
			    .text("tooltip");
	        
	        var node = vis.selectAll("g.node")
	            .data(bubble.nodes(siteClasses)//from dataset
	                .filter(function (d) {
	                    return !d.children;
	                }))
	            .enter().append("g")
	            .attr("class", "node")
	            .attr("transform", function (d) {
	                return "translate(" + d.x + "," + d.y + ")";
	            });
	
	        node.append("circle")
	            .attr("r", function (d) {
	                return d.r;
	            })
	            .style("fill", function (d) {
	                return fill(d.packageName);
	            })
	            .on("mouseover", function(d) {
		              if (habits===0){
		              	tooltip.text(d.className + ", Visits: " + format(d.value) + ", Category: " + d.packageName);
		              }
		              else if (habits===1){
		              	tooltip.text(d.className + ", Days: " + format(d.value) + ", Category: " + d.packageName);
		              }
		              
		              tooltip.style("visibility", "visible");
		          })
			      
			      .on("mousemove", function() {
			          return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
			      })
			      .on("mouseout", function(){
			      	return tooltip.style("visibility", "hidden");
			      	})
	            ;
	
	        node.append("text")
	            .attr("text-anchor", "middle")
	            .attr("dy", ".3em")
	            .text(function (d) {
	            return d.className.substring(0, d.r / 3);
            })
            	.on("mouseover", function(d) {
            		if(habits===0){
            			tooltip.text(d.className + ", Visits: " + format(d.value) + ", Category: " + d.packageName);
            		}
            		else if (habits===1){
            			tooltip.text(d.className + ", Days: " + format(d.value) + ", Category: " + d.packageName);
            		}
		              
		              tooltip.style("visibility", "visible");
			      })
			     .on("mousemove", function() {
			          return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
			      })
			     .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
			     ;
		});
    };
    
    return visualization;
});
