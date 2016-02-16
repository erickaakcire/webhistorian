define(["../app/utils", "moment"], function(utils, moment) 
{
    var visualization = {};
    
    visualization.buildDomainTable = function(data) {
        var startDate = utils.startDate();
        var endDate = utils.endDate();
    
        if (document.getElementById('domain_visualization')) 
        {
			utils.clearVisualization();
			utils.clearOptions();

            $("#option_items").append("<div id = \"options\"><h3>Data Table Options</h3><a id=\"day\">Website Domains Data</a><a id=\"week\">Search Term Data</a><a id=\"all\">All Visits</a></div>");
            d3.select("#day").classed("active", true);
        }
        d3.select("#title").append("h1").text("Data Table");
        d3.select("#title").append("h2").text(data.length + " Websites visited from: " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY")).attr("id", "viz_title");
        d3.select("#title").append("button").text("Remove Checked Domains from History").attr("id", "remove");
        d3.select("#title").append("p").text("To view and/or remove search terms choose the Search Term Data option above. To view each visit to each website as a separate record choose All Visits.").attr("id", "visit");

/*        document.getElementById('remove').addEventListener('click', function () {
            if (confirm('Do you want to remove all visits to the checked domain(s) from your browser history FOREVER?')) {
                for (var i = 0; i < data.length; i++) {
                    if (document.getElementById("isSuppressed_" + i).checked) {
                        //get an array of objects, all of the URLs from a domain with their count
                        var urlArray1 = getSuppressedUrl(history.fullData, "domain", data[i].counter); //data[i].counter is the domain name
                        removeHistory(urlArray1, true);
                        //get the array index of each url item that matches in visualData, vdi, then
                        urlArray1.forEach(function(a){
                            var vdi = findIndexArrByKeyValue(visualData,url,a);
                            if (vdi) {
                                console.log("visualDataPre",visualData.length);
                                visualData.splice(vdi,1);
                                console.log("visualDataPost",visualData.length);
                            }
                        });

                    }
                }
                selectViz("data_table");//reload with revised data?
                d3.select("#title").append("h3").text("Deleted selected information from browser history.").attr("id", "removed");
            }
        });
        */

        var table = document.createElement('table');
        table.id = "domain_visualization";

        document.getElementById("visual_div").appendChild(table);
        
        var tableData = [];
        
        for (var i = 0; i < data.length; i++)
        {
        	var dataObj = {};
        	dataObj['remove'] = data[i]['counter'];
        	dataObj['domain'] = data[i]['counter'];
        	dataObj['visits'] = data[i]['count'];
        	
        	tableData.push(dataObj);
        }

		$('table#domain_visualization').bootstrapTable({
			columns: [{
				field: 'remove',
				title: 'Remove',
				checkbox: true,
				sortable: false
			}, {
				field: 'visits',
				title: 'Visits',
				sortable: true
			}, {
				field: 'domain',
				title: 'Domain',
				sortable: true
			}],
			data: tableData,
			striped: true,
			pagination: true,
			search: true,
			sortable: true
		});
    };
    
    visualization.buildHistoryTable = function(historyData, showSearchTerms)
    {
        utils.clearVisualization();

        var startDate = utils.startDate();
        var endDate = utils.endDate();

        var headSearchTerms = "<b>Search Terms</b>";
        var headDate = "<b>Date</b>";

        //fullData1: id, url, urlId, protocol, domain, topDomain, searchTerms, date, transType, refVisitId, title
        if (showSearchTerms) 
        {
            var filtered = utils.onlyIf(historyData, "searchTerms", "", true);
            data = utils.sortByProperty(filtered, "searchTerms");
            d3.select("#title").append("h1").text("Data Table: Search Terms");
            headSearchTerms = "<b>Search Terms <span style=\"color:red\">&laquo;</span></b>";
        }
        else 
        {
            data = utils.sortByProperty(historyData, "date");
            d3.select("#title").append("h1").text("Data Table: All Visits");
            headDate = "<b>Date <span style=\"color:red\">&laquo;</span></b>";
        }

        d3.select("#title").append("h2").text(data.length + " records from: " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY")).attr("id", "viz_title");
        d3.select("#title").append("button").text("Remove Checked Items from History").attr("id", "remove");
        $('#title').append("<div id=\"visit\"><p>Press &#8984;F (mac) or Ctrl+F (windows) to search this table.</p></div>");

/*		$("#remove").click(function()
		{
            if (confirm('Do you want to permanently remove all checked items from your browser history?')) {
                for (var i = 0; i < data.length; i++) {
                    if (document.getElementById("isSuppressed_" + i).checked) {
                        var url = data[i].url;
                        var urlInd = utils.findIndexByKeyValue(urlArray, "url", url);
                        var vc = urlArray[urlInd].vc;
                        var obj1 = {url: url, visitCount: vc};
                        utils.removeHistory(obj1, false);
                    }
                }
                selectViz("data_table", true);
                d3.select("#title").append("h3").text("Removed checked information from browser history.").attr("id", "removed");
            }
        });

        document.getElementById('day').addEventListener('click', function () {
            dataTableData(historyData, dataTableViz);
        });
*/
        //build table
        var table = document.createElement('table');
        table.id = "search_visualization";
        document.getElementById("visual_div").appendChild(table);
        
        var tableData = [];

        for (var i = 0; i < data.length; ++i) {
            var row = {};
            
            var d = new Date(data[i].date);
            
            row['remove'] = "isSuppressed_" + i;
            row['domain'] = data[i].domain;
            row['date'] = "<span style='display: none;'>" + d.toISOString() + "</span>" + d;
            row['terms'] = data[i].searchTerms;
            row['id'] = data[i].id;
            row['reference_id'] = data[i].refVisitId;
            row['transition'] = data[i].transType;
            row['url'] = data[i].url;
            row['title'] = data[i].title;
            
            tableData.push(row);
        }

		$('table#search_visualization').bootstrapTable({
			columns: [{
				field: 'remove',
				title: 'Remove',
				checkbox: true,
				sortable: false
			}, {
				field: 'domain',
				title: 'Domain',
				sortable: true
			}, {
				field: 'date',
				title: 'Date',
				sortable: true
			}, {
				field: 'terms',
				title: 'Search Terms',
				sortable: true
			}, {
				field: 'id',
				title: 'ID',
				sortable: true
			}, {
				field: 'reference_id',
				title: 'Reference ID',
				sortable: true
			}, {
				field: 'transition',
				title: 'Transition',
				sortable: true
			}, {
				field: 'url',
				title: 'URL',
				sortable: true
			}, {
				field: 'title',
				title: 'Title',
				sortable: true
			}],
			data: tableData,
			striped: true,
			pagination: true,
			search: true,
			sortable: true
		});

        $('table#visualization').bootstrapTable();    
    };
    
    visualization.display = function(history, data) 
    {
        utils.clearVisualization();
        utils.clearOptions();

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
        
        var countData = utils.countProperties(filteredData, "domain");

        $("#option_items").append("<div id = \"options\"><h3>Data Table Options</h3><a id=\"day\">Website Domains Data</a><a id=\"week\">Search Term Data</a><a id=\"all\">All Visits</a></div>");

        //default
        d3.select("#day").classed("active", true);

        visualization.buildDomainTable(countData);

		$("#day").click(function()
		{
            if (d3.select("#day").classed("active", false)) {
                d3.select("#day").classed("active", true);
            }
            if (d3.select("#week").classed("active", true)) {
                d3.select("#week").classed("active", false);
            }
            if (d3.select("#all").classed("active", true)) {
                d3.select("#all").classed("active", false);
            }
            
			utils.clearVisualization();
			utils.clearOptions();
			
            visualization.buildDomainTable(countData);
        });

        document.getElementById('week').addEventListener('click', function () {
            if (d3.select("#day").classed("active", true)) {
                d3.select("#day").classed("active", false);
            }
            if (d3.select("#week").classed("active", false)) {
                d3.select("#week").classed("active", true);
            }
            if (d3.select("#all").classed("active", true)) {
                d3.select("#all").classed("active", false);
            }

			utils.clearVisualization();
			utils.clearOptions();

            visualization.buildHistoryTable(filteredData, true);
        });

        document.getElementById('all').addEventListener('click', function () {
            //rmViz();//not working at the right time, yet gets removed anyway
            //console.log("rmViz");
            if (d3.select("#day").classed("active", true)) {
                d3.select("#day").classed("active", false);
            }
            if (d3.select("#week").classed("active", true)) {
                d3.select("#week").classed("active", false);
            }
            if (d3.select("#all").classed("active", false)) {
                d3.select("#all").classed("active", true);
            }

			utils.clearVisualization();
			utils.clearOptions();

			visualization.buildHistoryTable(filteredData, false);
        });
    };
        
    return visualization;
});
