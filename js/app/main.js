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
		console.log("loaded require.js");
	
		$("#web_visit").click(function() {
			requirejs(["../app/websites-visited"], function (website_visited) 
			{
				console.log("CALLING DISPLAY: " + history.fullData.length);
				
				website_visited.display(history, history.fullData);
			});
		});
	});
});


