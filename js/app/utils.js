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
    };
    
    utils.sortByPropRev = function(data, sort) 
    {
        return data.sort(function (a, b) {
           if (a[sort] > b[sort])
                return -1;
            if (a[sort] < b[sort])
                return 1;
            return 0;
        });
    };
    
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
    
    utils.uniqueCount = function(data, key) 
    {
        var countTerms = 1;
        var uniqueTerms = [];
        var term = key;

        for (i = 0; i < data.length; i++) 
        {
            var thisTerm = data[i].term;
            var prevTerm = "";
            
            if (i > 0) 
            {
                prevTerm = data[i - 1].term;
            }

            if (thisTerm === prevTerm) 
            {
                countTerms++;
            }
            else 
            {
                uniqueTerms.push({term: thisTerm, value: countTerms});
            }
        }
        return uniqueTerms;
    };
    
    utils.log10 = function(value) 
    {
        return value / Math.LN10;
    };
    	
    
    utils.countProperties = function(data, property) 
    {
        //count a property value of an object, return array with unique property values (counter), and count of that value (count)
        var countArray = [];
        
        var sorted = utils.sortByProperty(data, property);
        
        var counter = 1;
        
        for (var i = 0; i < sorted.length; i++) 
        {
            var dataItem = sorted[i];
            var countThing = sorted[i][property];
            
            var nextCountThing = "";
            
            if (i < sorted.length - 1) 
            {
                nextCountThing = sorted[i + 1][property];
            }
            
            if (countThing === nextCountThing) 
            {
                counter++;
            }
            else {
                countArray.push({counter: countThing, count: counter});
                counter = 1;
            }
        }
        
        return countArray;
    };
    
    utils.onlyIf = function(array, property, value, notValue) 
    {
        //returns an array with only the property value specified, or only not that value (true/false)
        var data = [];
        for (i = 0; i < array.length; i++) {
            var dataItem = array[i];
            var prop = array[i][property];
            if (notValue === true) {
                if (prop === value) {
                    //nothing
                }
                else {
                    data.push(dataItem);
                }
            }
            else if (notValue === false) {
                if (prop === value) {
                    data.push(dataItem);
                }
                else {
                    //nothing
                }
            }
            else {
                console.log("Error in onlyIf function, should the value be absent - notValue === true, or present, notValue === false");
            }
        }
        return data;
    };
    
    utils.removeHistory = function(urls, array) 
    {
        //urls is an array of objects (true) or a single object(false)

        if (array === true) {
            var urlsRemovedNow = 0;
            var visitsRemovedNow = 0;

            urls.forEach(function (a, b) {
                var visits = a.visitCount;
                var urls = a.url;
                chrome.history.deleteUrl({url: urls});
                if (a.url != b.url) {
                    urlsRemovedNow++;
                    visitsRemovedNow += visits;
                }
            });

            var d = new Date();
            var removalRecord = {timeRemoved: d.getTime(), numUrls: urlsRemovedNow, numVisits: visitsRemovedNow};
            utils.storeRemovalData(removalRecord);
        }
        else {
            var visits = urls.visitCount;
            var url1 = urls.url;
            console.log(urls);
            var d = new Date();
            chrome.history.deleteUrl({url: url1});
            var removalRecord = {timeRemoved: d.getTime(), numUrls: 1, numVisits: visits};
            utils.storeRemovalData(removalRecord);
        }
        
//        getUrls(noTransform, noViz, function() {
//            selectViz(vizSelected);
//        });
    };

    utils.getStoredData = function(key) 
    {
        return JSON.parse(localStorage.getItem(key));
    };

    utils.storeRemovalData = function(data) 
    {
        //add one object (data) to chrome local storage removal log, timeRemoved: , numUrls: , numVisits:
        var removalArray = [];
        var existing = getStoredData("removals");
        if (existing != null) {
            existing.push({timeRemoved: data.timeRemoved, numUrls: data.numUrls, numVisits: data.numVisits});
            localStorage.setItem("removals", JSON.stringify(existing));
        }
        else {
            var first = [];
            first.push({timeRemoved: data.timeRemoved, numUrls: data.numUrls, numVisits: data.numVisits});
            localStorage.setItem("removals", JSON.stringify(first));
        }
    };

    utils.findIndexByKeyValue = function(arrayToSearch, key, valueToSearch) 
    {
        for (var i = 0; i < arrayToSearch.length; i++) {
            var item = arrayToSearch[i][key];
            if (item === valueToSearch) {
                return i;
            }
        }
        
        return null;
    };
    
    
    

    return utils;
});