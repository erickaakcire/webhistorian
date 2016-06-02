define(["../app/utils", "moment"], function(utils, moment) 
{
    var visualization = {};
    visualization.display = function(history, data){
		utils.clearVisualization();
        $("input#start_date").datepicker().on("changeDate", function(e)
        {
            visualization.display(history, data);
        });

        $("input#end_date").datepicker().on("changeDate", function(e)
        {
            visualization.display(history, data);
        });
        var startDate = utils.startDate();
        var endDate = utils.endDate();
        var filteredData = utils.filterByDates(data, startDate, endDate);
        
    requirejs(["../app/history"], function (history) 
	{
		$("#web_visit_card").click(function()
		{
			$("#web_visit").click();
		});

		$("#web_visit").click(function() {
			requirejs(["../app/websites-visited"], function (websites_visited) 
			{
				websites_visited.display(history, history.fullData);
			});
		});
		
		$(".navbar-brand").click(function () {
            requirejs(["../app/home"], function (home) 
			{
				home.display(history, history.fullData);
			});
		});

		$("#search_words_card").click(function()
		{
			$("#search_words").click();
		});

		$("#search_words").click(function() {
			requirejs(["../app/search-terms"], function (search_words) 
			{
				search_words.display(history, history.fullData);
			});
		});

		$("#network_card").click(function()
		{
			$("#network").click();
		});
	
		$("#network").click(function() {
			requirejs(["../app/site-network"], function (site_network) 
			{
				site_network.display(history, history.fullData);
			});
		});

		$("#data_table_card").click(function()
		{
			$("#data_table").click();
		});
	
		$("#data_table").click(function() {
			requirejs(["../app/data-table"], function(data_table) 
			{
				data_table.display(history, history.fullData, "");
			});
		});

		$('[data-toggle="tooltip"]').tooltip();
		$('.datepicker').datepicker();
	});
        
        
   		history.insertCards();
   		$('#viz_selector').show();
   		history.compareWeekVisits(endDate, filteredData, history.wir);
    };
	return visualization;
});