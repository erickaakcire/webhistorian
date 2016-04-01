/*
 Web Historian - see webhistorian.org for more information

 Copyright (C) 2016  Ericka Menchen-Trevino, info@webhistorian.org

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Pu
 blic License for more details.

 You should have received a copy of the GNU General Public License along
 with this program; if not, write to the Free Software Foundation, Inc.,
 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA. 
 */

define(["spin", "moment", "../app/config"], function (Spinner, moment, config) 
{
    var history = {};
    
    history.fullData = [];
    history.timeSelection = "all";
    history.earliestTimestamp = Number.MAX_VALUE;
    history.latestTimestamp = Number.MIN_VALUE;
    history.urlArray = [];
    
//function wrapper() {
    var startDate = null;
    var endDate = null;

    var manifest = chrome.runtime.getManifest();

//globals for the wrapper function
    var divName = "visual_div";
    var currDate = new Date();
    var timeSelect = 0; //null = 24 hours, 0 = all time
    var dateLimit = new Date(currDate.getTime());
    dateLimit.setDate(currDate.getDate() - 91);
    var dateForward = Infinity;

    var vizSelected = null;
    var firstDate = "";
    var lastDate = "";
    var visualData = [];
    var ids = [];

//Getting data from Chrome History & creating the base dataset
    function getUrls(callback, viz, callback2) {
//        loadTime();
        // get all urls from history for the specified time period (startTime)
        var end = currDate.getTime();
        if (dateForward != Infinity) {
            end = dateForward;
        }

        chrome.history.search({
                'text': '',
                'maxResults': 0,
                'startTime': timeSelect
                //, 'endTime': end //not working
            },
            function (historyItems) {
                //list of hostnames
                console.log("HIST LENGth: " + historyItems.length);
                
                for (var i = 0; i < historyItems.length; ++i) {
                    history.urlArray.push({
                        url: historyItems[i].url,
                        title: historyItems[i].title,
                        vc: historyItems[i].visitCount
                    });
                }

                //GetVisitsData
                var results = [];
                getVisitData(JSON.parse(JSON.stringify(history.urlArray)), results, callback, viz, callback2);
            });
    }

    function getVisitData(data, results, callback, viz, callback2) 
    {
        //gets visitItems from a supplied list of urls (as data)
        //used to determine last data element
        var itemCount = data.length;
        
        var lastPercentage = "";
        
        var fetchVisits = function()
        {
            var historyItem = data.pop();
            
            var currentProgress = (100 * ((itemCount - data.length) / itemCount)).toFixed(1) + '%';

            if (lastPercentage != currentProgress)
            {
                $("#visit_progress").width(currentProgress);
                $("#visit_progress").html(currentProgress);
                
                lastPercentage = currentProgress;
            }
        
            chrome.history.getVisits({url: historyItem.url}, function (visitItems) 
            {
                visitItems.forEach(function(visit) 
                {
                    if (visit.visitTime >= dateLimit && visit.visitTime <= dateForward) 
                    {
//                    	console.log('VISIT: ' + JSON.stringify(visit, 2));
//                    	
                        results.push({
                            url: historyItem.url,
                            title: historyItem.title,
                            id: visit.id,
                            visitId: visit.visitId,
                            referringVisitId: visit.referringVisitId,
                            visitTime: visit.visitTime,
                            transitionType: visit.transition
                        });
                        
                        if (visit.visitTime < history.earliestTimestamp)
                            history.earliestTimestamp = visit.visitTime;

                        if (visit.visitTime > history.latestTimestamp)
                            history.latestTimestamp = visit.visitTime;
                        
                        ids.push({id: visit.id});
                    }
                });
                
                if (data.length > 1)
                    window.setTimeout(fetchVisits, 0);
                else
                {
                    $("#visit_progress").width("100%");
                    $("#visit_progress").html("100%");
                    
                    transformData(results, callback, viz, callback2);
                
                    $("input#start_date").datepicker("setDate", new Date(history.earliestTimestamp));
                    $("input#end_date").datepicker("setDate", new Date(history.latestTimestamp));
                }
            });     
        };
        
        window.setTimeout(fetchVisits, 0);
    }

    function transformData(data, callback, viz, callback2) {
        //original data has: url title id visitId referringVisitId visitTime transitionType

        if (history.fullData != []) {
            history.fullData = [];
        }

        var itemCount = data.length;
        
        var lastPercentage = '';
        
        var transformDataItem = function()
        {
            var currentProgress = (100 * ((itemCount - data.length) / itemCount)).toFixed(0) + '%';
            
            if (lastPercentage != currentProgress)
            {
                $("#transform_progress").width(currentProgress);
                $("#transform_progress").html(currentProgress);
                
                lastPercentage = currentProgress;
            }
            
            var activeItems = [];
            
            for (var i = 0; i < 100 && data.length > 0; i++)
                activeItems.push(data.pop());
                
            for (var i = 0; i < activeItems.length; i++)
            {    
                var dataItem = activeItems[i];
            
                var parser = document.createElement('a');
                parser.href = dataItem.url;
                var refId = dataItem.referringVisitId;
                // if this ID is not in dataItem.visitID, subtract 1 from refId

//                if (refId !== "0") {
//                    console.log("REF ID: " + refId);
//                }

                var transType = dataItem.transitionType;
                var protocol = parser.protocol;
                var host = parser.hostname;

                var reGoogleCal = /\.google\.[a-z\.]*\/calendar\//; //run it on URL...
                var reGoogleMaps = /\.google\.[a-z\.]*\/maps/; //run it on URL
                var reGoogle = /\.google\.[a-z\.]*$/;
                //dutch portals?
                var reBing = /\.bing\.com/;
                var reWwwGoogle = /www\.google\.[a-z\.]*$/;
                var reAol = /\.aol\.[a-z\.]*$/;
                var reBlogspot = /\.blogspot\.[a-z\.]*$/;
                var reYahoo = /\.yahoo\.[a-z\.]*$/;
                var reYahooSearchDomain = /search\.yahoo\.[a-z\.]*$/;
                var reAsk = /\.ask\.[a-z\.]*$/;
                var reTwoTwoThree = /^.*\.([\w\d_-]*\.[a-zA-Z][a-zA-Z]\.[a-zA-Z][a-zA-Z])$/; //parser.hostname.match(reTwoTwoThree)
                var reDefaultDomain = /^.*\.([\w\d_-]*\.[a-zA-Z][a-zA-Z][a-zA-Z]?[a-zA-Z]?)$/; //parser.hostname.match(reDefaultDomain)

                var reTopLevel2 = /^.*\.[\w\d_-]*\.([a-zA-Z][a-zA-Z]\.[a-zA-Z][a-zA-Z])$/;
                var reTopLevel = /^.*\.[\w\d_-]*\.([a-zA-Z][a-zA-Z][a-zA-Z]?[a-zA-Z]?)$/;

                if (parser.href.match(reGoogleCal)) {
                    domain = "google calendar";
                }
                else if (parser.href.match(reGoogleMaps)) {
                    domain = "google maps";
                }
                else if (host.match(reGoogle) || host.match(reBlogspot) || host.match(reYahoo) || host.match(reAol)) {
                    domain = host;
                }
                else if (host.match(reTwoTwoThree)) {
                    domain = host.replace(reTwoTwoThree, "$1");
                }
                else {
                    domain = host.replace(reDefaultDomain, "$1");
                }

                if (host.match(reTopLevel2)) {
                    topDomain = host.replace(reTopLevel2, "$1");
                }
                else {
                    topDomain = host.replace(reTopLevel, "$1");
                }

                reSearch = /q=([^&]+)/;
                reYahooSearch = /p=([^&]+)/;
                var searchTerms = "";

                if (reGoogle.test(host) || host === "duckduckgo.com" || reBing.test(host) || host === "search.aol.com" || host === reAsk.test(host)) {

                    if (reSearch.test(parser.href)) {
                        search = parser.href.match(reSearch, "$1");
                        if (search[1] != "")
                            var searchTerms1 = search[1];
                        var dcSearchTerms = decodeURIComponent(searchTerms1);
                        searchTerms = dcSearchTerms.replace(/\+/g, " ");
                    }
                }

                if (reYahooSearchDomain.test(host)) {

                    if (reYahooSearch.test(parser.href)) {
                        yahooSearch = parser.href.match(reYahooSearch, "$1");
                        if (yahooSearch[1] != "")
                            var searchTerms1 = yahooSearch[1];
                        var dcSearchTerms = decodeURIComponent(searchTerms1);
                        var searchTerms = dcSearchTerms.replace(/\+/g, " ");
                    }
                }
                history.fullData.push({
                    id: dataItem.visitId,
                    url: dataItem.url,
                    urlId: dataItem.id,
                    protocol: protocol,
                    domain: domain,
                    topDomain: topDomain,
                    searchTerms: searchTerms,
                    date: dataItem.visitTime,
                    transType: dataItem.transitionType,
                    refVisitId: dataItem.referringVisitId,
                    title: dataItem.title
                });
            }
                
            if (data.length > 1)
                window.setTimeout(transformDataItem, 0);
            else
            {
                $("#transform_progress").width("100%");
                $("#transform_progress").html("100%");

//                console.log("fullData1: ", history.fullData.length);
                visualData = history.fullData;
                sortByProp(visualData,"date");
//                console.log("visualData: ", visualData.length);
                callback2();
                callback(visualData, viz);
                
                $("#progress_bars").hide();
            }
        };
        
        window.setTimeout(transformDataItem, 0);
    }

    function findIndexByKeyValue(arrayToSearch, key, valueToSearch) 
    {
//    	console.log("KEY: " + key + " -- " + JSON.stringify(arrayToSearch, null, 2) + " -- " + valueToSearch);
    	
        for (var i = 0; i < arrayToSearch.length; i++) 
        {
            var item = arrayToSearch[i][key];
            
            if (item === valueToSearch) 
            {
                return i;
            }
        }
        
        return null;
    }

    history.findIndexArrByKeyValue = function(arraytosearch, key, valuetosearch) 
    {
        var indexArray = [];
        
        for (var i = 0; i < arraytosearch.length; i++) 
        {
            if (arraytosearch[i][key] === valuetosearch) 
            {
                indexArray.push(i);
            }
        }
        
        return indexArray;
    }

    history.getSuppressedUrl = function(data, key, value) 
    {
        var index = history.findIndexArrByKeyValue(data, key, value);
        var urlArray1 = [];

        index.forEach(function (a) {
            console.log("A: " + JSON.stringify(a, null, 2));

            var url = data[a].url;

            console.log("B: " + JSON.stringify(url, null, 2));

            var urlInd = findIndexByKeyValue(history.urlArray, "url", url);

            console.log("C: " + JSON.stringify(urlInd, null, 2));
            
            console.log("D: " + JSON.stringify(history.urlArray[urlInd], null, 2));
            
            var vc = history.urlArray[urlInd].vc;
            
            urlArray1.push({url: url, visitCount: vc});
        });
        return urlArray1;
    };

    history.removeHistory = function(urls, isArray) {
        //urls is an array of objects (true) or a single object(false)

        if (isArray) {
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
            storeRemovalData(removalRecord);
        }
        else {
            var visits = urls.visitCount;
            var url1 = urls.url;
//            console.log(urls);
            var d = new Date();
            chrome.history.deleteUrl({url: url1});
            var removalRecord = {timeRemoved: d.getTime(), numUrls: 1, numVisits: visits};
            storeRemovalData(removalRecord);
        }
        
        getUrls(noTransform, noViz, function() {

        });
    };

    function storeRemovalData(data) {
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
    }

    function getStoredData(key) {
        //get data in chrome local storage
        return JSON.parse(localStorage.getItem(key));
    }

    function onlyBetween(array, property, lowVal, highVal) {
        //returns an array with only the property values between the high/low values specified
        var data = [];
        array.forEach(function(a){
            var prop = a[property];
            if (prop >= lowVal && prop <= highVal) {
                data.push(a);
            }
        });
        return data;
    }

    function countSomething(data, countIt) {
        //count a property value of an object, return array with unique property values (counter), and count of that value (count)
        countArray = [];
        var sorted = sortByProp(data, countIt);
        var counter = 1;
        for (var i = 0; i < sorted.length; i++) {
            var dataItem = sorted[i];
            var countThing = sorted[i][countIt];
            var nextCountThing = "";
            if (i < sorted.length - 1) {
                nextCountThing = sorted[i + 1][countIt];
            }
            if (countThing === nextCountThing) {
                counter++;
            }
            else {
                countArray.push({counter: countThing, count: counter});
                counter = 1;
            }
        }
        return countArray;
    }

    function lowHighNum(objArr, prop, low) {
        //for object properties in arrays that contain numbers, get the lowest number if low === true, highest if not
        if (low) {
            var first = Infinity;
            for (var i = 0; i < objArr.length; i++) {
                eval = objArr[i][prop];
                if (eval < first) {
                    first = eval;
                }
            }
            return first;
        }
        else {
            var last = 0;
            for (var i = 0; i < objArr.length; i++) {
                eval = objArr[i][prop];
                if (eval > last) {
                    last = eval;
                }
            }
            return last;
        }
    }

    function sortByProp(data, sort) {
        loadTime();
        var sorted = data.sort(function (a, b) {
            if (a[sort] < b[sort])
                return -1;
            if (a[sort] > b[sort])
                return 1;
            return 0;
        });
        return sorted;
    }

    function sortByPropRev(data, sort) {
        loadTime();
        var sorted = data.sort(function (a, b) {
            if (a[sort] > b[sort])
                return -1;
            if (a[sort] < b[sort])
                return 1;
            return 0;
        });
        return sorted;
    }

//Passing data to visualizations
    function timeLineData(data, callback) {
        //fullData1: id, url, urlId, protocol, domain, topDomain, searchTerms, date, transType, refVisitId, title
        var timeLine = [];
        var dates = [];
        for (var i = 0; i < data.length; i++) {
            var m = new Date(data[i].date);
            var day = ("0" + m.getDate()).slice(-2);
            var month = ("0" + (m.getMonth() + 1) ).slice(-2);
            var hour = ("0" + m.getHours()).slice(-2);
            var date = m.getFullYear() + "/" + month + "/" + day + ":" + hour;
            dates.push({date: date});
        }
        timeLine = countSomething(dates, "date");
        callback(timeLine);
    }

    function submissionData(callback) {
        loadTime();
        var userId = chrome.runtime.id;
        var removals = [];
        if (getStoredData("removals") != null) {
            removals.push(getStoredData("removals"));
        }
        else {
            removals.push({timeRemoved: null, numUrls: 0, numVisits: 0});
        }
        var finalData = {userId: userId, removed: removals, data: history.fullData};

        callback(finalData);
    }

    function noTransform(data, callback) {
        loadTime();
        callback(data);
    }


    function timeLineViz(dataset) {
        // based on Mike Bostock's example: http://bl.ocks.org/mbostock/1667367

        d3.select("#title").append("h1").text("Time Line: Volume of web history").attr("id", "viz_title");

        var margin = {top: 10, right: 10, bottom: 100, left: 40},
            margin2 = {top: 430, right: 10, bottom: 20, left: 40},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom,
            height2 = 500 - margin2.top - margin2.bottom;

        var parseDate = d3.time.format("%Y/%m/%d:%H").parse;

        var x = d3.time.scale().range([0, width]),
            x2 = d3.time.scale().range([0, width]),
            y = d3.scale.linear().range([height, 0]),
            y2 = d3.scale.linear().range([height2, 0]);

        var xAxis = d3.svg.axis().scale(x).orient("bottom"),
            xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
            yAxis = d3.svg.axis().scale(y).orient("left");

        var brush = d3.svg.brush()
            .x(x2)
            .on("brush", brushed);

        var area = d3.svg.area()
            .interpolate("monotone")
            .x(function (d) {
                return x(d.day);
            })
            .y0(height)
            .y1(function (d) {
                return y(d.count);
            });

        var area2 = d3.svg.area()
            .interpolate("monotone")
            .x(function (d) {
                return x2(d.day);
            })
            .y0(height2)
            .y1(function (d) {
                return y2(d.count);
            });

        var svg = d3.select("#" + divName).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", "visualization");

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        var focus = svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

        for (var i = 0; i < dataset.length; i++) {
            data = dataset[i];
            type(data);
            x.domain(d3.extent(data.map(data.counter)));
            y.domain([0, d3.max(data.map(data.count))]);
            x2.domain(x.domain());
            y2.domain(y.domain());

            focus.append("path")
                .datum(data)
                .attr("class", "area")
                .attr("d", area);

            focus.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            focus.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            context.append("path")
                .datum(data)
                .attr("class", "area")
                .attr("d", area2);

            context.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height2 + ")")
                .call(xAxis2);

            context.append("g")
                .attr("class", "x brush")
                .call(brush)
                .selectAll("rect")
                .attr("y", -6)
                .attr("height", height2 + 7);
        }

        function brushed() {
            x.domain(brush.empty() ? x2.domain() : brush.extent());
            focus.select(".area").attr("d", area);
            focus.select(".x.axis").call(xAxis);
        }

        function type(d) {
            d.counter = parseDate(d.counter);
            d.count = +d.count;
            return d;
        }

        rmLoad();
    }

/*     function submitViz(data) {
        console.log("submitViz");
        rmViz();
        rmOpt();

        var stringData = JSON.stringify(data);

        var access_token;
        chrome.identity.getAuthToken(
            {'interactive': true},
            function(token) {access_token = token;
                console.log (access_token);
                if (access_token) {
                    var PROJECT = '581411807237';
                    var clientId = '581411807237-hi8jesii81k5725mo67q6bktc8ofi099.apps.googleusercontent.com';
                    var apiKey = 'AIzaSyA6NwESlZ5-uHcaTr8KjaajrAX6yf94ISQ';
                    var scopes = 'https://www.googleapis.com/auth/devstorage.read_write';
                    var API_VERSION = 'v1';
                    var BUCKET = 'web-historian-eu';
                    var object = "";
                    var GROUP =
                        'group-00b4903a9760b6025c58662742f5a3adc6aaaedad9a94204ebd9a7e46e2ec252';

                    //just for testing
                    function listBuckets() {
                        var request = gapi.client.storage.buckets.list({
                            'project': PROJECT
                        });
                        executeRequest(request, 'listBuckets');
                    }

                    function executeRequest(request, apiRequestName) {
                        request.execute(function(resp) {
                            console.log(resp);
                            //If the selected API command is not 'insertObject', pass the request
                            //paramaters to the getCodeSnippet method call as 'request.B.rpcParams'
                            //else pass request paramaters as 'request.B'
                            if (apiRequestName != 'insertObject') {
                                apiRequestCodeSnippetEntry.innerHTML =
                                    getCodeSnippet(request.B.method, request.B.rpcParams);
                                //Selected API Command is not 'insertObject'
                                //hide insert object button
                                filePicker.style.display = 'none';
                            } else {
                                apiRequestCodeSnippetEntry.innerHTML =
                                    getCodeSnippet(request.B.method, request.B);
                            }
                        });
                    }

                    function getCodeSnippet(method, params) {
                        var objConstruction = "// Declare your parameter object\n";
                        objConstruction += "var params = {};";
                        objConstruction += "\n\n";
                        var param = "// Initialize your parameters \n";
                        for (i in params) {
                            param += "params['" + i + "'] = ";
                            param += JSON.stringify(params[i], null, '\t');
                            param += ";";
                            param += "\n";
                        }
                        param += "\n";
                        var methodCall = "// Make a request to the Google Cloud Storage API \n";
                        methodCall += "var request = gapi.client." + method + "(params);";
                        return objConstruction + param + methodCall;
                    }

                    $('#' + divName).append("<div id=\"visualization\"><a id=\"list_buckets\">List Buckets</a></div>");
                    // maybe loadTime(); to show upload processing
                    $("#list_buckets").click(function() { listBuckets(); });

                }
                else {
                    d3.select("#"+divName).append("p").text("Not Authorized - sumission not possible").attr("id", "visualization");
                }
            }
        );
        
        rmLoad();
    }
*/
    function noViz(data) {
        //nothing
        rmLoad();
    }

    function selectTime(time) {
        history.timeSelection = time;
        var d = new Date();
        var lowVal = 0;

        if (time === "day") {
            lowVal = d.setDate(d.getDate()-1);
        }
        else if (time === "week") {
            lowVal = d.setDate(d.getDate()-7);
        }
        else if (time === "month") {
            lowVal = d.setDate(d.getDate()-30);
        }
        else if (time === "all") {
            lowVal = d.setDate(d.getDate()-91);
        }

        var highVal = currDate.getTime();

        visualData = onlyBetween(history.fullData,"date",lowVal,highVal);
        // console.log("visualData: ",visualData.length);
        
        // console.log('DATA: ' + JSON.stringify(history.fullData, 2));
    }

    function inputTime() {
        //if date input element exists, remove
        if (document.getElementById("input_time")) {
            $("#input_time").remove();
        }

        var lastD = new Date();
        var todayDay = ("0" + lastD.getDate()).slice(-2);
        var todayMonth = ("0" + (lastD.getMonth() + 1) ).slice(-2);
        var todayYear = lastD.getFullYear();
        var today = todayYear + "-" + todayMonth + "-" + todayDay;
        $('#options').append("<div id=\"input_time\"><p>From: <input type=\"date\" max=" + today + " id=\"from\" /> To: <input type=\"date\" id=\"to\" max=" + today + " /> <a id=\"go\" >Submit</a> </p></div>");

        $("#go").click(function() {
            //get the actual dates chosen into variables
            var fromInput = $("#from").val();
            var toInput = $("#to").val();
            var fromD = new Date(fromInput);
            fromD = fromD.setHours(0, 0);
            var fromD1 = new Date(fromD);
            var toD = new Date(toInput);
            toD = toD.setHours(23, 59);
            var toD1 = new Date(toD);
            //if from is less than to, give error
            if (fromD1 != "Invalid Date" && toD1 != "Invalid Date") {
                if (fromD1 >= toD1) {
                    $('#options').append("<p id =\"error\">Error: the \"From\" date must come before the \"To\" date.</p>");
                }
                else {
                    //remove any error messages
                    if (document.getElementById("error")) {
                        $("#error").remove();
                    }
                    timeSelect = fromD;
                    dateLimit.setDate(fromD);
                    var lowVal = fromD1.getTime();
                    console.log("lowVal: ",lowVal);
                    var highVal = toD1.getTime();
                    console.log("highVal: ",highVal);

                    visualData = onlyBetween(history.fullData,"date",lowVal,highVal);
                    history.timeSelection = "choose";
                    d3.selectAll("#option_items a").classed("active", false);
                    d3.select("#choose").classed("active", true);
                    console.log("visualData: ",visualData.length);
                }
            }
            else {
                $('#options').append("<p id =\"error\">Error: please choose two valid dates.</p>");
            }
        });
        d3.selectAll("#options a").classed("active", false);
        d3.select("#choose").classed("active", true);
    }

    function listenTimeClick() {
        d3.selectAll("#options a").classed("active", false);

        $("#day").click(function() {
            dateForward = Infinity;
            selectTime("day");
            d3.select("#day").classed("active", true);
        });
        $("#week").click(function() {
            dateForward = Infinity;
            selectTime("week");
            d3.select("#week").classed("active", true);
        });
        $("#month").click(function() {
            dateForward = Infinity;
            selectTime("month");
            d3.select("#month").classed("active", true);
        });
        $("#all").click(function() {
            dateForward = Infinity;
            selectTime("all");
            d3.select("#all").classed("active", true);
        });
        $("#choose").click(function() {
            inputTime();
        });
    }

    function rmViz() {
        //remove old visualization if it exists
        $("#loader").empty();
        $("#title").empty();
        $("#below_visual").empty();
        $("#visual_div").empty();
        $("#viz_selector").empty();
    }

    function rmOpt() {
        $("#option_items").empty();
    }

    function rmLoad() {
        $(".spinner").remove();
    }

    function loadTime() {
        //fancy loading spinner
        var opts = {
            lines: 13, // The number of lines to draw
            length: 20, // The length of each line
            width: 10, // The line thickness
            radius: 30, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            color: '#000', // #rgb or #rrggbb or array of colors
            speed: 1, // Rounds per second
            trail: 60, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: 'spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: '50%', // Top position relative to parent
            left: '50%' // Left position relative to parent
        };
        var target = document.getElementById('main');
        var spinner = new Spinner(opts).spin(target);
    }

    function refresh()
    {
        if (vizSelected != null)
            selectViz(vizSelected);
    }
    
    //Putting it all together
    $("document").ready(function () 
    {
        $("#navbar").hide();
        
        //Get all data into fullData1
        getUrls(noTransform, noViz, function()
        {
            //New default, append images for visualization chooser
            $('#viz_selector').show();
            $("#navbar").show();

//	        console.log('DATA: ' + JSON.stringify(history.fullData, 2));

            $("#load_data").click(function () 
            { //used for researcher edition
                var fileName = prompt("Please enter the file name");
                d3.json(fileName, function(error, root) {
                    if (root === undefined) 
                    {
                        $('#' + divName).append("<div id=\"visualization\"><h3>Error loading data, check file name and file format</h3></div>");
                    }
                    else 
                    {
                        history.fullData = [];
                        history.fullData = root.data;
                        visualData = [];
                        visualData = root.data;
//                        console.log("file load success");
//                        console.log("fullData1: ",history.fullData.length);
//                        console.log("visualData: ",visualData.length);
                        history.timeSelection = "all";
                    }
                });
            });
            
            $('#upload_modal').on('show.bs.modal', function (e) 
            {
                chrome.storage.local.get({ 'lastPdkUpload': 0, 'completedActions': [] }, function (result) 
                {
					$.get(config.actionsUrl, function(actions)
					{
						var lastUpload = 0;
						var latest = 0;
					
						if (result.lastPdkUpload != undefined)
							lastUpload = Number(result.lastPdkUpload);
						
						var dayBundles = {};
						var dayIndices = [];
								
						for (var i = 0; i < visualData.length; i++)
						{
							var date = moment(visualData[i]["date"]);
						
							var unixTimestamp = date.valueOf();

							if (unixTimestamp > lastUpload)
							{
								var dayString = date.format("MMMM Do");
					
								var dayList = dayBundles[dayString];
					
								if (dayList == undefined)
								{
									dayList = [];
									dayBundles[dayString] = dayList;
									dayIndices.push(dayString);
								}
					
								dayList.push(visualData[i]);
							
								if (unixTimestamp > latest)
									latest = unixTimestamp;
							}
							else
							{
								// Already uploaded - ignore...
							}
						}
            
						$("#modal_overview").html(dayIndices.length + " days to upload (" + dayIndices[0] + " to " + dayIndices[dayIndices.length - 1] + ").");

						var toList = [];
					
						for (var j = 0; j < actions.length; j++)
						{
							var action = actions[j];
						
							var complete = false;

							for (var i = 0; i < result.completedActions.length; i++)
							{
								if (result.completedActions[i] == action["identifier"])
									complete = true;
							}

							if (complete == false)
								toList.push(action);
						}
						
						console.log("TOLIST: " + JSON.stringify(toList)); 
						console.log("ACTIONS: " + JSON.stringify(actions)); 
						console.log("COMPLETED: " + JSON.stringify(result.completedActions)); 


						if (toList.length == 0)
						{
							$("div#progress_actions").hide();
						}
						else
						{
							$("div#progress_actions").show();					
						
							var output = "";
						
							for (var i = 0; i < toList.length; i++)
							{
								var listItem = "<li>";
							
								listItem += "<a href='" + toList[i].url + myid + "' target='_blank' class='wh_action' id='wh_" + toList[i].identifier + "'>" + toList[i].name + "</a>";
							
								listItem += "</li>";
							
								output += listItem;
							}
						
							$("ul#progress_actions_list").html(output);
						}
						
						$("a.wh_action").click(function(eventObj)
						{
							var actionId = $(eventObj.target).attr("id").substring(3);
							
							console.log("CLICK: " + actionId);
							
							result.completedActions.push(actionId);

							console.log("SAVING: " + JSON.stringify(result.completedActions));
							
							chrome.storage.local.set({ 'completedActions': result.completedActions }, function (result) 
							{
								console.log("SAVED");
							});
						});

						$("#upload_data").click(function()
						{
							var bundles = [];
					
							for (var i = 0; i < dayIndices.length; i++)
							{
								bundles.push(dayBundles[dayIndices[i]]);
							}
					
							var onProgress = function(index, total)
							{
								var percentComplete = (index / total) * 100;
					
								$("#upload_progress").css("width", percentComplete + "%");
							};
					
							var onComplete = function()
							{
								chrome.storage.local.set({ 'lastPdkUpload': latest }, function (result) 
								{
									$('#upload_modal').modal('hide');
								
									chrome.browserAction.setIcon({
										path: "images/star-yellow-64.png"
									});	

									chrome.browserAction.setTitle({
										title: "Web Historian"
									});	
								});
							};
					
							chrome.identity.getProfileUserInfo(function(userInfo)
							{
								requirejs(["passive-data-kit", "crypto-js-md5"], function(pdk, CryptoJS) 
								{
									pdk.upload(config.uploadUrl, CryptoJS.MD5(userInfo.email).toString(), 'web-historian', bundles, 0, onProgress, onComplete);
								});                 
							});
                    	});
                    });
                });
            });

            $("#submit").click(function() {
                console.log("submit click");
                d3.selectAll("#viz_selector a").classed("active", false);
                console.log("submit click if");
                dateForward = Infinity;
                history.timeSelection = "all";
//                submissionData(submitViz);
            });
        });
    });

    return history;
});
//wrapper();
