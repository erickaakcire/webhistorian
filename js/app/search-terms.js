define(["app/utils", "moment", "d3-context-menu", "ion.rangeSlider"], function(utils, moment, context, rangeSlide) {
  var visualization = {};
  var startDate = null;
  var endDate = null;
  var sd = null;
  var ed = null;
  
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
    utils.clearVisualization();
    
    if(startDate===null){
      datesOrig();
    }
    var filteredData = utils.filterByDates(data, startDate, endDate);
    var termArray = utils.generateTerms(filteredData);
    var sortedTerms = utils.sortByProperty(termArray, "term");
    var uniqueTerms = utils.uniqueCountST(sortedTerms, "term");

    var allSearchWords = utils.searchTermsToWords(uniqueTerms);

    var sortedAllWords = utils.sortByProperty(allSearchWords, "word");

    var searchWords = utils.searchWordsFun(sortedAllWords, uniqueTerms);

    var maxCount = Math.max.apply(Math, searchWords.map(function(searchWords) {
      return searchWords.size;
    }));
    
    var menu = [
      {
        title: 'View in Data Table',
        action: function(d) {
          //filter the dataset to just the search terms containing d.text
          var all = history.fullData;
          var st = [];
          for (var i in all){
            var terms = all[i].searchTerms;
            var item = all[i];
            var re = new RegExp(".*"+d.__data__.text+".*","i"); 
            var hit = re.test(terms);
            if (hit === true){
              st.push(item);
            }
          }
          if (st === null){
            alert("No records were found. ");
          }
          else {
            requirejs(["app/data-table"], function(data_table) {
              data_table.display(history, st, "");
              $("#viz_title").html("All visits with search term: " + d.__data__.text);
              $("#title h2").append(" - To return to a visualization please use the Navigation above.");
              vizSelected = "data_table";
            });
          }
        },
        disabled: false 
      },
      {
        title: 'Permanently Delete',
        action: function(d) {
          if (confirm('Do you want to PERMANENTLY remove all URLs with the search term \"'+d.__data__.text+'\" from your local browser history?')) {
            //filter the dataset to just the search word specified
            var all = utils.sortByProperty(history.fullData,"url");
            var newHist = [];
            var removal = [];
            var vc = 1;
            
            all.forEach(function (a,b) {
              var terms = a.searchTerms;
              var re = new RegExp(".*"+d.__data__.text+".*","i");
              var hit = re.test(terms);
              if (hit === true){
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
            if (removal === null){
              alert("No URLs were removed. ");
            } else {
              utils.removeHistory(removal);
              history.fullData = utils.sortByProperty(newHist,"date");
              visualization.display(history, history.fullData);
            }
          }
        }
      }
    ]
    
    d3.select("#" + history.timeSelection).classed("active", true);

    d3.select("#title").append("h1").text("What are you looking for?").attr("id", "viz_title");
    d3.select("#title").append("h2").text(uniqueTerms.length + " unique search terms with " + searchWords.length + " unique words. Right click a word for more options.");
    $("#above_visual").html("<p><br/> <input type='text' id='slider' name='slider_name' value=''/>");
    
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

    var width = $("#visual_div").width();
    var height = 500;
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
    var fill = d3.scale.category20();
    d3.layout.cloud().size([width, height])
      .words(searchWords)
      .padding(5)
      .rotate(function() {
        return 0;
      })
      .font("Impact")
      .fontSize(function(d) {
        var fontSizeCalc = d.size / maxCount;
        return utils.log10(fontSizeCalc * 140) * 2;
      })
    //.fontSize(function(d) { return d.size * 20 })
    .on("end", draw)
      .start();

    function draw(words) {
      d3.select("#visual_div").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "visualization")
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
        .selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", function(d) {
          return d.size + "px";
        })
        .style("font-family", "Impact")
        .style("fill", function(d, i) {
          return fill(i);
        })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) {
          return d.text;
        })
        .on("mouseover", function(d) {
          tooltip.text("Search terms indluding \"" + d.text + "\": " + d.allTerms + " -- Right-click for more options");
          tooltip.style("visibility", "visible");
        })
        .on("mousemove", function() {
          return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
          return tooltip.style("visibility", "hidden");
        })
        .on("contextmenu", d3.contextMenu(menu, function(){
          tooltip.style("visibility", "hidden");
        }))
        ;
    }
  };

  return visualization;
});
