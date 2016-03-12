requirejs.config({
    shim: {
        "jquery": {
            exports: "$"
        },
        "bootstrap": {
            deps: ["jquery"]
        },
        "bootstrap-datepicker": {
            deps: ["bootstrap"]
        },
        "bootstrap-table": {
            deps: ["bootstrap"]
        },
        "d3": {
            exports: "d3"
        },
        "d3.layout.cloud": {
            deps: ["d3"]
        },
        "crypto-js-md5": {
            exports: "CryptoJS"
        }
    },
    baseUrl: "js/lib",
});

// Start the main app logic.
requirejs(["bootstrap", "bootstrap-datepicker", "bootstrap-table", "d3.layout.cloud"], function (bs, bsdp, bst, d3lc, moment) 
{
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
});


