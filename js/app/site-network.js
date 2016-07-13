define(["../app/utils", "moment", "d3-context-menu", "ion.rangeSlider"], function(utils, moment, context, rangeSlide) {
  var visualization = {};
  var startDate = null;
  var endDate = null;
  var sd = null;
  var ed = null;
  var color = d3.scale.category20c();
  var catStored = sessionStorage.getItem('cats');
  var categories = JSON.parse(catStored);
  
  var specified = []; //domainExact
  var topD = []; //topDomainExact
    
  for (var i in categories){
     if (categories[i].search === "domainExact"){
       specified.push({domain: categories[i].value, category: categories[i].category});
     }
     else if (categories[i].search === "topDomainExact") {
       topD.push({value: categories[i].value, category: categories[i].category});
     }
   }
  
  function datesOrig(){
    var seStored = JSON.parse(sessionStorage.getItem('se'));
    sd = seStored[0].start;
    ed = seStored[0].end;
    endDate = new Date (ed);
    //startDate = new Date (sd); //start with full dataset
    
    startDate = new Date (  
        endDate.getFullYear(),  
        endDate.getMonth(),  
        (endDate.getDate()-7)  
    );//start with most recent week
  }

  visualization.display = function(history, data) {
    if(startDate===null){ datesOrig(); }
    data = utils.sortByProperty(data,"date");

    var filteredData = utils.filterByDates(data, startDate, endDate);

    var allEdges = [];
    var uniqueEdges = [];
    var edgeList = [];
    var sorted = [];
    
    var menu = [
        {
            title: 'View in Data Table',
            action: function(d) {
              //filter the dataset to just the domain of the object
              var all = history.fullData;
              var dv = [];
              for (var i in all){
                var domain = all[i].domain;
                var item = all[i];
                if (domain === d.__data__.name){
                  dv.push(item);
                }
              }
              requirejs(["../app/data-table"], function(data_table) {
                data_table.display(history, dv, "");
                $("#viz_title").html("All Visits to " + d.__data__.name);
              });
            },
        },
        {
            title: 'Permanently Delete',
            action: function(d) {
              if (confirm('Do you want to PERMANENTLY remove ALL visits to URLs from '+d.__data__.name+' from your local browser history?')) {
                //filter the dataset to just the domain of the object
                var all = utils.sortByProperty(history.fullData,"url");
                var newHist = [];
                var removal = [];
                var vc = 1;
                all.forEach(function (a,b) {
                  if (a.domain === d.__data__.name){
                    if(a.url != b.url){
                      removal.push({url: a.url, visitCount: vc});
                    } else {
                      vc = vc+1;
                    }
                  }
                  else {
                    newHist.push(a);
                  }
                });
                utils.removeHistory(removal);
                
                history.fullData = utils.sortByProperty(newHist,"date");
                visualization.display(history, history.fullData);
              }
            }
        }
    ]

    for (var i = 0; i < filteredData.length; i++) {
      var dataItem = filteredData[i];
      var domain = dataItem.domain;
      var transition = dataItem.transType;
      var time = dataItem.date;

      if (transition === "link") {
        //find the chronogically previous item 
        var j = i - 1;
        var prevItem = filteredData[j];
        
        if (prevItem !== undefined) {
          var prevDomain = prevItem.domain;
          var prevTime = prevItem.date;
          var offsetSec = 5 * 60 * 100; //5 minutes in milleseconds
          var diffTime = time - prevTime;

          if (prevDomain !== domain && prevDomain !== undefined && diffTime < offsetSec) {
            allEdges.push({
              sort: prevDomain + domain,
              source: prevDomain,
              target: domain
            });
          }
        }
      }
    }

    sorted = allEdges.sort(function(a, b) {
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
      } else { //if (countEdges >= 2)
        edgeList.push({
          source: sourceItem,
          target: targetItem,
          value: countEdges
        });
        countEdges = 1;
      }
    }
    
    
    utils.clearVisualization();

    // Network visualization based on  http://www.d3noob.org/2013/03/d3js-force-directed-graph-example-basic.html and http://bl.ocks.org/mbostock/3750558

    d3.select("#" + history.timeSelection).classed("active", true);
    var numSites = edgeList.length + 1;

    d3.select("#title").append("h1").text("How did you get there?").attr("id", "viz_title");
    d3.select("#title").append("h2").text(totalLinks + " links between " + numSites + " websites");
    $("#above_visual").html("<p id='viz_a'>Drag to move website circles to a fixed position. Double click to release the dragged site. Right click for more options.</p><p><br/> <input type='text' id='slider' name='slider_name' value=''/>");
    d3.select("#below_visual").append("p").text("This is a network based on the time order of your website visits. There is a link between two websites if you visited one website before the other.").attr("id", "viz_p");
    
    $("#slider").ionRangeSlider({
      type: "double",
      min: +moment(sd).format("X"),
      max: +moment(ed).format("X"),
      from: +moment(startDate).format("X"),
      to: +moment(endDate).format("X"),
      prettify: function (num) {
        return moment(num, "X").format("ll");
      },
      grid: false,
      grid_snap: true,
      keyboard: true,
      force_edges: true,
      onFinish: function (d) {
        var epochFrom = new Date(0);
        startDate = new Date (epochFrom.setUTCSeconds(d.from));
        var epochTo = new Date(0);
        endDate = new Date (epochTo.setUTCSeconds(d.to));
        var filteredD = utils.filterByDates(history.fullData, startDate, endDate);
        visualization.display(history, filteredD);
      }
    });
    
    var nodes = {};
    var edgesMaxValue = 0;
    
    function cat(domain){
      consol.log(domain);
    }

    // Compute the distinct nodes from the links.
    edgeList.forEach(function(link) {
      var catSource = "Other";
      var catTarget = "Other";
      var catIdSource = utils.findIndexByKeyValue(specified,"domain",link.source);
      var catIdTarget = utils.findIndexByKeyValue(specified,"domain",link.target);
      var sourceTopD = utils.topD(link.source);
      var targetTopD = utils.topD(link.target);
      var catIdSourceTopD = utils.findIndexByKeyValue(topD,"value",sourceTopD);
      var catIdTargetTopD = utils.findIndexByKeyValue(topD,"value",targetTopD);
      
      if (catIdSource != null){
        catSource = specified[catIdSource].category;
      } else if (catIdSourceTopD != null) {
        catSource = topD[catIdSourceTopD].category;
      }
      if (catIdTarget != null){
        catTarget = specified[catIdTarget].category;
      } else if (catIdTargetTopD != null){
        catTarget = topD[catIdTargetTopD].category;
      }
      link.source = nodes[link.source] ||
        (nodes[link.source] = {
        name: link.source,
        category: catSource
      });
      link.target = nodes[link.target] ||
        (nodes[link.target] = {
        name: link.target,
        category: catTarget
      });
      link.value = +link.value;
      if (edgesMaxValue < link.value) {
        edgesMaxValue = link.value;
      }
    });

    var width = $("#visual_div").width();
    var height = width * .7;

    $("#visual_div").height(height);

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
    
    var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(edgeList)
      .size([width, height])
      .linkDistance(30)
      .charge(function(d){
        if (d.weight > 2){
          return (-d.weight * 4) - 80;
        }
        else {return -80;}
      })
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
      .data(["end"]) // Different link/path types can be defined here
    .enter().append("svg:marker") // This section adds in the arrows
    .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", -1.5)//1.5
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
      .attr("class", "link")
      .attr("marker-end", "url(#end)");

    // define the nodes
    var node = svg.selectAll(".node")
      .data(force.nodes())
      .enter().append("g")
      .attr("class", "node")
      .on("dblclick", dblclick)
      .on("contextmenu", d3.contextMenu(menu, function(){
        tooltip.style("visibility", "hidden");
      }))
      .on("mouseover", function(d){
        tooltip.text(d.name + " Category: "+d.category);
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", function() {
        return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
      })
      .on("mouseout", function(){
    	  return tooltip.style("visibility", "hidden");
    	})
      .call(drag);

    // add the nodes
    node.append("circle")
      .attr("r", function(d) { 
        d.radius = (Math.log(d.weight) + .7) * 4;
        return d.radius;
      })
      .attr("class", "network")
      .style("fill", function(d) { return color(d.category); });

    // add the curvy lines
    function tick(e) {
      var no = d3.values(nodes);
      var q = d3.geom.quadtree(no),
          i = 0,
          n = no.length;

      while (++i < n) q.visit(collide(no[i]));
      
      path.attr("d", function(d) {
        var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
          
        // x and y distances from center to outside edge of target node
        offsetX = (dx * d.target.radius) / dr;
        offsetY = (dy * d.target.radius) / dr;
        
        placeX = (d.target.x - offsetX)
        placeY = (d.target.y - offsetY)
        
        //keep paths in the svg
        var px = Math.max(1, Math.min(width, d.source.x)); 
        var py = Math.max(1, Math.min(height, d.source.y));

        return "M" +
          px + "," +
          py + "A" +
          dr + "," + dr + " 0 0,1 " +
          + placeX + "," + placeY;
      });
      
      node
        .attr("transform", function(d) {
          //keep nodes in the svg
          var dx = Math.max(d.radius, Math.min(width - d.radius, d.x))
          var dy = Math.max(d.radius, Math.min(height - d.radius, d.y))
          return "translate(" + dx + "," + dy + ")";
        });
    }
    
    function collide(node) {
      var r = node.radius + 16,
          nx1 = node.x - r,
          nx2 = node.x + r,
          ny1 = node.y - r,
          ny2 = node.y + r;
      return function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
          var x = node.x - quad.point.x,
              y = node.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = node.radius + quad.point.radius;
          if (l < r) {
            l = (l - r) / l * .5;
            node.x -= x *= l;
            node.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      };
    }
  };

  return visualization;
});
