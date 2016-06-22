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
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along
 with this program; if not, write to the Free Software Foundation, Inc.,
 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA. 
*/

define(["moment", "../app/config", "../app/utils"], function (moment, config, utils) 
{
    //if (lastUlD === "Never" && used > 3 times) {
	    //window.onbeforeunload = function (e) {
	    //e = e || window.event;
	    //return 'Will you consider opting-in to the research project? Click the cloud icon in the the top right corner.';
		//};
	//}
    
  var history = {};
  
  history.fullData = [];
  history.timeSelection = "all";
  history.earliestTimestamp = Number.MAX_VALUE;
  history.latestTimestamp = Number.MIN_VALUE;
  history.urlArray = [];
  
  var startDate = null;
  var endDate = null;

  var manifest = chrome.runtime.getManifest();

//globals 
  var divName = "visual_div";
  var now = new Date();
  var timeSelect = 0; //null = 24 hours, 0 = all time
  var dateLimit = new Date(now.getTime());
  dateLimit.setDate(now.getDate() - 91);
  var dateForward = Infinity;

  var vizSelected = null;
  var firstDate = "";
  var lastDate = "";
  var visualData = [];
  var ids = [];

  function storeCats(callback) {
    var catStored = sessionStorage.getItem('cats');
		if (catStored === null){
			var cats = [];
      $("#progress_bars").html("<h1>One moment please...</h1><p>Fetching website categories.</p>");
	   	$.getJSON(config.categoriesUrl, function (cat) {		  
        for (var j in cat.children) {
			    cats.push({search: cat.children[j]["search"], category: cat.children[j]["category"], value: cat.children[j]["value"]});
		    }
        }).fail(function(){
        	console.log("Error! JSON file not found or invalid formatting");
        	cats.push({search: "domainExact", category: "Other", value: " "});
        	callback(cats);
        }).done(function() {
    		sessionStorage.setItem("cats", JSON.stringify(cats));
  		});
      //console.log("Categories stored");
      $("#progress_bars").hide();
      callback();
		}
		else {
      //console.log("Categories already stored");
      $("#progress_bars").hide();
      callback();
		}
	}

//Getting data from Chrome History & creating the base dataset
    function getUrls(callback, viz, callback2) {
        var end = now.getTime();
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

    	var worker = new Worker("js/app/fetch-worker.js");
      
      

    	worker.onmessage = function(event){
    		if (event.data["action"] == "updateProgress") {
		
    			var currentProgress = (100 * ((itemCount - event.data["count"]) / itemCount)).toFixed(0) + '%';

    			if (lastPercentage != currentProgress)
    			{
    				$("#visit_progress").width(currentProgress);
    				$("#visit_progress").html(currentProgress);
	
    				lastPercentage = currentProgress;

    				$("input#start_date").datepicker("setDate", new Date(event.data["earliest"]));
    				$("input#end_date").datepicker("setDate", new Date(event.data["latest"]));
    			}
    		}
				
    		if (event.data["finished"] != undefined) {
    			$("#transform_progress").width("100%");
    			$("#transform_progress").html("100%");
		
    			history.fullData = event.data["items"];

    			visualData = event.data["items"];
    			utils.sortByProperty(visualData,"date");
    			callback2();
    			callback(visualData, viz);
	
    			$("#progress_bars").hide();
	
    			chrome.storage.local.get({ 'upload_identifier': '' }, function (result) 
    			{
    				if (result.upload_identifier == "")
    				{
    					requirejs(["historian", "../app/config"], function (historian, config) 
    					{
    						historian.fetchUserId(config.fetchIdUrl, function(user_id) {
    							$("#identifier_modal").modal("show");
			
    							$("#field_identifier").val(user_id);
	
    							$("#chose_identifier").click(function(eventObj)
    							{
    								eventObj.preventDefault();

    								var identifier = $("#field_identifier").val();

    								if (identifier != null && identifier != "")
    								{
    									chrome.storage.local.set({ 'upload_identifier': identifier }, function (result) 
    									{
    										$("#identifier_modal").modal("hide");
		
    										// console.log("SAVED");
    									});
    								}
			
    								return false;
    							});
    						});
    					});
    				}
    			});
    		}
	
    		if (event.data["action"] == "fetchHistory") {
    //				console.log('WORKER POSTED: ' + JSON.stringify(event.data));
		
    		    var historyItem = event.data["historyItem"];
    			chrome.history.getVisits({url: historyItem.url}, function (visitItems) 
    			{
    				worker.postMessage({ "visitItems": visitItems, "historyItem": historyItem });
    			});     
    		}
    	};

    	worker.postMessage({ "data": data });
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
    };
	
    history.getSuppressedUrl = function(data, key, value) 
    {
        var index = history.findIndexArrByKeyValue(data, key, value);
        var urlArray1 = [];

        index.forEach(function (a) {
            var url = data[a].url;

            var urlInd = utils.findIndexByKeyValue(history.urlArray, "url", url);
            
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
            var d = new Date();
            chrome.history.deleteUrl({url: url1});
            var removalRecord = {timeRemoved: d.getTime(), numUrls: 1, numVisits: visits};
            storeRemovalData(removalRecord);
        }
        
        getUrls(noTransform, noViz, function() {

        });
    };
	
    function storeSvyEnd(data) {
        //add or replace object (data) to local storage, timeStored: , endType: 1 = success, 0 = end
        var arr = [];
        arr.push({timeStored: data.timeStored, endType: data.endType});
        localStorage.setItem("svyEnd", JSON.stringify(arr));
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

    function onlyBetween(obj, property, lowVal, highVal) {
        //returns an array with only the property values between the high/low values specified
        var data = [];
        obj.forEach(function(a){
            var prop = a[property];
            
//            console.log("TEST: " + lowVal + " <= " + prop + " <=" + highVal);
            
            if (prop >= lowVal && prop <= highVal) {
                data.push(a);
            }
        });

        return data;
    }
//Passing data to visualizations

    function submissionData(callback) {
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
        callback(data);
    }


    function noViz(data) {
        //nothing
    }

	history.compareWeekVisits = function(startDate, data, callback) {
		var weekAend = startDate;
		var weekAstart = new Date (startDate.getFullYear(),startDate.getMonth(),(startDate.getDate()-7) );
		var weekBstart = new Date (startDate.getFullYear(),startDate.getMonth(),(startDate.getDate()-14) );

		var weekAendNum = weekAend.getTime();
		var weekAstartNum = weekAstart.getTime();
		var weekBstartNum = weekBstart.getTime();

	    data.sort(function(a, b) {
	    	if (a["date"] < b["date"])
	    		return -1;
	    	else if (a["date"] > b["date"])
	    		return 1;
	    		
	    	return 0;
	    });
		
		//before this week data array, this week data array
		var twd = onlyBetween(data, "date", weekAstartNum, weekAendNum);
		var lwd = onlyBetween(data, "date", weekBstartNum, weekAstartNum);

		var countA = twd.length;
		var countB = lwd.length;

		//search terms array (for each input)
		var stTwd = utils.generateTerms(twd);
		var stLwd = utils.generateTerms(lwd);

		if (stTwd.length > 0 && stLwd.length > 0) {
			//sort terms array
			var sStTwd = utils.sortByProperty(stTwd,"term");
			var sStLwd = utils.sortByProperty(stLwd,"term");
			//unique search terms array (for each)


			var ustTwd = utils.uniqueCountST(sStTwd, "term");
			var ustLwd = utils.uniqueCountST(sStLwd, "term");
			//search words array (for each)

			var swTwd = utils.searchTermsToWords(ustTwd);
			var swLwd = utils.searchTermsToWords(ustLwd);
			//sort words

			var sSwTwd = utils.sortByProperty(swTwd, "word");
			var sSwLwd = utils.sortByProperty(swLwd, "word");
			//unique search words, cleaned and counted (for each input) - swbtw (search words before this week), swtw (search words this week) properties word, count

			var swlw = utils.searchWordsFun(sSwLwd, ustLwd);
			var swtw = utils.searchWordsFun(sSwTwd, ustTwd);
			var maxCountLwSize = Math.max.apply(Math,swlw.map(function(swlw){return swlw.size;}));
			var indexMaxCountLwSize = utils.findIndexByKeyValue(swlw,"size",maxCountLwSize);
			var maxCountTwSize = Math.max.apply(Math,swtw.map(function(swtw){return swtw.size;}));
			var indexMaxCountTwSize = utils.findIndexByKeyValue(swtw,"size",maxCountTwSize);

			//sort arrays by domain (this week data sorted domain)
			var lwdSd = utils.sortByProperty(lwd,"domain");
			var twdSd = utils.sortByProperty(twd,"domain");
			//unique domains with count (domains this week, domains last week)
			var dlw = utils.countsOfProperty(lwdSd, "domain");
			var dtw = utils.countsOfProperty(twdSd, "domain");
			//find the max value
			var maxDlw = Math.max.apply(Math,dlw.map(function(dlw){return dlw.count;}));
			var maxDtw = Math.max.apply(Math,dtw.map(function(dtw){return dtw.count;}));
			//find the index of the item with the max value
			var indexMaxCountLwDs = utils.findIndexByKeyValue(dlw,"count",maxDlw);
			var indexMaxCountTwDs = utils.findIndexByKeyValue(dtw, "count", maxDtw);
			//displaying results
			if (countA >countB) { percentML = "more than";} 
			if (countA < countB) { percentML = "less than"; }
			if (countA == countB) {	percentML = "the same as"; }
			var percent = Math.round(Math.abs( ((countA-countB) / (countB)) * 100));
			var topDomainLw = dlw[indexMaxCountLwDs].counter;
			var topDomainTw = dtw[indexMaxCountTwDs].counter;
		
			var topTermLw = swlw[indexMaxCountLwSize].text;
			var topTermTw = swtw[indexMaxCountTwSize].text;
		
			var weekCompareData = {
				weekAend: weekAend,
				weekAstart: weekAstart,
				weekBend: weekAstart,
				weekBstart: weekBstart,
				percent: percent,
				percentML: percentML,
				topDomainLw: topDomainLw,
				topDomainTw: topDomainTw,
				topTermLw: topTermLw,
				topTermTw: topTermTw
			};
			callback(weekCompareData);
		}
	};
  function showHome (){
    //append images for visualization chooser
    $('#viz_selector').show();
    $("#navbar").show();
    $("#nav_review").hide();
      
    var svyEndData = localStorage.getItem('svyEnd');
  	var svyEndObj = JSON.parse(svyEndData);
  	svyEndType = null;
  	if (svyEndObj !== null){
  		svyEndType = svyEndObj[0].endType;
  	}
    
		history.compareWeekVisits(now, visualData, history.wir);

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
      
          			if (dayIndices.length > 0)
          			{
          				if (dayIndices.length == 1)
							$("#modal_overview").html("1 day to upload (" + dayIndices[0]+ ").");
						else
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
			
						var myid = chrome.runtime.id + "&prev="; // plus prev status!*
		
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
							chrome.tabs.create({url: toList[0].url + myid, active: false});
							$("ul#progress_actions_list").html(output);
						}
			
						$("a.wh_action").click(function(eventObj)
						{
							var actionId = $(eventObj.target).attr("id").substring(3);
				
							result.completedActions.push(actionId);

							chrome.storage.local.set({ 'completedActions': result.completedActions }, function (result) 
							{
								// console.log("SAVED");
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
									$("#nav_review").show();
									$("#research").hide();
									//show participation date								
					
									chrome.browserAction.setIcon({
										path: "images/star-yellow-64.png"
									});	

									chrome.browserAction.setTitle({
										title: "Web Historian"
									});	
								});
							};

							chrome.storage.local.get({ 'upload_identifier': '' }, function (result) 
							{
								requirejs(["passive-data-kit", "crypto-js-md5"], function(pdk, CryptoJS) 
								{
									pdk.upload(config.uploadUrl, CryptoJS.MD5(result.upload_identifier).toString(), 'web-historian', bundles, 0, onProgress, onComplete);
								});                 
							});
						});
					}
					else
					{
						$('#upload_modal').modal("hide");
				
						alert("You have already uploaded your data.");
					}
                  });
              });
          });

          $("#submit").click(function() {
              d3.selectAll("#viz_selector a").classed("active", false);
              dateForward = Infinity;
              history.timeSelection = "all";
          });
      
		$("#link_access_server").click(function(eventObj)
		{
			eventObj.preventDefault();

			chrome.storage.local.get({ 'upload_identifier': '' }, function (result) 
			{
				requirejs(["passive-data-kit", "crypto-js-md5"], function(pdk, CryptoJS) 
				{
					var now = new Date();
			
					var month = "" + (now.getMonth() + 1);
					var day = "" + now.getDate();
			
					if (month.length < 2)
					{
						month = '0' + month;
					}

					if (day.length < 2)
					{
						day = '0' + day;
					}
			
					var isoDate = now.getFullYear() + '-' +  month + '-' + day;
			
					var sourceId = CryptoJS.MD5(CryptoJS.MD5(result.upload_identifier).toString() + isoDate).toString();
			
					var newURL = config.reviewUrl + sourceId; //add participation status*
					chrome.tabs.create({ url: newURL });
				});                 
			});
	
			return false;
		});
  }
    
    history.wir = function(weekData) {
        $("#cards").append("<div id=\"wir\"></div>");
        $("#wir").html( function() {
            	var aEnd = moment(weekData.weekAend).format("ddd MMM D");
				var aStart = moment(weekData.weekAstart).format("ddd MMM D");
				var bEnd = moment(weekData.weekBend).format("ddd MMM D");
				var bStart = moment(weekData.weekBstart).format("ddd MMM D");
				var percent = weekData.percent;
				var percentML = weekData.percentML;
				var topDomainLw = weekData.topDomainLw;
				var topDomainTw = weekData.topDomainTw;
				var topTermLw = weekData.topTermLw;
				//var topTermListLw = weekData.topTermListLw;
				//problems implementing tooltips to display this data
				var topTermTw = weekData.topTermTw;
				//var topTermListTw = weekData.topTermListTw;
				
				if (lastUl > 1) {
					lastUlD = moment(lastUl).format("MMM DD, YYYY");
				}
				else {lastUlD = "Never";}
				
				if (topTermLw === topTermTw){
					topTermLwD = "the same";
				}
				else {topTermLwD = "<strong>" + topTermLw + " </strong>";}
				
				if (topDomainTw === topDomainLw) {
					topDomainLwD = "the same";
				}
				else { topDomainLwD = "<strong><a href=\"http://" + topDomainLw + "\" target=\"_blank\">" + topDomainLw + "</a></strong>";}
				
				var dataStartDate = utils.startDate();
				
				var weekInReview = "<h3>Week in review</h3><p>This week (" + aStart + " to " + aEnd +  ")" + " you browsed the web <strong>" + percent + "% " + percentML + "</strong> last week (" + bStart + " to " + bEnd + ").</p> <p>The website you visited the most this week was <strong><a href=\"http://"+ topDomainTw +"\" target=\"_blank\">" + topDomainTw + "</a></strong>. It was " + topDomainLwD + " last week. For more details on web site visits see the Web Visits visual <span class=\"glyphicon glyphicon-globe\"></span></p> <p>The search term you used the most this week was <strong>"+ topTermTw +"</strong></div>. It was "+ topTermLwD +" last week. For more details on search term use see the Search Terms visual <span class=\"glyphicon glyphicon-search\"></span></p>";
				//Your central jumping-off point for browsing the web this week was * this week. It was * last week.
				//of the # websites you visited over the past # days, you visited * the most, but you visited * on the most different days. 
				var footer = "<hr><p>You last uploaded your browsing data on: "+ lastUlD +"</p> <p>For more information about Web Historian visit <a href=\"http://webhistorian.org\" target=\"blank\">http://webhistorian.org</a>.</p>";
				var thanks = "<h3>Thank you for participating in our study!</h3><p>For more information about the project see \"<a href=\" http://www.webhistorian.org/participate/\" target=\"_blank\">Understanding Access to Information Online and in Context\"</a>. For updates on reports and to participate in further studies <a href=\""+config.endSvyUrls[0]+"\" target=\"_blank\">click here to sign up</a>. Two months after your first data upload you will be asked for a follow-up contribution. </p>";
				var notEnoughData = "<h3>Week in Review</h3><p>The week in review compares this week's web browsing to the previous week. To see the week in review feature you can keep browsing in Chrome witout clearing your history until you have 14 days of browsing. If you changed the dates you are viewing with the calendar, just expand the range between the start and end date to 14 days or more.</p>";
				
				if (lastUlD === "Never" && weekData.weekBstart >= dataStartDate) {
            		$("#research").show();
            		return weekInReview + footer;
            	}
            	else if (lastUlD === "Never" && weekData.weekBstart < dataStartDate) { 
            		$("#research").show();
            		return notEnoughData + footer; 
            		} 
                else if (svyEndType === 0 && weekData.weekBstart >= dataStartDate){
            		return weekInReview + footer;
            	}
            	else if (svyEndType === 0 && weekData.weekBstart < dataStartDate){
            		return notEnoughData + footer;
            	}
            	else if (lastUlD !== "Never" && svyEndType === null){
            		$("#navbar").hide();
            		$('#viz_selector').hide();
            		$.get(config.actionsUrl, function(actions){
						var link = "<a href='" + actions[0].url + chrome.runtime.id + "' target='_blank' class='wh_action' id='wh_svy_link'> Survey Link</a>";
						$("#wir").html("<h3>Please complete your survey for the research project '<a href='http://www.webhistorian.org/participate/' target='_blank'>Understanding Access to Information Online and in Context</a>.':</h3><br><h3 style='text-align:center'>" + link + "</h3><p><a href=''>Please reload this page when you complete the survey.</a>");
					});
            	}
            	else if (lastUlD !== "Never" && svyEndType === 1 && weekData.weekBstart >= dataStartDate) { 
            		$("#nav_review").show();
            		return weekInReview + thanks + footer; 
            		}
            	else if (lastUlD !== "Never" && svyEndType === 1 && weekData.weekBstart < dataStartDate) { 
            		$("#nav_review").show();
            		return notEnoughData + thanks + footer; 
            		}
            	else { $("#research").show(); return footer; console.log("condition not specified"); }; 
            	    	 
            });
    };
    
    //insert the code for the cards, but doesn't display them (display: none)
    history.insertCards = function (){
$("#cards").html("<div id=\"research\" style=\"display: none;\"><h3>Using Web Historian <span class=\"glyphicon glyphicon-cloud-upload\"></span></h3><p>If you are over 18 years old and you live the U.S. you can take part in the research project \"<a href=\" http://www.webhistorian.org/participate/\" target=\"_blank\">Understanding Access to Information Online and in Context</a>.\" This project helps researchers understand our online world in more depth and with greater reliability than ever before. Just click the \"Participate in Research\" button <span class=\"glyphicon glyphicon-cloud-upload\"></span>. Participating takes about <strong>5 minutes</strong> and involves uploading your browsing data and completing a survey. Before you take part you can delete any data you don't want to upload using the Data Table <a href=\"#\" title id=\"data_table\"> <span class=\"glyphicon glyphicon-list\"></span></a>. Participation is <strong>opt-in only</strong> and your data is not transmitted online in any way if you choose not to participate, in fact you can use it when you are offline. Web Historian is client-side javascript you can use to visualize your browsing history data that is already on your computer.</p></div><div class=\"row\" id=\"viz_selector\" style=\"display: none;\"> <div class=\"col-sm-6 col-md-3\"> <a id=\"web_visit_card\"> <div class=\"thumbnail\"> <img src=\"images/visit.png\" alt=\"Web Visits\" /> <div class=\"caption\"> <h3>Web Visits</h3> <p> Circles sized by number of visits. </p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"search_words_card\"> <div class=\"thumbnail\"> <img src=\"images/wordCloud.png\" alt=\"Search Words\" /> <div class=\"caption\"> <h3>Search Terms</h3> <p> Words used in multiple web searches. </p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"network_card\"> <div class=\"thumbnail\"> <img src=\"images/network.png\" alt=\"Network\" /> <div class=\"caption\"> <h3>Network</h3> <p> Links between websites browsed from - to. </p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"data_table_card\"> <div class=\"thumbnail\"> <img src=\"images/table.png\" alt=\"Data Table\" /> <div class=\"caption\"> <h3>Data Table</h3> <p> See the details of each web visit with an option to delete specific records. </p> </div> </div> </a> </div>");
    };
    
  //Putting it all together
  $("document").ready(function () 
  {
    $("#navbar").hide();
    chrome.storage.local.get('lastPdkUpload', function (result) {
      lastUl = result.lastPdkUpload;
 		});
 		
      history.insertCards();
      //Get all data into fullData1
      getUrls(noTransform, noViz, function()
      {
        storeCats(showHome);
    });
  });

    return history;
});
