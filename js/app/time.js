//based on http://bl.ocks.org/tjdecke/5558084
define(["app/utils", "moment", "d3-context-menu", "ion.rangeSlider", "app/history"], function(utils, moment, context, rangeSlide, history) {
  var visualization = {};
  
  var menu = [
      {
          title: 'View in Data Table',
          action: function(d) {
            //filter the dataset to just the IDs in the idArr
            var all = history.fullData;
            var dv = [];
            for (var i in all){
              var id = all[i].id;
              var item = all[i];
              for (var i=0; i < d.__data__.idArr.length; i++){
                idData = d.__data__.idArr[i];
                if (id === idData){
                  dv.push(item);
                }
              }
            }
            requirejs(["app/data-table"], function(data_table) {
              data_table.display(history, dv, "");
              var day = "";
              switch (d.__data__.day) {
                  case "1":
                      day = "Sundays";
                      break;
                  case "2":
                      day = "Mondays";
                      break;
                  case "3":
                      day = "Tuesdays";
                      break;
                  case "4":
                      day = "Wednesdays";
                      break;
                  case "5":
                      day = "Thursdays";
                      break;
                  case "6":
                      day = "Fridays";
                      break;
                  case "7":
                      day = "Saturdays";
              }
              $("#viz_title").html("All Visits on " + day + " at " + d.__data__.hour + ":00 (24 hr format)");
              $("#title h2").append(" - To return to a visualization please use the Navigation above.");
              vizSelected = "data_table";
            });
          },
      }
    ]
  
  sumProp = function(data) {
    var valueObj = {};
    var idArr = [];
    var sData = utils.sortByProperty(data, "sort");
    
    for (var i = 0; i < sData.length; i++) {
      var sort = sData[i]["sort"];
      var id = sData[i]["id"];

      if (valueObj[sort] === undefined){
        idArr = [];
        idArr.push(id);
        valueObj[sort] = {idArr: idArr};
      }
      else {
        idArr.push(id);
        valueObj[sort] = {idArr: idArr};
      }
    }

    var counts = [];
    
    for (var j in valueObj) {
      if (valueObj.hasOwnProperty(j)) {
        var re = /([0-9])-([0-9]*)/;
        var day = j.replace(re, "$1");
        var hr = j.replace(re, "$2");
        
        counts.push({
          "day": day,
          "hour": hr,
          "sort": j,
          "value": valueObj[j].idArr.length,
          "idArr": valueObj[j].idArr
        });
      }
    }
    var hourDay = ["1-1","1-2","1-3","1-4","1-5","1-6","1-7","1-8","1-9","1-10","1-11","1-12","1-13","1-14","1-15","1-16","1-17","1-18","1-19","1-20","1-12","1-22","1-23","1-24","2-1","2-2","2-3","2-4","2-5","2-6","2-7","2-8","2-9","2-10","2-11","2-12","2-13","2-14","2-15","2-16","2-17","2-18","2-19","2-20","2-12","2-22","2-23","2-24","3-1","3-2","3-3","3-4","3-5","3-6","3-7","3-8","3-9","3-10","3-11","3-12","3-13","3-14","3-15","3-16","3-17","3-18","3-19","3-20","3-12","3-22","3-23","3-24","4-1","4-2","4-3","4-4","4-5","4-6","4-7","4-8","4-9","4-10","4-11","4-12","4-13","4-14","4-15","4-16","4-17","4-18","4-19","4-20","4-12","4-22","4-23","4-24","5-1","5-2","5-3","5-4","5-5","5-6","5-7","5-8","5-9","5-10","5-11","5-12","5-13","5-14","5-15","5-16","5-17","5-18","5-19","5-20","5-12","5-22","5-23","5-24","6-1","6-2","6-3","6-4","6-5","6-6","6-7","6-8","6-9","6-10","6-11","6-12","6-13","6-14","6-15","6-16","6-17","6-18","6-19","6-20","6-12","6-22","6-23","6-24","7-1","7-2","7-3","7-4","7-5","7-6","7-7","7-8","7-9","7-10","7-11","7-12","7-13","7-14","7-15","7-16","7-17","7-18","7-19","7-20","7-12","7-22","7-23","7-24"];
    for (var k=0; k<hourDay.length; k++){
      var hd = hourDay[k];
      var present = 0;
      
      for (var l=0; l<counts.length; l++) {
        var s = counts[l].sort;
        if(s === hd){
          present = 1;
        }
      }
      if (present === 0){
        var re = /([0-9])-([0-9]*)/;
        var day = hd.replace(re, "$1");
        var hr = hd.replace(re, "$2");
        
        counts.push({
          "day": day,
          "hour": hr,
          "sort": hd,
          "value": 0,
          "idArr": []
        });
      }
    }
    
    return counts;
  };
  
  function getHourData (data){
    var hrDataEach = [];
    for (var i=0;i<data.length;i++){
      var d = data[i];
      var day = moment(d.date).format('E');
      var hr = moment(d.date).format('k');
      hrDataEach.push({day: day, hour: hr, id: d.id, sort: day +'-'+ hr});
    }
    var hrDataSum = sumProp(hrDataEach);
    return hrDataSum;
  }
  
  visualization.display = function(history, data) {
    utils.clearVisualization();
    $("#title").html("<h1 id='viz_title'>Time Heatmap</h1><h2>Browsing by hour of the day &amp; day of the week. Right click to view records.</h2><div class='btn-toolbar' role='toolbar'> <div class='btn-group btn-group-sm'> <button type='button' class='btn btn-default dropdown-toggle' data-toggle='dropdown' href='#'> Week <span class='glyphicon glyphicon-chevron-down'></span> </button> <ul class='dropdown-menu' role='menu' id='weekMenu'> </ul> </div> <div class='btn-group btn-group-sm'> <button type='button' class='btn btn-default dropdown-toggle' data-toggle='dropdown' href='#'> Domain <span class='glyphicon glyphicon-chevron-down'></span> </button> <ul class='dropdown-menu' role='menu' id='domainMenu'> </ul> </div></div>");
    
    var margin = { top: 50, right: 0, bottom: 100, left: 30 },
        width = 960 - margin.left - margin.right,
        height = 430 - margin.top - margin.bottom,
        gridSize = Math.floor(width / 24),
        legendElementWidth = gridSize*2,
        buckets = 9,
        colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"], // alternatively colorbrewer.YlGnBu[9]
        days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];

    var svg = d3.select("#visual_div").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var dayLabels = svg.selectAll(".dayLabel")
        .data(days)
        .enter().append("text")
          .text(function (d) { return d; })
          .attr("x", 0)
          .attr("y", function (d, i) { return i * gridSize; })
          .style("text-anchor", "end")
          .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
          .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

    var timeLabels = svg.selectAll(".timeLabel")
        .data(times)
        .enter().append("text")
          .text(function(d) { return d; })
          .attr("x", function(d, i) { return i * gridSize; })
          .attr("y", 0)
          .style("text-anchor", "middle")
          .attr("transform", "translate(" + gridSize / 2 + ", -6)")
          .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

    function heatmapChart (dataset) {
      for (var i=0;i<dataset.length;i++){
        var d = dataset[i];
        
        var colorScale = d3.scale.quantile()
            .domain([0, buckets - 1, d3.max(dataset, function (d) { return d.value; })])
            .range(colors);

        var cards = svg.selectAll(".hour")
            .data(dataset, function(d) {return d.day+':'+d.hour;});

        cards.append("title");
        
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

        cards.enter().append("rect")
            .attr("x", function(d) { return (d.hour - 1) * gridSize; })
            .attr("y", function(d) { return (d.day - 1) * gridSize; })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("class", "hour bordered")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .on("mouseover", function(d){
              tooltip.text("Visits: " + d.value);
              tooltip.style("visibility", "visible");
            })
            .on("mousemove", function() {
              return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            })
            .on("mouseout", function(){
          	  return tooltip.style("visibility", "hidden");
          	})
            .on("contextmenu", d3.contextMenu(menu, function(){
              tooltip.style("visibility", "hidden");
            }))
            .style("fill", colors[0]);

        cards.transition().duration(2000)
            .style("fill", function(d) { return colorScale(d.value); });

        //cards.select("title").text(function(d) { return d.value; });
  
        cards.exit().remove();

        var legend = svg.selectAll(".legend")
            .data([0].concat(colorScale.quantiles()), function(d) { return d; });

        legend.enter().append("g")
            .attr("class", "legend");

        legend.append("rect")
          .attr("x", function(d, i) { return legendElementWidth * i; })
          .attr("y", height)
          .attr("width", legendElementWidth)
          .attr("height", gridSize / 2)
          .style("fill", function(d, i) { return colors[i]; });

        legend.append("text")
          .attr("class", "mono")
          .text(function(d) { return "≥ " + Math.round(d); })
          .attr("x", function(d, i) { return legendElementWidth * i; })
          .attr("y", height + gridSize);

        legend.exit().remove();  
      }

    };
    var hourData = getHourData(data);
    heatmapChart(hourData);
  }
  return visualization;
});