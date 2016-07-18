define(["app/utils", "moment", "app/history"], function(utils, moment, history) {
  var visualization = {};
  
  var vizSelected = "home";

  visualization.homeClicks = function() {
    requirejs(["app/history"], function(history) {
      $("#web_visit_card").click(function() {
        $("#web_visit").click();
      });

      $("#web_visit").click(function() {
        if (vizSelected !== "web_visit"){
          $("#cards").html("<br/><br/><h1>One moment please. Loading Web Visits</h1><br/><br/><br/><br/>");
          requirejs(["app/websites-visited"], function(websites_visited) {
            websites_visited.display(history, history.fullData);
            vizSelected = "web_visit"
          });
        }
        else { console.log("already selected"); }
      });

      $(".navbar-brand").click(function() {
        if(vizSelected !== "home"){
          $("#cards").html("<br/><br/><h1>One moment please. Loading Home</h1><br/><br/><br/><br/>");
          requirejs(["app/home"], function(home) {
            home.display(history, history.fullData);
            vizSelected = "home";
          });
        }
        else { console.log("already selected"); }
      });
      $("#nav_home").click(function() {
        $(".navbar-brand").click();
      });

      $("#search_words_card").click(function() {
        $("#search_words").click();
      });

      $("#search_words").click(function() {
        if(vizSelected !== "search_words"){
          $("#cards").html("<br/><br/><h1>One moment please. Loading Search Words</h1><br/><br/><br/><br/>");
          requirejs(["app/search-terms"], function(search_words) {
            search_words.display(history, history.fullData);
            vizSelected = "search_words";
          });
        }
        else { console.log("already selected"); }
      });

      $("#network_card").click(function() {
        $("#network").click();
      });

      $("#network").click(function() {
        if (vizSelected !== "network"){
          $("#cards").html("<br/><br/><h1>One moment please. Loading Network</h1><br/><br/><br/><br/>");
          requirejs(["app/site-network"], function(site_network) {
            site_network.display(history, history.fullData);
            vizSelected = "network";
          });
        }
        else { console.log("already selected"); }
      });

      $("#data_table_card").click(function() {
        $("#data_table").click();
      });

      $("#data_table").click(function() {
        if (vizSelected !== "data_table"){
          $("#cards").html("<br/><br/><h1>One moment please. Loading Data Table</h1><br/><br/><br/><br/>");
          requirejs(["app/data-table"], function(data_table) {
            data_table.display(history, history.fullData, "");
            vizSelected = "data_table";
          });
        }
        else { console.log("already selected"); }
      });

      $('[data-toggle="tooltip"]').tooltip();

    });
  }

  visualization.display = function(history, data) {
    utils.clearVisualization();

    var seStored = JSON.parse(sessionStorage.getItem('se'));
    sd = seStored[0].start;
    ed = seStored[0].end;
    endDate = new Date (ed);
    startDate = new Date (sd); 
    
    var filteredData = utils.filterByDates(data, startDate, endDate);

    visualization.homeClicks();

    history.insertCards();
    $('#viz_selector').show();
    history.compareWeekVisits(endDate, filteredData, history.wir);
 

  };
  return visualization;
});
