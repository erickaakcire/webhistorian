//based on http://bl.ocks.org/tjdecke/5558084
define(["app/utils", "moment", "d3-context-menu", "ion.rangeSlider", "app/history"], function(utils, moment, context, rangeSlide, history) {
  var visualization = {};
  var weekSelectedId = "0";
  var now = new Date();
  
  function getIdArr (d) {
    //filter the dataset to just the IDs in the idArr
    var all = history.fullData;
    var dv = [];
    for (var i in all){
      var id = all[i].id;
      var item = all[i];
      var domain = all[i].domain;
      for (var i=0; i < d.__data__.idArr.length; i++){
        idData = d.__data__.idArr[i];
        if (id === idData && domain !== null){
          dv.push(item);
        }
      }
    }
    return dv;
  }
  function getDay (d){
    var day = "";
    switch (d.__data__.day) {
        case "1":
            day = "Mon";
            break;
        case "2":
            day = "Tues";
            break;
        case "3":
            day = "Wed";
            break;
        case "4":
            day = "Thurs";
            break;
        case "5":
            day = "Fri";
            break;
        case "6":
            day = "Sat";
            break;
        case "7":
            day = "Sun";
    }
  }
  
  var menu = [
      {
        title: 'View in Data Table',
        action: function(d) {
          var dv = getIdArr(d);
          requirejs(["app/data-table"], function(data_table) {
            data_table.display(history, dv, "");
            var day = getDay(d);
            $(".wh-tooltip").remove();
            $("#viz_title").text("All Visits on " + day + " at " + d.__data__.hour + ":00 (24 hr format)");
            $("#title h2").text(dv.length + " visits - To return to a visualization please use the Navigation above.");
            vizSelected = "data_table";
            document.body.scrollTop = document.documentElement.scrollTop = 0;
          });
        },
      },
      {
        title: 'View in Web Visits',
        action: function(d){
          var data = getIdArr(d);
          requirejs(["app/websites-visited"], function(wv) {
            var day = getDay(d);
            $(".wh-tooltip").remove();
            $("#viz_title").text("All Visits on " + day + " at " + d.__data__.hour + ":00 (24 hr format)");
            $("#title h2").text(data.length + " visits - To return to a visualization please use the Navigation above.");
            vizSelected = "web_visit";
            wv.display(history, data, 1);
            document.body.scrollTop = document.documentElement.scrollTop = 0;
          });
        }
      }
    ]
  
  sumProp = function(data) {
    var valueObj = {"1-1": {idArr: []}, "1-2": {idArr: []}, "1-3": {idArr: []}, "1-4": {idArr: []}, "1-5": {idArr: []}, "1-6": {idArr: []}, "1-7": {idArr: []}, "1-8": {idArr: []}, "1-9": {idArr: []}, "1-10": {idArr: []}, "1-11": {idArr: []}, "1-12": {idArr: []}, "1-13": {idArr: []}, "1-14": {idArr: []}, "1-15": {idArr: []}, "1-16": {idArr: []}, "1-17": {idArr: []}, "1-18": {idArr: []}, "1-19": {idArr: []}, "1-20": {idArr: []}, "1-21": {idArr: []}, "1-22": {idArr: []}, "1-23": {idArr: []}, "1-24": {idArr: []}, "2-1": {idArr: []}, "2-2": {idArr: []}, "2-3": {idArr: []}, "2-4": {idArr: []}, "2-5": {idArr: []}, "2-6": {idArr: []}, "2-7": {idArr: []}, "2-8": {idArr: []}, "2-9": {idArr: []}, "2-10": {idArr: []}, "2-11": {idArr: []}, "2-12": {idArr: []}, "2-13": {idArr: []}, "2-14": {idArr: []}, "2-15": {idArr: []}, "2-16": {idArr: []}, "2-17": {idArr: []}, "2-18": {idArr: []}, "2-19": {idArr: []}, "2-20": {idArr: []}, "2-21": {idArr: []}, "2-22": {idArr: []}, "2-23": {idArr: []}, "2-24": {idArr: []}, "3-1": {idArr: []}, "3-2": {idArr: []}, "3-3": {idArr: []}, "3-4": {idArr: []}, "3-5": {idArr: []}, "3-6": {idArr: []}, "3-7": {idArr: []}, "3-8": {idArr: []}, "3-9": {idArr: []}, "3-10": {idArr: []}, "3-11": {idArr: []}, "3-12": {idArr: []}, "3-13": {idArr: []}, "3-14": {idArr: []}, "3-15": {idArr: []}, "3-16": {idArr: []}, "3-17": {idArr: []}, "3-18": {idArr: []}, "3-19": {idArr: []}, "3-20": {idArr: []}, "3-21": {idArr: []}, "3-22": {idArr: []}, "3-23": {idArr: []}, "3-24": {idArr: []}, "4-1": {idArr: []}, "4-2": {idArr: []}, "4-3": {idArr: []}, "4-4": {idArr: []}, "4-5": {idArr: []}, "4-6": {idArr: []}, "4-7": {idArr: []}, "4-8": {idArr: []}, "4-9": {idArr: []}, "4-10": {idArr: []}, "4-11": {idArr: []}, "4-12": {idArr: []}, "4-13": {idArr: []}, "4-14": {idArr: []}, "4-15": {idArr: []}, "4-16": {idArr: []}, "4-17": {idArr: []}, "4-18": {idArr: []}, "4-19": {idArr: []}, "4-20": {idArr: []}, "4-21": {idArr: []}, "4-22": {idArr: []}, "4-23": {idArr: []}, "4-24": {idArr: []}, "5-1": {idArr: []}, "5-2": {idArr: []}, "5-3": {idArr: []}, "5-4": {idArr: []}, "5-5": {idArr: []}, "5-6": {idArr: []}, "5-7": {idArr: []}, "5-8": {idArr: []}, "5-9": {idArr: []}, "5-10": {idArr: []}, "5-11": {idArr: []}, "5-12": {idArr: []}, "5-13": {idArr: []}, "5-14": {idArr: []}, "5-15": {idArr: []}, "5-16": {idArr: []}, "5-17": {idArr: []}, "5-18": {idArr: []}, "5-19": {idArr: []}, "5-20": {idArr: []}, "5-21": {idArr: []}, "5-22": {idArr: []}, "5-23": {idArr: []}, "5-24": {idArr: []}, "6-1": {idArr: []}, "6-2": {idArr: []}, "6-3": {idArr: []}, "6-4": {idArr: []}, "6-5": {idArr: []}, "6-6": {idArr: []}, "6-7": {idArr: []}, "6-8": {idArr: []}, "6-9": {idArr: []}, "6-10": {idArr: []}, "6-11": {idArr: []}, "6-12": {idArr: []}, "6-13": {idArr: []}, "6-14": {idArr: []}, "6-15": {idArr: []}, "6-16": {idArr: []}, "6-17": {idArr: []}, "6-18": {idArr: []}, "6-19": {idArr: []}, "6-20": {idArr: []}, "6-21": {idArr: []}, "6-22": {idArr: []}, "6-23": {idArr: []}, "6-24": {idArr: []}, "7-1": {idArr: []}, "7-2": {idArr: []}, "7-3": {idArr: []}, "7-4": {idArr: []}, "7-5": {idArr: []}, "7-6": {idArr: []}, "7-7": {idArr: []}, "7-8": {idArr: []}, "7-9": {idArr: []}, "7-10": {idArr: []}, "7-11": {idArr: []}, "7-12": {idArr: []}, "7-13": {idArr: []}, "7-14": {idArr: []}, "7-15": {idArr: []}, "7-16": {idArr: []}, "7-17": {idArr: []}, "7-18": {idArr: []}, "7-19": {idArr: []}, "7-20": {idArr: []}, "7-21": {idArr: []}, "7-22": {idArr: []}, "7-23": {idArr: []}, "7-24": {idArr: []}};
    var idArr = [];
    var sData = utils.sortByProperty(data, "sort");
    
    for (var i = 0; i < sData.length; i++) {
      var sort = sData[i]["sort"];
      var id = sData[i]["id"];

      if (valueObj[sort].idArr.length === 0){
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
        var val = 0;
        if (valueObj[j].idArr.length !== undefined){
          val = valueObj[j].idArr.length;
        }
        counts.push({
          "day": day,
          "hour": hr,
          "sort": j,
          "value": val,
          "idArr": valueObj[j].idArr
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
  
  function weekMenu(){
    var se = JSON.parse(sessionStorage.getItem("se"));
    var start = new Date(se[0].start);
    var end = new Date(se[0].end);
    var startYear = parseInt(moment(start).format('YYYY'));
    var startDay = parseInt(moment(start).format('DDD'));
    var endYear = parseInt(moment(end).format('YYYY'));
    var endDay = parseInt(moment(end).format('DDD'));
    if (endYear !== startYear) {
      endDay = endDay + 365;
    }
    var daySpan = endDay - startDay;
    var fullWeeks = Math.floor(daySpan/7);
    
    $("#weekMenu").append("<li role='presentation'><a id='allData' role='menuitem' href='#'>All "+fullWeeks+" Weeks</a></li><li role='presentation' class='divider'></li>");
    $("#allData").click(function(){
      if(weekSelectedId !== "all"){
        weekSelectedId = "all";
        visualization.display(history, history.fullData);
        $("#title h2").text("Browsing by hour of the day &amp; day of the week, " + moment(start).format('ddd, MMM D') + " - "+ moment(end).format('ddd, MMM D'));
      }
    });
    $("#weekMenu").append("<li role='presentation'><a id='thisWeek' role='menuitem' href='#'>This Week - Default</a></li>");
    $("#thisWeek").click(function(){
      if(weekSelectedId !== "0"){
        weekSelectedId = "0";
        var sevenDaysAgo = utils.lessDays(now, 7);
        var weekData = utils.filterByDates(history.fullData, sevenDaysAgo, now);
        visualization.display(history, weekData);
      }
    });

    function substractDateFromIndex(i){
      var subtractStart = i * 7;
      var subtractEnd = subtractStart + 7;
      var subtractStartD = subtractStart + 1;
      var startWeek = utils.lessDays(end,subtractStart);
      var endWeek = utils.lessDays(end,subtractEnd);
      var startWeekD = utils.lessDays(end,subtractStartD);
      var startWeekDisplay = moment(startWeekD).format('ddd, MMM D');
      var endWeekDisplay = moment(endWeek).format('ddd, MMM D');
      return { startWeek: startWeek, endWeek: endWeek, startWeekDisplay: startWeekDisplay, endWeekDisplay: endWeekDisplay };
    }
    
    for(var i=1; i<=fullWeeks; i++){ //i=1 to skip the current week
      var d=substractDateFromIndex(i);
      $("#weekMenu").append("<li role='presentation'><a id='week"+ i +"' role='menuitem' href='#'>" + d.endWeekDisplay + " - " + d.startWeekDisplay + "</a></li>");
      $("#week" + i).click(function(e) {
        var weekId = e.target.id.replace(/[^0-9]+/, "");
        if(weekSelectedId !== weekId){
          var d=substractDateFromIndex(parseInt(weekId));
          weekSelectedId = weekId;
          var weekData = utils.filterByDates(history.fullData, d.endWeek, d.startWeek);
          visualization.display(history, weekData);
          $("#title h2").text("Browsing by hour of the day &amp; day of the week, " + d.endWeekDisplay + " - " + d.startWeekDisplay)
        }
      });
    }
  }
  
  visualization.display = function(history, data) {
    utils.clearVisualization();
    var sevenDaysAgo = utils.lessDays(now, 7);
    var startW = moment(sevenDaysAgo).format('ddd, MMM D');;
    var endW = moment().format('ddd, MMM D');
    $("#title").html("<h1 id='viz_title'>Time Heatmap</h1><h2>Browsing by hour of the day &amp; day of the week, " + startW + " - "+ endW +"</h2><p>Is this visualization incomplete? If you also use Internet Explorer or Firefox, you can import your browsing history to include it. Just follow <a href='http://www.webhistorian.org/importing/' target='_blank'>these steps</a>.</p><div class='btn-toolbar' role='toolbar'> <div class='btn-group btn-group-sm'> <button type='button' class='btn btn-default dropdown-toggle' data-toggle='dropdown' href='#'> Week <span class='glyphicon glyphicon-chevron-down'></span> </button> <ul class='dropdown-menu' role='menu' id='weekMenu'> </ul> </div></div>");
    var weeksList = weekMenu();
    var margin = { top: 50, right: 0, bottom: 100, left: 30 },
        width = 960 - margin.left - margin.right,
        height = 430 - margin.top - margin.bottom,
        gridSize = Math.floor(width / 24),
        legendElementWidth = gridSize*2,
        buckets = 9,
        colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"], // alternatively colorbrewer.YlGnBu[9]
        days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12a"];

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
        .text("tooltip")
        .attr("class", "wh-tooltip");

        cards.enter().append("rect")
            .attr("x", function(d) { return (d.hour - 1) * gridSize; })
            .attr("y", function(d) { return (d.day - 1) * gridSize; })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("class", "hour bordered")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .on("mouseover", function(d){
              if (d.value==0){
                tooltip.text("Visits: " + d.value + ".");
              }
              else {
                var day1 = d.idArr[0];
                var full = history.fullData;
                var day2 = "";
                for (var i=0;i<full.length;i++){
                  var f = full[i];
                  if (f.id == day1){
                    day2 = moment(f.date).format('M/D');
                  }
                }
                tooltip.text("Visits: " + d.value + " on "+ day2 +" - Right-click to see what these visits are.");
              }
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