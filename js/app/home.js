define(["app/utils", "moment", "app/history"], function(utils, moment, history) {
  var visualization = {};
  vizSelected = "home";
  
  
  var countHome = 0;
  var countWebVisits = 0;
  var countSearch = 0;
  var countNetwork = 0;
  var countDataTable = 0;
  
  var seStored = JSON.parse(sessionStorage.getItem('se'));
  var sd = seStored[0].start;
  var ed = seStored[0].end;
  var endDate = new Date (ed);
  var startDate = new Date (sd); 
  
  function goHome (){
    if(vizSelected !== "home"){
      $("#cards").html("<br/><br/><h1>One moment please. Loading Home</h1><br/><br/><br/><br/>");
      requirejs(["app/home"], function(home) {
        home.display(history, history.fullData);
        vizSelected = "home";
      });
    }
    else { console.log("already selected"); }
  }
  function goWebVisit (){
    if (vizSelected !== "web_visit"){
      $("#cards").html("<br/><br/><h1>One moment please. Loading Web Visits</h1><br/><br/><br/><br/>");
      requirejs(["app/websites-visited"], function(websites_visited) {
        websites_visited.display(history, history.fullData);
        vizSelected = "web_visit"
      });
    }
    else { console.log("already selected"); }
  }
  function goSearchWords(){
    if(vizSelected !== "search_words"){
      $("#cards").html("<br/><br/><h1>One moment please. Loading Search Words</h1><br/><br/><br/><br/>");
      requirejs(["app/search-terms"], function(search_words) {
        search_words.display(history, history.fullData);
        vizSelected = "search_words";
      });
    }
    else { console.log("already selected"); }
  }
  function goNetwork () {
    if (vizSelected !== "network"){
      $("#cards").html("<br/><br/><h1>One moment please. Loading Network</h1><br/><br/><br/><br/>");
      requirejs(["app/site-network"], function(site_network) {
        site_network.display(history, history.fullData);
        vizSelected = "network";
      });
    }
    else { console.log("already selected"); }
  }
  function goTime () {
    if (vizSelected !== "time"){
      $("#cards").html("<br/><br/><h1>One moment please. Loading Time</h1><br/><br/><br/><br/>");
      requirejs(["app/time"], function(time) {
        time.display(history, history.fullData);
        vizSelected = "time";
      });
    }
    else { console.log("already selected"); }
  }
  function goDataTable (){
    if (vizSelected !== "data_table"){
      $("#cards").html("<br/><br/><h1>One moment please. Loading Data Table</h1><br/><br/><br/><br/>");
      requirejs(["app/data-table"], function(data_table) {
        data_table.display(history, history.fullData, "");
        vizSelected = "data_table";
      });
    }
    else { console.log("already selected"); }
  }
  
  $(".navbar-brand").click(function() {
    goHome();
  });
  $("#nav_home").click(function() {
    goHome();
  });

  $("#web_visit").click(function() {
    goWebVisit();
  });

  $("#search_words").click(function() {
    goSearchWords();
  });

  $("#network").click(function() {
    goNetwork();
  });
  
  $("#time").click(function() {
    goTime();
  });

  $("#data_table").click(function() {
    goDataTable();
  });

  $('[data-toggle="tooltip"]').tooltip();

  visualization.homeClicks = function() {
    $("#data_table_card").click(function() {
      goDataTable();
    });
    $("#network_card").click(function() {
      goNetwork();
    });
    $("#search_words_card").click(function() {
      goSearchWords();
    });
    $("#time_card").click(function() {
      goTime();
    });
  }

  visualization.display = function(history, data) {
    utils.clearVisualization();
    var filteredData = utils.filterByDates(data, startDate, endDate);
    history.insertCards();
    visualization.homeClicks();
    $('#viz_selector').show();
    history.compareWeekVisits(endDate, filteredData, history.wir);
 
  };
  return visualization;
});
