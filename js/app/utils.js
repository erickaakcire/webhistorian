define(function() {
	var utils = {};

    utils.sortByProperty = function(data, sort) 
    {
        return data.sort(function (a, b) 
        {
            if (a[sort] < b[sort])
                return -1;
            else if (a[sort] > b[sort])
                return 1;
            
            return 0;
        });
    }
	
	utils.countsOfProperty = function(data, property)
	{
        var valueCounts = {};
        
        for (var i = 0; i < data.length; i++) 
        {
            var item = data[i];
            
            var value = data[i][property];
            
            if (valueCounts[value] == undefined)
            	valueCounts[value] = 0;
            	
            valueCounts[value] += 1;
        }
        
        var counts = [];
        
        for (var key in valueCounts)
        {
        	if (valueCounts.hasOwnProperty(key))
        	{
                counts.push({
                	"counter": key,
                	"count": valueCounts[key]
                });
        	}
        }
        
        return counts;
	};
	
	utils.countUniqueProperty = function(data, property) 
	{
        return utils.countsOfProperty(data, property).length;
    };
    
    utils.clearVisualization = function()
    {
        $("#loader").empty();
        $("#title").empty();
        $("#below_visual").empty();
        $("#visual_div").empty();
        $("#viz_selector").empty();
    };
    
    utils.clearOptions = function() 
    {
        $("#option_items").empty();
    };

    utils.filterByDates = function(data, startDate, endDate)
    {
        var filteredData = [];

		var start = 0;
		
		if (startDate != null)
			start = startDate.getTime();
			
		var end = Number.MAX_VALUE;

		if (endDate != null)
			end = endDate.getTime();
		
        for (var i = 0; i < data.length; i++)
        {
        	if (data[i].date < end && data[i].date > start)
				filteredData.push(data[i]);
        }
        
        return filteredData;
    };
    
    utils.contains = function(a, obj) {
        for (var i = 0; i < a.length; i++) {
            if (a[i] === obj) {
                return true;
            }
        }
        
        return false;
    };
    
    utils.classes = function(root) {
        //for webVisitViz to flatten heierarchy
        var classes = [];

        function recurse(name, node) {
            if (node.children) node.children.forEach(function (child) {
                recurse(node.name, child);
            });
            else 
            	classes.push({packageName: name, className: node.name, value: node.size});
        }

        recurse(null, root);
        
        return {children: classes};
    };
    
    utils.startDate = function()
    {
    	if ($("input#start_date").val() != null)
    		return $("input#start_date").datepicker("getDate");
    		
    	return null;
    };

    utils.endDate = function()
    {
    	if ($("input#end_date").val() != null)
    		return $("input#end_date").datepicker("getDate");
    		
    	return null;
    };
    
	return utils;
});