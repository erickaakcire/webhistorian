define(["../app/utils", "moment"], function(utils, moment) {
  var visualization = {};

  visualization.display = function(history, data) {
    utils.clearVisualization();

    $("input#start_date").datepicker().on("changeDate", function(e) {
      visualization.display(history, data);
    });

    $("input#end_date").datepicker().on("changeDate", function(e) {
      visualization.display(history, data);
    });

    var startDate = utils.startDate();
    var endDate = utils.endDate();
    var filteredData = utils.filterByDates(data, startDate, endDate);
    var termArray = utils.generateTerms(filteredData);
    var sortedTerms = utils.sortByProperty(termArray, "term");
    var uniqueTerms = utils.uniqueCountST(sortedTerms, "term");

    var allSearchWords = utils.searchTermsToWords(uniqueTerms);

    var sortedAllWords = utils.sortByProperty(allSearchWords, "word");

    var searchWords = utils.searchWordsFun(sortedAllWords, uniqueTerms); // new one

    var maxCount = Math.max.apply(Math, searchWords.map(function(searchWords) {
      return searchWords.size;
    })); //find max value of a property

    d3.select("#" + history.timeSelection).classed("active", true);

    d3.select("#title").append("h1").text("What are you looking for?").attr("id", "viz_title");
    d3.select("#title").append("h2").text(uniqueTerms.length + " unique search terms with " + searchWords.length + " unique words used from: " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY"));
    //d3.select("#below_visual").append("p").text("This is a cloud of the words you have used to search the web. The larger words were used in a greater number of different searches. Hover your mouse over each word for a tool-tip that shows all of the search terms where the word was used.").attr("id", "viz_p");

    //<p><label>Download:</label><a id="download-svg" href="#" target="_blank">SVG</a> |<a id="download-png" href="#" target="_blank">PNG</a>

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
          tooltip.text("Search terms indluding \"" + d.text + "\": " + d.allTerms);
          tooltip.style("visibility", "visible");
        })
        .on("mousemove", function() {
          return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
          return tooltip.style("visibility", "hidden");
        });
    }
  };

  return visualization;
});
