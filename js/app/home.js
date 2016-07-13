define(["../app/utils", "moment", "../app/history"], function(utils, moment, history) {
  var visualization = {};

  visualization.homeClicks = function() {
    requirejs(["../app/history"], function(history) {
      $("#web_visit_card").click(function() {
        $("#web_visit").click();
      });

      $("#web_visit").click(function() {
        $("#cards").html("<br/><br/><h1>One moment please. Loading Web Visits</h1><br/><br/><br/><br/>");
        requirejs(["../app/websites-visited"], function(websites_visited) {
          websites_visited.display(history, history.fullData);
        });
      });

      $(".navbar-brand").click(function() {
        $("#cards").html("<br/><br/><h1>One moment please. Loading Home</h1><br/><br/><br/><br/>");
        requirejs(["../app/home"], function(home) {
          home.display(history, history.fullData);
        });
      });
      $("#nav_home").click(function() {
        $(".navbar-brand").click();
      });

      $("#search_words_card").click(function() {
        $("#search_words").click();
      });

      $("#search_words").click(function() {
        $("#cards").html("<br/><br/><h1>One moment please. Loading Search Words</h1><br/><br/><br/><br/>");
        requirejs(["../app/search-terms"], function(search_words) {
          search_words.display(history, history.fullData);
        });
      });

      $("#network_card").click(function() {
        $("#network").click();
      });

      $("#network").click(function() {
        $("#cards").html("<br/><br/><h1>One moment please. Loading Network</h1><br/><br/><br/><br/>");
        requirejs(["../app/site-network"], function(site_network) {
          site_network.display(history, history.fullData);
        });
      });

      $("#data_table_card").click(function() {
        $("#data_table").click();
      });

      $("#data_table").click(function() {
        $("#cards").html("<br/><br/><h1>One moment please. Loading Data Table</h1><br/><br/><br/><br/>");
        requirejs(["../app/data-table"], function(data_table) {
          data_table.display(history, history.fullData, "");
        });
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
    
    $("#settings").click(function(){
      chrome.storage.local.get('upload_identifier', function (result) {
        var id = result.upload_identifier;
        $("#identifier_modal").modal("show");
        $("#id-body").html("<p>Your Web Historian identifier is: <strong>" + id + "</strong></p><p>If you need to change your Web Historian Identifier you can <a id='changeIdSet'>click here</a>.</p>");
        $("#changeIdSet").click(function(){
          $("#id-body").html("<p>Change your Web Historian Identifier</p><fieldset class='form-group' id='idChoice'><input type='text' class='form-control' id='field_identifier' placeholder='Enter identifier here&#8230;' /></fieldset>");
      		$("#field_identifier").val(id);
      		$("#chose_identifier").click(function(eventObj) {
      			eventObj.preventDefault();
      			var identifier = $("#field_identifier").val();
      			if (identifier != null && identifier != "")	{
      				chrome.storage.local.set({ 'upload_identifier': identifier }, function (result) {
      					$("#identifier_modal").modal("hide");
      				});
      			}
      			return false;
      		});
        });
      });
    });//diff
  };
  return visualization;
});
