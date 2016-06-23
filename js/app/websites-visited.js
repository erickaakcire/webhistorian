define(["../app/utils", "../app/config", "moment"], function(utils, config, moment) {
  var visualization = {};
    
  visualization.catData = function(data, categories, callback){
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
    //get the data from different view options into the tree/flare type object
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
  //simplest view, just a count of visits
  function getVisitData(data, catObj, callback) {
    var domains = utils.countPropDomains(data, "domain");
    var maxInd = utils.lowHighNum(domains, "count", false);
    var maxD = domains[maxInd].domain;
    var maxC = domains[maxInd].count;
    $("#title").append("<h3 style=\"display:none\">You visited "+ maxD +" the most, "+ maxC +" times.</h3>");
      return callback(catObj, domains); 
  };
	//habits view needs processing to segment by day
	function getHabitData (data, catObj, callback) {
		var biggestSize = 0;
        var biggestDomain = "";
        var domains = utils.countPropDomains(data, "domain");
        var domainDay2 = [];
     	//domains object has a list of unique domains, replacing the raw count with:
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
            	});
            //} 
           }
           var startDate = utils.startDate();
		       var endDate = utils.endDate();
		       var oneDay = 24 * 60 * 60 * 1000;
	         var utcStart = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
	         var utcEnd = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
	         var diffDays = Math.ceil((utcEnd - utcStart) / oneDay) + 1;
           $("#title h2").empty();
           $("#title").append("<h2 id='viz_subtitle' style=\"display:none\">You have " + diffDays + " days in your browsing history.</h2>");
   			
           return callback(catObj, domainDay2);         
    };
    //fetch the stored categories object
    function catAsync(callback) {
    	var catStored = sessionStorage.getItem('cats');
			var catsObj = JSON.parse(catStored);
			callback(catsObj);
	}
	
	function listenDate (history, data){
		$("input#start_date").datepicker().on("changeDate", function(e)
	    { 
	    	visualization.display(history, data); 
	    	});
	
	    $("input#end_date").datepicker().on("changeDate", function(e)
	    { 
	    	visualization.display(history, data); 
	    	});
	}
	
    visualization.display = function(history, data)
    {
		  utils.clearVisualization();
		  //console.log( "visualization.display: "+ $('svg').length );
		  var change = 0;

		  listenDate(history, data);

      d3.selectAll("#viz_selector a").classed("active", false);
      d3.select("#web_visit").classed("active", true);
      vizSelected = "web_visit";

		  catAsync(function(categories) {
      //set up all the datasets
		  //console.log("catAsync " + $('svg').length);
		  var startDate = utils.startDate();
			var endDate = utils.endDate();
			var filteredData = utils.filterByDates(data, startDate, endDate);
			var datasetV = visualization.catData(filteredData, categories, getVisitData);
			var datasetH = visualization.catData(filteredData, categories, getHabitData);
			
			//constant visual elements
			$("#visual_div").height($("#visual_div").width());
	        var r = $("#visual_div").height(),
	            format = d3.format(",d"),
	            fill = d3.scale.category20();
	
	        var bubble = d3.layout.pack()
	            .sort(null)
	            .size([r, r])
	            .padding(1.5);
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
			
			//console.log("append svg");
			var vis = d3.select("#visual_div").append("svg")
	            .attr("width", r)
	            .attr("height", r)
	            .attr("class", "bubble")
	            .attr("id", "visualization");
	            
	        function showVisits(){
      			habits = 0;
      			change = 1;
	        	var numDomains = utils.countUniqueProperty(data, "domain");
				    $("#title").prepend("<h1 id='viz_title'>What websites do you visit most?");
				    //var h3txt = "<h3 id='viz_subtitle'>"+ numDomains + " websites visited from " + moment(startDate).format('MMM D, YYYY') + " to: " + moment(endDate).format('MMM D, YYYY') +"</h3>";
				    //$("#title").append(h3txt);
	       		$("#above_visual").html("<div class=\"btn-group\" data-toggle=\"buttons\"> <label class=\"btn btn-primary active\"> <input type=\"radio\" name=\"options\" id=\"visits\" autocomplete=\"off\" checked> All Visits  </label> <label class=\"btn btn-primary\"> <input type=\"radio\"name=\"options\" id=\"habits\" autocomplete=\"off\"> Daily Habits  </label></div><br/><p>Click a circle to highlight. Doublle click to un-highlight.");
				    changeBubble(datasetV);
	        }
	        function showHabits (){
	        	habits = 1;
	        	change = 1;
	        	$("#title h2").show();
				    $("#title").prepend("<h1 id='viz_title'>What websites do you visit regularly?</h1>");
				    $("#above_visual").html("<div class=\"btn-group\" data-toggle=\"buttons\"> <label class=\"btn btn-primary\"> <input type=\"radio\" name=\"options\" id=\"visits\" autocomplete=\"off\"> All Visits  </label> <label class=\"btn btn-primary active\"> <input type=\"radio\"name=\"options\" id=\"habits\" autocomplete=\"off\" checked> Daily Habits  </label></div><br/><p>Click a circle to highlight. Doublle click to un-highlight.");
				    changeBubble(datasetH);
	        }
	        
	        //default option
	        if (change === 0){
	        	var habits = 0;
		        $("#title h1").empty();
				    //$("#title h2").show();
				    $("#above_visual").empty();
				    showHabits();
	        }

	        //listen for changes in dataset
	        function listenView(){
		        $("input[name='options']").on("change", function () {
			        if (this.id === "habits"){
			        	$("#title h1").empty();
			        	$("#title h2").show();
			        	$("#title h3").hide(); 
			        	$("#above_visual").empty();
			        	showHabits();
			        }
			        else if (this.id === "visits")  {
			        	$("#title h1").empty();
			        	$("#title h2").hide();
			        	$("#title h3").show();
			        	$("#above_visual").empty();
						showVisits();
			        }
			    });
	        }
	        listenView();

    		//update function
    		function changeBubble(dataset) {
				//console.log( "changeBubble: "+ $('svg').length );
    			listenView();
    			//listenDate(history, data);//needs history,data?
		       var siteClasses = utils.classes(dataset);//dataset
		        
		       var node = vis.selectAll(".node")
		         .data(bubble.nodes(siteClasses)//from dataset
		         .filter(function (d) {
		           return !d.children;
		          }),function(d) {return d.className;});

				   var nodeEnter = node.enter()
			        .append("g")
			        .attr("class", "node")
			        .attr("transform", function (d) {
			            return "translate(" + d.x + "," + d.y + ")";
			        });
		       nodeEnter
		        	.append("circle")
		            .attr("r", function (d) {
		                return d.r;
		            })
		            .style("fill", function (d) {
		                return fill(d.packageName);
		            })
		            .on("click", function (d){
		            	d3.select(this).style({fill: "yellow", stroke: "#a6a6a6", "stroke-width": "2px"});
		            })
		            .on("dblclick", function(d){
		            	d3.select(this).style("fill", function (d) { return fill(d.packageName); });
		            	d3.select(this).style("stroke-width", "0px");
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
				      	});
		
		          nodeEnter
		          	.append("text")
		          	.attr("pointer-events", "none")
		            .attr("text-anchor", "middle")
		            .attr("dy", ".3em")
		            .text(function (d) {
		            	return d.className.substring(0, d.r / 3);
		        	});
				
			    node.transition().attr("class", "node")
			        .transition().duration(5000)
			        .attr("transform", function (d) {
				        return "translate(" + d.x + "," + d.y + ")";
				    });
			    node.select("circle")
			        .transition().duration(2000)
			        .attr("r", function (d) {
			             return d.r;
			        });
			    node.select("text")
			        .transition().duration(5000)
			        .attr("text-anchor", "middle")
		            .attr("dy", ".3em")
		            .text(function (d) {
		            	return d.className.substring(0, d.r / 3);
		            });
				node.exit().remove();
		  }
	  });
  };
    return visualization;
});
