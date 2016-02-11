/*
 Web Historian - see webhistorian.org for more information

 Copyright (C) 2015  Ericka Menchen-Trevino, info@webhistorian.org

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

//a function to contain the whole script
function wrapper() {
	var startDate = null;
	var endDate = null;

//globals for the wrapper function
    var divName = "visual_div";
    var currDate = new Date();
    var timeSelect = 0; //null = 24 hours, 0 = all time
    var dateLimit = new Date(currDate.getTime());
    dateLimit.setDate(currDate.getDate() - 91);
    var dateForward = Infinity;
    var timeSelection = "all";
    var vizSelected = null;
    var fullData1 = [];
    var firstDate = "";
    var lastDate = "";
    var visualData = [];
    var ids = [];

//Getting data from Chrome History & creating the base dataset
    function getUrls(callback, viz, callback2) {
        console.log("1");
//        loadTime();
        
        console.log("2");
        // get all urls from history for the specified time period (startTime)
        var end = currDate.getTime();
        if (dateForward != Infinity) {
            end = dateForward;
        }

        console.log("3");

        chrome.history.search({
                'text': '',
                'maxResults': 0,
                'startTime': timeSelect
                //, 'endTime': end //not working
            },
            function (historyItems) {
	        console.log("4");
                //list of hostnames
                urlArray = [];
                for (var i = 0; i < historyItems.length; ++i) {
                    urlArray.push({
                        url: historyItems[i].url,
                        title: historyItems[i].title,
                        vc: historyItems[i].visitCount
                    });
                }

                //GetVisitsData
                var results = [];
                getVisitData(urlArray, results, callback, viz, callback2);
            });
        console.log("3.5");
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
                        results.push({
                            url: historyItem.url,
                            title: historyItem.title,
                            id: visit.id,
                            visitId: visit.visitId,
                            referringVisitId: visit.referringVisitId,
                            visitTime: visit.visitTime,
                            transitionType: visit.transition
                        });
                        
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
                }
			});		
		};
		
		window.setTimeout(fetchVisits(), 0);
    }

    function transformData(data, callback, viz, callback2) {
        //original data has: url title id visitId referringVisitId visitTime transitionType

        if (fullData1 != []) {
            fullData1 = [];
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

	//            if(refId !== 0){
	//                console.log("" + refId);
	 //           }

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
				fullData1.push({
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

				console.log("fullData1: ", fullData1.length);
				visualData = fullData1;
				sortByProp(visualData,"date");
				console.log("visualData: ", visualData.length);
				callback2();
				callback(visualData, viz);
				
				$("#progress_bars").hide();
			}
		};
		
		window.setTimeout(transformDataItem, 0);
    }

//Data wrangling
    function callFirstLastDate(){
        firstDate = setFirstDate(visualData);
        lastDate = setLastDate(visualData);
    }
    function findIndexByKeyValue(arrayToSearch, key, valueToSearch) {
        for (var i = 0; i < arrayToSearch.length; i++) {
            var item = arrayToSearch[i][key];
            if (item === valueToSearch) {
                return i;
            }
        }
        return null;
    }

    function findIndexArrByKeyValue(arraytosearch, key, valuetosearch) {
        indexArray = [];
        for (var i = 0; i < arraytosearch.length; i++) {
            if (arraytosearch[i][key] === valuetosearch) {
                indexArray.push(i);
            }
        }
        return indexArray;
    }

    function contains(a, obj) {
        for (var i = 0; i < a.length; i++) {
            if (a[i] === obj) {
                return true;
            }
        }
        return false;
    }

    function termArrayFun(dataSearch) {
        var termArray = [];
        for (var i = 0; i < dataSearch.length; i++) {
            var dataItem = dataSearch[i];
            var terms = dataItem.searchTerms;
            var domain = dataItem.domain;

            if (terms != "undefined" && terms != null) {
                termArray.push({term: terms, domain: domain});
            }
        }
        return termArray;
    }

    function uniqueCount(data, key) {
        var countTerms = 1;
        var uniqueTerms = [];
        var term = key;

        for (i = 0; i < data.length; i++) {
            var thisTerm = data[i].term;
            var prevTerm = "";
            if (i > 0) {
                prevTerm = data[i - 1].term;
            }

            if (thisTerm === prevTerm) {
                countTerms++;
            }
            else {
                uniqueTerms.push({term: thisTerm, value: countTerms});
            }
        }
        return uniqueTerms;
    }

    function searchWordsFun(words, terms) {
        var countWords = 1;
        var sortedAllWords = words;
        var uniqueTerms = terms;
        var searchTermContext = [];
        var searchWords = [];
        maxCount = 0;

        for (i = 0; i < sortedAllWords.length; i++) {
            var thisWord = sortedAllWords[i].word;
            var thisTermId = sortedAllWords[i].termId;
            var thisTerm = "";
            if (uniqueTerms[thisTermId - 1].term) {
                thisTerm = uniqueTerms[thisTermId - 1].term;
            }
            var nextWord = "";
            var nextTermId = "";
            if (i < sortedAllWords.length - 1) {
                nextWord = sortedAllWords[i + 1].word;
                nextTermId = sortedAllWords[i + 1].termId;
            }

            if (nextTermId === thisTermId) {
            }
            else if (thisWord === nextWord) {
                countWords++;
                searchTermContext.push(" " + thisTerm);
            }
            else {
                searchTermContext.push(" " + thisTerm);
                var stc = searchTermContext.toString();
                searchWords.push({text: thisWord, size: countWords, allTerms: stc});
                if (countWords > maxCount) {
                    maxCount = countWords;
                }
                countWords = 1;
                searchTermContext = [];
            }
        }
        return searchWords;
    }

    function getSuppressedUrl(data, key, value) {
        var index = findIndexArrByKeyValue(data, key, value);
        var urlArray1 = [];

        index.forEach(function (a) {
            var url = data[a].url;
            var urlInd = findIndexByKeyValue(urlArray, "url", url);
            var vc = urlArray[urlInd].vc;
            urlArray1.push({url: url, visitCount: vc});
        });
        return urlArray1;
    }

    function removeHistory(urls, array) {
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
            storeRemovalData(removalRecord);
        }
        else {
            var visits = urls.visitCount;
            var url1 = urls.url;
            console.log(urls);
            var d = new Date();
            chrome.history.deleteUrl({url: url1});
            var removalRecord = {timeRemoved: d.getTime(), numUrls: 1, numVisits: visits};
            storeRemovalData(removalRecord);
        }
        getUrls(noTransform, noViz, function() {
            selectViz(vizSelected);
        });
    }

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

    function onlyIf(array, property, value, notValue) {
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
    }

    function classes(root) {
        //for webVisitViz to flatten heierarchy
        var classes = [];

        function recurse(name, node) {
            if (node.children) node.children.forEach(function (child) {
                recurse(node.name, child);
            });
            else classes.push({packageName: name, className: node.name, value: node.size});
        }

        recurse(null, root);
        return {children: classes};
    }

    function log10(val) {
        return val / Math.LN10;
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

    function countUnique(data, countIt) {
        //count a property value of an object, return number of unique values in that property
        countU = 0;
        var sorted = sortByProp(data, countIt);
        for (var i = 0; i < sorted.length; i++) {
            var dataItem = sorted[i];
            var countThing = sorted[i][countIt];
            var nextCountThing = "";
            if (i < sorted.length - 1) {
                nextCountThing = sorted[i + 1][countIt];
            }
            if (countThing === nextCountThing) {
                //nothing
            }
            else {
                countU++;
            }
        }
        return countU;
    }

    function uniqueValues(obj, prop) {
        //return an array with the unique values of an object property - maybe add a count
        uValues = [];
        var sorted = sortByProp(obj, prop);

        sorted.forEach(function (a, b) {
            var propValue = a[prop];
            var nextPropValue = b[prop];
            if (propValue === nextPropValue) {
                //nothing
            }
            else {
                uValues.push();
            }
        });
        console.log(uValues);
        return uValues;
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

    function setFirstDate(dataset) {
        var first = lowHighNum(dataset, "date", true);
        var firstD = new Date(first);
        firstDa = firstD.toDateString();
        return firstDa;
    }

    function setLastDate(dataset) {
        var last = lowHighNum(dataset, "date", false);
        var lastD = new Date(last);
        lastDa = lastD.toDateString();
        return lastDa;
    }

    function lengthInUtf8Bytes(str) {
        // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
        var m = encodeURIComponent(str).match(/%[89ABab]/g);
        return str.length + (m ? m.length : 0);
    }

//Sorting
    function dynamicSort(property) {
        var sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        };
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

    function compare(a, b) {
        if (a.sort < b.sort)
            return -1;
        if (a.sort > b.sort)
            return 1;
        return 0;
    }

    function compareSW(a, b) {
        if (a.term < b.term)
            return -1;
        if (a.term > b.term)
            return 1;
        return 0;
    }

    function compareSwords(a, b) {
        if (a.word < b.word)
            return -1;
        if (a.word > b.word)
            return 1;
        return 0;
    }

    function compareD(a, b) {
        if (a.domain < b.domain)
            return -1;
        if (a.domain > b.domain)
            return 1;
        return 0;
    }

//Passing data to visualizations
    function timeLineData(data, callback) {
        //fullData1: id, url, urlId, protocol, domain, topDomain, searchTerms, date, transType, refVisitId, title
        callFirstLastDate();
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

    function dataTableData(data, callback) {
        //fullData1: id, url, urlId, protocol, domain, topDomain, searchTerms, date, transType, refVisitId, title
        callFirstLastDate();
        loadTime();
        dtData = countSomething(data, "domain");
        callback(dtData, data);
    }

    function searchWordsData(dataSearch, callback) {
        callFirstLastDate();
        loadTime();
        var allSearchWords = [];
        var countUniqueTerms = 1;
        var termArray = termArrayFun(dataSearch);
        //arrays for search words data prep
        // stop words to filter from word cloud - From Jonathan Feinberg's cue.language, see lib/cue.language/license.txt.
        var stopWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;

        var sortedTerms = termArray.sort(compareSW);

        uniqueTerms = uniqueCount(sortedTerms, "term");

        var maxWords = 0;

        for (i = 0; i < uniqueTerms.length; i++) {
            var thisTerm = uniqueTerms[i].term;
            var punctuationless = thisTerm.replace(/[\"\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            var thisTermNoPunct = punctuationless.replace(/\s{2,}/g, " ");
            var words = thisTermNoPunct.split(" ");
            var countWords = words.length;
            if (countWords > maxWords) {
                maxWords = countWords;
            }
            for (var j = 0; j < words.length; j++) {
                if (stopWords.test(words[j].toLowerCase()) === false) {
                    allSearchWords.push({word: words[j].toLowerCase(), termId: countUniqueTerms});
                }
            }
            countUniqueTerms++;
        }

        var sortedAllWords = allSearchWords.sort(compareSwords);

        var searchWords = searchWordsFun(sortedAllWords, uniqueTerms);

        callback(searchWords, maxWords);

    }

    function networkData(fullData, callback) {

console.log("NETWORK 1.0");

        callFirstLastDate();
        loadTime();
        var allEdges = [];
        var uniqueEdges = [];
        var edgeList = [];
        var sorted = [];

console.log("NETWORK 1.1 --> " + fullData.length);

		var idMap = {};

        for (var i = 0; i < fullData.length; i++) {
            var dataItem = fullData[i];
            var refId = dataItem.refVisitId;
            
            idMap[refId] = i;
		}

        for (var i = 0; i < fullData.length; i++) {
            var dataItem = fullData[i];
            var refId = dataItem.refVisitId;
            var id = dataItem.id;
            var domain = dataItem.domain;
            var protocol = dataItem.protocol;
            var transition = dataItem.transType;
            var refIdInd = idMap[refId]; // findIndexByKeyValue(fullData, "id", refId);

            if (refIdInd !== null && refId !== 0) {
                var refDomain = fullData[refIdInd].domain;
                var refProtocol = fullData[refIdInd].protocol;
                if (domain != refDomain && refDomain != null && refDomain != "" && domain != "" && domain != null) {
                    allEdges.push({sort: refDomain + domain, source: refDomain, target: domain});
                }
            }
        }
        
console.log("NETWORK 1.2");
        

        sorted = allEdges.sort(compare);
        totalLinks = allEdges.length + 1;

        var countEdges = 1;

console.log("NETWORK 1.3");

        for (var j = 0; j < sorted.length; j++) {
            var sortedItem = sorted[j];
            var countThing = sorted[j].sort;
            var sourceItem = sorted[j].source;
            var targetItem = sorted[j].target;
            var nextCountThing = "";
            if (j < sorted.length - 1) {
                nextCountThing = sorted[j + 1].sort;
            }
            if (countThing === nextCountThing) {
                countEdges++;
            }
            else {
                edgeList.push({source: sourceItem, target: targetItem, value: countEdges});
                //console.log(sourceItem, targetItem, countEdges);
                countEdges = 1;
            }
        }

console.log("NETWORK 1.4");

        callback(edgeList);

console.log("NETWORK 1.5");
        
    }

    function webVisitData(data, callback) {
        //hard coding categories for top accessed websites in the US and NL. Putting into a heierarchical object for visualization.
        //need to implement regex matches and top domain matching esp. for blogs, education and governmnet...
        //need to create a variable for category names and make loops
        //var categories = ["adult", "banking", "blog", "education", "email", "government", "hard_news", "information", "search", "shopping", "social", "soft_news", "technology", "video"];
        callFirstLastDate();
        loadTime();
        var domains = countSomething(data, "domain");

        var adultA = [];
        var bankingA = [];
        var blogA = [];
        var educationA = [];
        var emailA = [];
        var governmentA = [];
        var hard_newsA = [];
        var informationA = [];
        var searchA = [];
        var shoppingA = [];
        var socialA = [];
        var soft_newsA = [];
        var technologyA = [];
        var videoA = [];

        var adult = ["pornhub.com", "xvideos.com", "xhamster.com", "xcams.com", "youporn.com"];
        var banking = ["paypal.com", "chase.com", "bankofamerica.com", "wellsfargo.com", "capitalone.com", "ing.nl", "rabobank.nl", "abnamro.nl"];
        var blog = ["wordpress.com", "blogspot.nl", "blogspot.com", "wordpress.org", "tumblr.com"];
        var education = ["eur.nl", "ac.uk", ".edu"];
        var email = ["live.com", "gmail.com", "mail.google.com", "inbox.google.com", "mailboxapp.com", "mail.yahoo.com"];
        var government = ["belastingdienst.nl", ".gov"];//last
        var hard_news = ["huffingtonpost.com", "geenstijl.nl", "nu.nl", "telegraaf.nl", "nos.nl", "nrc.nl", "cnn.com", "nytimes.com", "washingtonpost.com", "foxnews.com", "ad.nl", "volkskrant.nl"];
        var information = ["wikipedia.org", "imdb.com"];
        var search = ["www.google.nl", "bing.com", "baidu.com", "www.google.com", "search.yahoo.com", "duckduckgo.com"];
        var shopping = ["amazon.com", "apple.com", "walmart.com", "etsy.com", "target.com", "marktplaats.nl", "bol.com", "bva-auctions.com", "aliexpress.com", "amazon.de", "ikea.com", "ebay.com", "ah.nl"];
        var social = ["reddit.com", "tumblr.com", "blogspot.com", "facebook.com", "twitter.com", "linkedin.com", "t.co", "pinterest.com", "flickr.com", "imgur.com", "instagram.com"];
        var soft_news = ["theonion.com", "vice.com", "diply.com", "espn.go.com", "buzzfeed.com", "bleacherreport.com", "dumpert.nl", "theladbible.com", "viralmundo.nl"];
        var technology = ["stackoverflow.com", "slashdot.org", "github.com"];
        var video = ["youtube.com", "netflix.com", "hulu.com", "kickass.to"];

        var specified = [];
        adult.forEach(function (a) {
            specified.push(a);
        });
        banking.forEach(function (a) {
            specified.push(a);
        });
        blog.forEach(function (a) {
            specified.push(a);
        });
        education.forEach(function (a) {
            specified.push(a);
        });
        email.forEach(function (a) {
            specified.push(a);
        });
        government.forEach(function (a) {
            specified.push(a);
        });
        hard_news.forEach(function (a) {
            specified.push(a);
        });
        information.forEach(function (a) {
            specified.push(a);
        });
        search.forEach(function (a) {
            specified.push(a);
        });
        shopping.forEach(function (a) {
            specified.push(a);
        });
        social.forEach(function (a) {
            specified.push(a);
        });
        soft_news.forEach(function (a) {
            specified.push(a);
        });
        technology.forEach(function (a) {
            specified.push(a);
        });
        video.forEach(function (a) {
            specified.push(a);
        });

        var otherA = [];

        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i].counter;
            var size = domains[i].count;
            if (contains(specified, domain)) {
                if (contains(adult, domain)) {
                    adultA.push({name: domain, size: size});
                }
                if (contains(banking, domain)) {
                    bankingA.push({name: domain, size: size});
                }
                if (contains(blog, domain)) {
                    blogA.push({name: domain, size: size});
                }
                if (contains(education, domain)) {
                    educationA.push({name: domain, size: size});
                }
                if (contains(email, domain)) {
                    emailA.push({name: domain, size: size});
                }
                if (contains(government, domain)) {
                    governmentA.push({name: domain, size: size});
                }
                if (contains(hard_news, domain)) {
                    hard_newsA.push({name: domain, size: size});
                }
                if (contains(information, domain)) {
                    informationA.push({name: domain, size: size});
                }
                if (contains(search, domain)) {
                    searchA.push({name: domain, size: size});
                }
                if (contains(shopping, domain)) {
                    shoppingA.push({name: domain, size: size});
                }
                if (contains(social, domain)) {
                    socialA.push({name: domain, size: size});
                }
                if (contains(soft_news, domain)) {
                    soft_newsA.push({name: domain, size: size});
                }
                if (contains(technology, domain)) {
                    technologyA.push({name: domain, size: size});
                }
                if (contains(video, domain)) {
                    videoA.push({name: domain, size: size});
                }
            }
            else {
                otherA.push({name: domain, size: size});
            }
        }
        var dataset = ({
            name: "Domains", children: [
                {name: "Adult", children: adultA},
                {name: "Banking", children: bankingA},
                {name: "Blog", children: blogA},
                {name: "Education", children: educationA},
                {name: "Email", children: emailA},
                {name: "Government", children: governmentA},
                {name: "Hard News", children: hard_newsA},
                {name: "Information", children: informationA},
                {name: "Other", children: otherA},
                {name: "Search", children: searchA},
                {name: "Shopping", children: shoppingA},
                {name: "Social", children: socialA},
                {name: "Soft News", children: soft_newsA},
                {name: "Technology", children: technologyA},
                {name: "Video", children: videoA}
            ]
        });
        callback(dataset);
    }

    function submissionData(callback) {
        callFirstLastDate();
        loadTime();
        var userId = chrome.runtime.id;
        var removals = [];
        if (getStoredData("removals") != null) {
            removals.push(getStoredData("removals"));
        }
        else {
            removals.push({timeRemoved: null, numUrls: 0, numVisits: 0});
        }
        var finalData = {userId: userId, removed: removals, data: fullData1};

        callback(finalData);
    }

    function noTransform(data, callback) {
        callFirstLastDate();
        loadTime();
        callback(data);
    }

//Visualizations
    function webVisitViz(data1) {
        // Top Websites visual based on Bubble Chart http://bl.ocks.org/mbostock/4063269 by Mike Bostock and http://jsfiddle.net/xsafy/

        d3.select("#" + timeSelection).classed("active", true);
        listenTimeClick();
        var json = data1;
        var numDomains = -1; // countUnique(visualData, "domain");
        d3.select("#title").append("h1").text("What websites do you visit?").attr("id", "viz_title");
        d3.select("#title").append("h2").text(numDomains + " websites visited from: " + startDate + " to: " + endDate).attr("id", "viz_subtitle");
        d3.select("#below_visual").append("p").text("A larger circle means that the website was visited more.").attr("id", "viz_p");

        var r = 960,
            format = d3.format(",d"),
            fill = d3.scale.category20();

        var bubble = d3.layout.pack()
            .sort(null)
            .size([r, r])
            .padding(1.5);

        var vis = d3.select("#" + divName).append("svg")
            .attr("width", r)
            .attr("height", r)
            .attr("class", "bubble")
            .attr("id", "visualization");


        var node = vis.selectAll("g.node")
            .data(bubble.nodes(classes(json))
                .filter(function (d) {
                    return !d.children;
                }))
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        node.append("title")
            .text(function (d) {
                return d.className + ": " + format(d.value);
            });

        node.append("circle")
            .attr("r", function (d) {
                return d.r;
            })
            .style("fill", function (d) {
                return fill(d.packageName);
            });

        node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .text(function (d) {
                return d.className.substring(0, d.r / 3);
            });
        rmLoad();
    }

    function networkViz(links) {
        // Network visualization based on  http://www.d3noob.org/2013/03/d3js-force-directed-graph-example-basic.html and http://bl.ocks.org/mbostock/3750558
        // temporary labeling fix: if node has more than two edges (in or out) show label, otherwise hover for label

console.log("NETWORK 1.4.1");
        d3.select("#" + timeSelection).classed("active", true);
        listenTimeClick();
        var numSites = links.length + 1;

        d3.select("#title").append("h1").text("How did you get there?").attr("id", "viz_title");
        d3.select("#title").append("h2").text(totalLinks + " links between " + numSites + " websites from: " + firstDate + " to: " + lastDate);
        d3.select("#below_visual").append("p").text("This is a network based on how you navigate to the websites you visit. There is a link between two websites if you click on a link from one to the other. Drag to move websites to a fixed position. Double click to release the dragged website back to the normal layout.").attr("id", "viz_p");

console.log("NETWORK 1.4.2");

        var nodes = {};
        var edgesMaxValue = 0;

        // Compute the distinct nodes from the links.
        links.forEach(function (link) {
            link.source = nodes[link.source] ||
            (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] ||
            (nodes[link.target] = {name: link.target});
            link.value = +link.value;
            if (edgesMaxValue < link.value) {
                edgesMaxValue = link.value;
            }
        });

console.log("NETWORK 1.4.3");

        var width = 960;
        height = 500;

        var force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([width, height])
            .linkDistance(40)
            .charge(-100)
            .on("tick", tick)
            .start();

console.log("NETWORK 1.4.4");

        var svg = d3.select("#" + divName).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "visualization");

        var drag = force.drag().on("dragstart", dragstart);

        function dblclick(d) {
            d3.select(this).classed("fixed", d.fixed = false);
        }

        function dragstart(d) {
            d3.select(this).classed("fixed", d.fixed = true);
        }

console.log("NETWORK 1.4.5");

        // build the arrow.
        svg.append("svg:defs").selectAll("marker")
            .data(["end"])      // Different link/path types can be defined here
            .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 17)
            .attr("refY", -1.5)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .attr("class", "marker")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        // add the links and the arrows
        var path = svg.append("svg:g").selectAll("path")
            .data(force.links())
            .enter().append("svg:path")
            .style("userSpaceOnUse", 1.5)
            //function(d,i){ return links[i].value/(edgesMaxValue/5);}
            //    .attr("class", function(d) { return "link " + d.type; })
            .attr("class", "link")
            .attr("marker-end", "url(#end)");

console.log("NETWORK 1.4.6");

        // define the nodes
        var node = svg.selectAll(".node")
            .data(force.nodes())
            .enter().append("g")
            .attr("class", "node")
            //.call(force.drag);
            .on("dblclick", dblclick)
            .call(drag);

        // add the nodes
        node.append("circle")
            .attr("r", 5)
            .attr("class", "network");
        //replace 5 with function(d, i) { return d.weight * 4;}

        // add the text
        node.append("text")
            .attr("x", 12)
            .attr("dy", ".35em")
            .text(function (d) {
                return d.name;
            });

console.log("NETWORK 1.4.7");

        // add the curvy lines
        function tick() {
            path.attr("d", function (d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" +
                    d.source.x + "," +
                    d.source.y + "A" +
                    dr + "," + dr + " 0 0,1 " +
                    d.target.x + "," +
                    d.target.y;
            });

            node
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
        }

console.log("NETWORK 1.4.8");

        rmLoad();

console.log("NETWORK 1.4.9");

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

    function searchWordsViz(data1, maximum) {
        // Search Words word cloud visulization based on work by Jason Davies
        //searchWords text, size, allTerms

        listenTimeClick();
        d3.select("#" + timeSelection).classed("active", true);

        d3.select("#title").append("h1").text("What are you looking for?").attr("id", "viz_title");
        d3.select("#title").append("h2").text(uniqueTerms.length + " unique search terms with " + data1.length + " unique words used from: " + firstDate + " to: " + lastDate);
        d3.select("#below_visual").append("p").text("This is a cloud of the words you have used to search the web. The larger words were used in a greater number of different searches. Hover your mouse over each word for a tool-tip that shows all of the search terms where the word was used.").attr("id", "viz_p");

        //<p><label>Download:</label><a id="download-svg" href="#" target="_blank">SVG</a> |<a id="download-png" href="#" target="_blank">PNG</a>

        var fill = d3.scale.category20();
        d3.layout.cloud().size([960, 500])
            .words(data1)
            .padding(5)
            .rotate(function () {
                return 0;
            })
            .font("Impact")
            .fontSize(function (d) {
                var fontSizeCalc = d.size / maxCount;
                return log10(fontSizeCalc * 140) * 2;
            })
            //.fontSize(function(d) { return d.size * 20 })
            .on("end", draw)
            .start();
        function draw(words) {
            d3.select("#" + divName).append("svg")
                .attr("width", 960)
                .attr("height", 500)
                .attr("id", "visualization")
                .append("g")
                .attr("transform", "translate(480,250)")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function (d) {
                    return d.size + "px";
                })
                .style("font-family", "Impact")
                .style("fill", function (d, i) {
                    return fill(i);
                })
                .attr("text-anchor", "middle")
                .attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function (d) {
                    return d.text;
                })
                .append("svg:title")
                .text(function (d) {
                    return d.allTerms;
                });
        }

        rmLoad();
    }

    function dataTableViz(data, fulldata) {
        $("#option_items").append("<div id = \"options\"><h3>Data Table Options</h3><a id=\"day\">Website Domains Data</a><a id=\"week\">Search Term Data</a><a id=\"all\">All Visits</a></div>");

        //default
        d3.select("#day").classed("active", true);

        rmViz();
        loadTime();
        buildDomainTable(data);


        document.getElementById('day').addEventListener('click', function () {
            if (d3.select("#day").classed("active", false)) {
                d3.select("#day").classed("active", true);
            }
            if (d3.select("#week").classed("active", true)) {
                d3.select("#week").classed("active", false);
            }
            if (d3.select("#all").classed("active", true)) {
                d3.select("#all").classed("active", false);
            }
            rmViz();
            rmOpt();
            loadTime();
            buildDomainTable(data);
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
            rmViz();
            loadTime();
            dtChoice = 0;
            buildHistoryTable(fulldata);
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

            dtChoice = 1;
            loadTime();//not working
            buildHistoryTable(fulldata);
        });

        // allow table to export as .TSV - tab separated values: file http://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
    }

    function buildDomainTable(dataset) {
        //localStorage.removeItem("removals"); // clears local storage of removals, for debugging
        if (document.getElementById('domain_visualization')) {
            rmViz();
            rmOpt();
            $("#option_items").append("<div id = \"options\"><h3>Data Table Options</h3><a id=\"day\">Website Domains Data</a><a id=\"week\">Search Term Data</a><a id=\"all\">All Visits</a></div>");
            d3.select("#day").classed("active", true);
        }
        d3.select("#title").append("h1").text("Data Table");
        d3.select("#title").append("h2").text(dataset.length + " Websites visited from: " + firstDate + " to: " + lastDate).attr("id", "viz_title");
        d3.select("#title").append("button").text("Remove Checked Domains from History").attr("id", "remove");
        d3.select("#title").append("p").text("To view and/or remove search terms choose the Search Term Data option above. To view each visit to each website as a separate record choose All Visits.").attr("id", "visit");

        document.getElementById('remove').addEventListener('click', function () {
            if (confirm('Do you want to remove all visits to the checked domain(s) from your browser history FOREVER?')) {
                for (var i = 0; i < data.length; i++) {
                    if (document.getElementById("isSuppressed_" + i).checked) {
                        //get an array of objects, all of the URLs from a domain with their count
                        var urlArray1 = getSuppressedUrl(fullData1, "domain", data[i].counter); //data[i].counter is the domain name
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

//        var data = dataset.sort(dynamicSort("counter"));

        //build table
        var table = document.createElement('table');
//        table.style.border = "1px solid #ccc";
        table.id = "domain_visualization";

        document.getElementById(divName).appendChild(table);
        
        console.log('DATA: ' + JSON.stringify(dataset, 2) + ' :DATA');
        
        var tableData = [];
        
        for (var i = 0; i < dataset.length; i++)
        {
        	var dataObj = {};
        	dataObj['remove'] = dataset[i]['counter'];
        	dataObj['domain'] = dataset[i]['counter'];
        	dataObj['visits'] = dataset[i]['count'];
        	
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
        
        rmLoad();
    }

    function buildHistoryTable(dataset) {
        rmViz();
        console.log("rmViz");
        loadTime();
        console.log("spin not showing up");

        var headSearchTerms = "<b>Search Terms</b>";
        var headDate = "<b>Date</b>";

        //fullData1: id, url, urlId, protocol, domain, topDomain, searchTerms, date, transType, refVisitId, title
        if (dtChoice === 0) {
            dataST = onlyIf(dataset, "searchTerms", "", true);
            data = sortByProp(dataST, "searchTerms");
            d3.select("#title").append("h1").text("Data Table: Search Terms");
            headSearchTerms = "<b>Search Terms <span style=\"color:red\">&laquo;</span></b>";
        }
        else if (dtChoice === 1) {
            data = sortByPropRev(dataset, "date");
            d3.select("#title").append("h1").text("Data Table: All Visits");
            headDate = "<b>Date <span style=\"color:red\">&laquo;</span></b>";
        }

        d3.select("#title").append("h2").text(data.length + " records from: " + firstDate + " to: " + lastDate).attr("id", "viz_title");
        d3.select("#title").append("button").text("Remove Checked Items from History").attr("id", "remove");
        $('#title').append("<div id=\"visit\"><p>Press &#8984;F (mac) or Ctrl+F (windows) to search this table.</p></div>");

        document.getElementById('remove').addEventListener('click', function () {
            if (confirm('Do you want to permanently remove all checked items from your browser history?')) {
                for (var i = 0; i < data.length; i++) {
                    if (document.getElementById("isSuppressed_" + i).checked) {
                        var url = data[i].url;
                        var urlInd = findIndexByKeyValue(urlArray, "url", url);
                        var vc = urlArray[urlInd].vc;
                        var obj1 = {url: url, visitCount: vc};
                        removeHistory(obj1, false);
                    }
                }
                selectViz("data_table", true);
                d3.select("#title").append("h3").text("Removed checked information from browser history.").attr("id", "removed");
            }
        });

        document.getElementById('day').addEventListener('click', function () {
            dataTableData(dataset, dataTableViz);
        });

        //build table
        var table = document.createElement('table');
        table.id = "search_visualization";
        document.getElementById(divName).appendChild(table);
        
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


        rmLoad();

        $('table#visualization').bootstrapTable();
    }

    function submitViz(data) {
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

    function noViz(data) {
        //nothing
        rmLoad();
    }

//Interface
    function selectViz(viz_selection) {
        console.log('DATA: ' + JSON.stringify(visualData[0], 2) + ' :ATAD');    
    
        var timePeriod = "Time Period</h3><a id=\"day\">One day</a><a id=\"week\">One week</a><a id=\"month\">One month</a><a id=\"all\">All available</a><a id=\"choose\">Choose Time</a></div>";
        
        var filteredData = [];

		var start = 0;
		
		if (startDate != null)
			start = startDate.getTime();
			
		var end = Number.MAX_VALUE;

		if (endDate != null)
			end = endDate.getTime();
		
        for (var i = 0; i < visualData.length; i++)
        {
            if (i % 1000 == 0)
            	console.log(visualData[i].date + " >? " + start);
            	
        	if (visualData[i].date < end && visualData[i].date > start)
				filteredData.push(visualData[i]);
        }
        
        console.log('FILTERED: ' + filteredData.length);
        
        if (viz_selection === "network") {
            rmViz();
            rmOpt();
//            $("#option_items").append("<div id = \"options\"><h3>Choose a Visualization</h3><p><a id=\"search_words\">Search Words</a> <a id=\"web_visit\">Web Visits</a> <a id=\"data_table\">Data Table</a></p><h3>Network Options: "+timePeriod);

            networkData(filteredData, networkViz);
            visualizationSelection();

        }
        else if (viz_selection === "search_words") {
            rmViz();
            rmOpt();
//            $("#option_items").append("<div id = \"options\"><h3>Choose a Visualization</h3><p><a id=\"network\">Network</a> <a id=\"web_visit\">Web Visits</a> <a id=\"data_table\">Data Table</a></p><h3>Search words options: "+timePeriod);
            searchWordsData(filteredData, searchWordsViz);
            visualizationSelection();
        }
        else if (viz_selection === "web_visit") {
            rmViz();
            rmOpt();
//            $("#option_items").append("<div id = \"options\"><h3>Choose a Visualization</h3><p><a id=\"search_words\">Search Words</a> <a id=\"network\">Network</a> <a id=\"data_table\">Data Table</a></p> <h3>Websites visited options: "+timePeriod);
            webVisitData(filteredData, webVisitViz);
            visualizationSelection();
        }
        else if (viz_selection === "data_table") {
            rmViz();
            rmOpt();
//            $("#option_items").append("<div id = \"options\"><h3>Choose a Visualization</h3><p><a id=\"search_words\">Search Words</a> <a id=\"network\">Network</a> <a id=\"web_visit\">Web Visits</a></p> ");
            dataTableData(filteredData, dataTableViz);
            visualizationSelection();
        }
    }

    function selectTime(time) {
        timeSelection = time;
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

        visualData = onlyBetween(fullData1,"date",lowVal,highVal);
        selectViz(vizSelected);
        console.log("visualData: ",visualData.length);
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

                    visualData = onlyBetween(fullData1,"date",lowVal,highVal);
                    selectViz(vizSelected);
                    timeSelection = "choose";
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

function visualizationSelection() {
	 //visualization selection
            $("#network").click(function() {
//            	loadTime();
                selectViz("network");
                d3.selectAll("#viz_selector a").classed("active", false);
                d3.select("#network").classed("active", true);
                vizSelected = "network";
            });
            $("#web_visit").click(function() {
                selectViz("web_visit");
                d3.selectAll("#viz_selector a").classed("active", false);
                d3.select("#web_visit").classed("active", true);
                vizSelected = "web_visit";
            });
            $("#search_words").click(function() {
                selectViz("search_words");
                d3.selectAll("#viz_selector a").classed("active", false);
                d3.select("#search_words").classed("active", true);
                vizSelected = "search_words";
            });
            $("#data_table").click(function() {
                selectViz("data_table");
                d3.selectAll("#viz_selector a").classed("active", false);
                d3.select("#data_table").classed("active", true);
                vizSelected = "data_table";
            });
}

	function refresh()
	{
		if (vizSelected != null)
			selectViz(vizSelected)	
	}
	
	
	//Putting it all together
    $("document").ready(function () 
    {
		$("#navbar").hide();

		$('[data-toggle="tooltip"]').tooltip();
		$('.datepicker').datepicker();
		
		$("input#start_date").change(function()
		{
			var value = $("input#start_date").val();
			
			if (value != "")
			{
				var tokens = value.split("/");
				
				startDate = new Date(parseInt(tokens[2]), parseInt(tokens[0]) - 1, parseInt(tokens[1]), 0, 0, 0, 0);
				
				refresh();
			}
			else
				startDate = null;
		});

		$("input#end_date").change(function()
		{
			var value = $("input#end_date").val();
			
			if (value != "")
			{
				var tokens = value.split("/");
				
				endDate = new Date(parseInt(tokens[2]), parseInt(tokens[0]) - 1, parseInt(tokens[1]), 23, 59, 59, 999);
				
				refresh();
			}
			else
				startDate = null;
		});
		
        //Get all data into fullData1
        getUrls(noTransform, noViz, function()
        {
            //New default, append images for visualization chooser
            $('#viz_selector').show();
            $("#navbar").show();

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
						fullData1 = [];
						fullData1 = root.data;
						visualData = [];
						visualData = root.data;
						console.log("file load success");
						console.log("fullData1: ",fullData1.length);
						console.log("visualData: ",visualData.length);
						timeSelection = "all";
						selectViz(vizSelected);
					}
				});
			});
			
			$('#upload_modal').on('show.bs.modal', function (e) 
			{
				var dayBundles = {};
				var dayIndices = [];
								
				for (var i = 0; i < visualData.length; i++)
				{
					var date = moment(visualData[i]["date"]);
					
					var dayString = date.format("MMMM Do");
					
					var dayList = dayBundles[dayString];
					
					if (dayList == undefined)
					{
						dayList = [];
						dayBundles[dayString] = dayList;
						dayIndices.push(dayString);
					}
					
					dayList.push(visualData[i]);
				}
			
				$("#modal_overview").html(dayIndices.length + " days to upload (" + dayIndices[0] + " to " + dayIndices[dayIndices.length - 1] + ").");

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
						$('#upload_modal').modal('hide');
					};
					
					chrome.identity.getProfileUserInfo(function(userInfo)
					{
						uploadPassiveData(CryptoJS.MD5(userInfo.email).toString(), bundles, 0, onProgress, onComplete);
					});
				});
			});

            $("#submit").click(function() {
                console.log("submit click");
                d3.selectAll("#viz_selector a").classed("active", false);
                console.log("submit click if");
                dateForward = Infinity;
                timeSelection = "all";
                submissionData(submitViz);
            });

			visualizationSelection();
        });
    });
}
wrapper();