define(["moment", "app/config", "app/utils"], function (moment, config, utils) 
{   
  var history = {};
  
  history.fullData = [];
  history.urlArray = [];
  var leaveOnce = 0;
  
  var startDate = null;
  var endDate = null;

  var manifest = chrome.runtime.getManifest();

//globals 
  var divName = "visual_div";
  var now = new Date();
  var timeSelect = 0; //null = 24 hours, 0 = all time
  var dateForward = Infinity;
  var svyTab = 1;

  var firstDate = "";
  var lastDate = "";
  var visualData = [];
  var ids = [];
  
  var nintyAgo = now.getTime() - 7776000000;
  var dumbStartEnd = [{start: nintyAgo, end: now.getTime()}];
  sessionStorage.setItem("se", JSON.stringify(dumbStartEnd));

  function storeStartEnd(data){
    var startEnd = [];
    var seStored = sessionStorage.getItem('se');

      var end = data[0].date;
      var start = data[0].date;
      for (i=1;i<data.length;i++) {
        if (data[i].date > end) {
          end = data[i].date;
        }
        if (data[i].date < start) {
          start = data[i].date;
        }
      }
      if (start != null){
        startEnd.push({start: start, end: end});
        sessionStorage.setItem("se", JSON.stringify(startEnd));
      }
    
  }
  
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
          sessionStorage.setItem("cats", JSON.stringify(cats));
          callback();
        }).done(function() {
        sessionStorage.setItem("cats", JSON.stringify(cats));
      });
      $("#progress_bars").hide();
      callback();
    }
    else {
      $("#progress_bars").hide();
      callback();
    }
  }
  
  function chooseId () {
		$("#chose_identifier").off('click');
    $("#chose_identifier").click(function(eventObj) {
			eventObj.preventDefault();
      $(".modal-title").html("Your Identifier");
			var identifier = $("#field_identifier").val();
			if (identifier != null && identifier != undefined && identifier != "")	{
				var allowed = /^[-a-zA-Z0-9_ ]*$/;
        if (identifier.match(allowed)) {
          chrome.storage.local.set({ 'upload_identifier': identifier }, function (result) {
  					$("#identifier_modal").modal("hide");
  				});
        }
        else {
          $("#id-body").append("<p>Please remove special characters, only alpha-numeric, space - and _ allowed.</p>")
        }
			}
			return false;
		});
  }
  
  function svyLink(callback){
    requirejs(["app/config"], function (config) {
      $("#loader").html("<br/><br/><h1>One moment please.</h1><br/><br/><br/><br/>");
      $.get(config.actionsUrl)
      .error(function(jqXHR, textStatus, errorThrown){
        $("#loader").hide();
        callback("");
      })
      .success(function(actions){
        $("#loader").hide();
        chrome.storage.local.get({ 'before': ''}, function(result){
          var prev = result.before;
          chrome.storage.local.get({ 'upload_identifier': ''}, function(result){
            var hId1 = result.upload_identifier;
            var hId = hId1.replace(/ /g, "%20");
            var svyUrl1 = actions[0].url + "&whId="+ chrome.runtime.id + "&prev=" + prev + "&hId=" + hId;
            callback(svyUrl1);
          });
        });
      });
    });
  }
  
  function autoAssignId() {
    requirejs(["historian", "app/config"], function (historian, config) {
      historian.fetchUserId(config.fetchIdUrl, function(user_id) {
        var identifier = user_id;
        if (identifier != null && identifier != "")  {
          chrome.storage.local.set({ 'upload_identifier': identifier }, function (result) {
        });
      }
    });
  });
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
          
          chrome.storage.local.get({ 'upload_identifier': ''}, function(result){
            if (result.upload_identifier == "") {
              autoAssignId();
            }
          });
          
          chrome.storage.local.get({ 'study': '' }, function (result) 
          {
            if (result.study == "") {
              function welcomeModal (){
                $("#welcome_modal").modal("show");
                $("#choose_welcome").click(function(eventObj) {
                  var selectedP = $("input[type='radio'][name='optProj']:checked");
                  var selectedValProj = selectedP.val();
                  chrome.storage.local.set({ 'study': selectedValProj });
                  var selectedB = $("input[type='radio'][name='optBefore']:checked");
                  var selectedValBefore = selectedB.val();
                  chrome.storage.local.set({ 'before': '0' });
                
                  if (selectedValProj === "0" && selectedValBefore === "0"){
                    $("#welcome_modal").modal("hide");
                  }
                  else if (selectedValProj === "1" && selectedValBefore === "0"){
                    $("#welcome_modal").modal("hide");
                    $("#identifier_modal").modal("show");
                    $("#id-body").html("Please enter the study ID you were provided with. Please double check that it is correct before continuing. We cannot match you to the study or provide any incentives to you if your ID is entered incorrectly.</p> <fieldset class='form-group' id='idChoice'><input type='text' class='form-control' id='field_identifier' placeholder='Enter identifier here&#8230;' /></fieldset>");
                    $("#back").show();
                    $("#back").click(function(){
                      $("#identifier_modal").modal("hide");
                      welcomeModal();
                    });
                    chooseId();
                  }
                  else if (selectedValProj === "0" && selectedValBefore === "1"){
                    $("#welcome_modal").modal("hide");
                    $("#identifier_modal").modal("show");
                    $("#id-body").html("Have you participated in Web Historian's research project 'Understanding Access to Information Online and in Context' by uploading your data and completing the survey? <label class='radio-inline'><input type='radio' name='optPar' value='1'>Yes</label> <label class='radio-inline'><input type='radio' name='optPar' value='0'>No</label>");
                    $("#back").show();
                    $("#back").click(function(){
                      $("#identifier_modal").modal("hide");
                      welcomeModal();
                    });
                    $("#chose_identifier").off('click');
                    $("#chose_identifier").click(function(eventObj) {
                      var selectedPar = $("input[type='radio'][name='optPar']:checked");
                      var selectedValPar = selectedPar.val();
                      chrome.storage.local.set({ 'before': selectedValPar });
                      
                      if (selectedValPar === "0"){
                        $("#identifier_modal").modal("hide");
                      }
                      else if (selectedValPar === "1"){
                        $("#id-body").html("To combine your history from this browser with the other history you uploaded please enter the Web Historian ID from your first upload. On the browser you first uploaded from this ID is availabe in the Settings at the bottom of the home page of Web Historian. The ID was also provided to you when you uploaded your data. <fieldset class='form-group' id='idChoice'><input type='text' class='form-control' id='field_identifier' placeholder='Enter identifier here&#8230;' /></fieldset> Your visualizations in this extension will be from the history on this computer only, but if you upload your history data from this browser ( click <span class='glyphicon glyphicon-cloud-upload'></span>) and complete the short survey about this additional data you will be able to view your combined history on the server from either browser when this icon appears on the menu bar: <span class='glyphicon glyphicon-export'></span><p>If you want to enter your ID from your previous installation later you can do so via the Settings link on the bottom of the Web Historian home page.</p>");
                        chooseId();
                        $("#back").show();
                        $("#back").click(function(){
                          $("#identifier_modal").modal("hide");
                          welcomeModal();
                        });
                      }
                    });
                  }
                  else if (selectedValProj === "1" && selectedValBefore === "1"){
                    $("#welcome_modal").modal("hide");
                    $("#identifier_modal").modal("show");
                    $("#id-body").html("Please enter the study ID you were provided with.</p><fieldset class='form-group' id='idChoice'><input type='text' class='form-control' id='field_identifier' placeholder='Enter identifier here&#8230;' /></fieldset><br/> Your visualizations in this extension will be from the history on this computer only, but if you have uploaded history data previously from another browser, and you upload your history data from this browser ( click <span class='glyphicon glyphicon-cloud-upload'></span>) and complete the short survey about this additional data you will be able to view your combined history on the server when this icon appears on the menu bar: <span class='glyphicon glyphicon-export'></span>");
                    chooseId();
                    $("#back").show();
                    $("#back").click(function(){
                      $("#identifier_modal").modal("hide");
                      welcomeModal();
                    });
                  }
                });
              }
              welcomeModal();
            }
          });
        }
  
        if (event.data["action"] == "fetchHistory") {
    //        console.log('WORKER POSTED: ' + JSON.stringify(event.data));
    
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
    //only part of the delete process 
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
  
    function storeSvyEnd(data) {
        //add or replace object (data) to local storage, timeStored: , endType: 1 = success, 0 = end
        var arr = [];
        arr.push({timeStored: data.timeStored, endType: data.endType});
        localStorage.setItem("svyEnd", JSON.stringify(arr));
    }
    
    function storeActionUrl (url) {
      var arr = [];
      arr.push({actionUrl: url});
      localStorage.setItem("action", JSON.stringify(arr));
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
    var weekAstart = utils.lessDays(startDate,7);
    var weekBstart = utils.lessDays(startDate,14);

    var weekAendNum = weekAend.getTime();
    var weekAstartNum = weekAstart.getTime();
    var weekBstartNum = weekBstart.getTime();
    
    data = utils.sortByProperty(data, "date");
    
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
      if (countA == countB) {  percentML = "the same as"; }
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
      svyLink(function(url){ 
        var online = 0;
        if(url !== ""){
          online = 1;
        }
        callback(weekCompareData, online, url);
      });
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
    
    $("#settings").click(function(){
      chrome.storage.local.get(null, function (result) {
        var id = result.upload_identifier;
        var ulD = result.lastPdkUpload;
        var ulDate = moment(ulD);
        var dateOut = "Never";
        if (ulD != undefined){
          dateOut = moment(ulDate).format('dddd, MMMM Do YYYY, h:mm:ss a');
        }
        
        $("#identifier_modal").modal("show");
        $(".modal-title").html("Settings");
        
        $("#id-body").html("<p>Your Web Historian identifier is: <strong>" + id + "</strong></p><p>If you need to change your Web Historian Identifier you can <a id='changeIdSet'>click here</a>.</p><hr/><p>Your last upload was completed on: " + dateOut +"</p>");
        if (svyEndType === null && lastUl === undefined){
          $("#id-body").append("<hr/><p><a id='disableRemind'>Click here</a> to disable reminders to participate in the research project.</p>")
          $("#disableRemind").click(function(){
          	var noStudy = {timeStored: now.getTime(), endType: 0};
          	storeSvyEnd(noStudy);
            svyEndType = 0;
            alert("Research participation reminders have been disabled");
          });
        }
        
        $("#changeIdSet").click(function(){
          $("#id-body").html("<div class='alert alert-warning'><p><span class='glyphicon glyphicon-exclamation-sign' aria-hidden='true'></span> There are only a few cases when you might need to do this, e.g. you entered your study ID incorrectly or you entered your original installation ID incorrectly. <br/><br/>If this is not the case please do not change your ID, it could make your data less secure!</p></div><p>Change your Web Historian Identifier</p><fieldset class='form-group' id='idChoice'><input type='text' class='form-control' id='field_identifier' placeholder='Enter identifier here&#8230;' /></fieldset>");
      		$("#field_identifier").val(id);
          var elseBefore = 0;
          $("#chose_identifier").off('click');
      		$("#chose_identifier").click(function(eventObj) {
      			eventObj.preventDefault();
      			var identifier = $("#field_identifier").val();
      			if (identifier != null && identifier != undefined && identifier != "")	{
      				var allowed = /^[-a-zA-Z0-9_ ]*$/;
              if (allowed.test(identifier)===true) {
                chrome.storage.local.set({ 'upload_identifier': identifier }, function (result) {
        					$("#identifier_modal").modal("hide");
        				});
              }
              else {
                if (elseBefore === 0){
                  $("#id-body").append("<p>Please remove special characters, only alpha-numeric, space - and _ allowed.</p>");
                  elseBefore = 1;
                }
              }
      			}
      			return false;
      		});
        });
      });
      $("#chose_identifier").click(function(eventObj) {
        $("#identifier_modal").modal("hide");
      });
    });

    $('#upload_modal').on('show.bs.modal', function (e) {
      $(".modal-title").html("Upload Data to the Research Project");
      $("#par1").html("Click Participate to begin.")
      
      $("div#progress_actions").hide();
      chrome.storage.local.get({ 'lastPdkUpload': 0, 'completedActions': [] }, function (result) {
        $.get(config.actionsUrl)
          .error(function(jqXHR, textStatus, errorThrown){
            if (textStatus == 'timeout'){
              console.log('The server is not responding');
              $("div#progress_actions").html("The server is not responding. Please choose 'Cancel,' check your Internet connection and try again.");
              $("div#progress_actions").show();
            }
            if (textStatus == 'error') {
              console.log(errorThrown);
              $("div#progress_actions").html("The server is not responding. Please choose 'Cancel,' check your Internet connection and try again.");
              $("div#progress_actions").show();
            }
              
          })
          .success(function(actions){
          var lastUpload = 0;
          var latest = 0;
    
          if (result.lastPdkUpload != undefined)
            lastUpload = Number(result.lastPdkUpload);
      
          var dayBundles = {};
          var dayIndices = [];
          
          for (var i = 0; i < visualData.length; i++) {
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
      
          if (dayIndices.length > 0) {
            if (dayIndices.length == 1) {
              $("#modal_overview").html("1 day to upload (" + dayIndices[0]+ ").");
            } 
            else {
              $("#modal_overview").html(dayIndices.length + " days to upload (" + dayIndices[0] + " to " + dayIndices[dayIndices.length - 1] + ").");
            }
            var toList = [];
            var action = actions[0];
            toList.push(action);

            //$("div#progress_actions").hide();

            $("#upload_data").click(function(){
                $("div#progress_actions").show();
              
                var output = "";
                
                svyLink(function(url){
                  if (url !== ""){
                    var listItem = "<li> <a class='wh_action' id='wh_" + toList[0].identifier + "'>" + "Open Survey Tab" + "</a> </li>";
                    output += listItem;
                    chrome.tabs.onCreated.addListener(function(tab){
                      svyTab = tab.id;
                      $("#wh_initial_survey").click(function (){
                        chrome.tabs.update(svyTab, {"active": true});
                      });
                    });
                    chrome.tabs.create({url: url , active: false});
                    $("ul#progress_actions_list").html(output);
                  }
                  else {
                    var listItem = "<li>You must be online to take the survey, but your network is not currently responding. Please <a href=''>reload the extension</a> when you are online.</li>";
                    $("ul#progress_actions_list").html(listItem);
                  }
                });
              });
            
      
            $("a.wh_action").click(function(eventObj)
            {
              var actionId = $(eventObj.target).attr("id").substring(3);
        
              result.completedActions.push(actionId);

              chrome.storage.local.set({ 'completedActions': result.completedActions }, function (result) 
              {
                //console.log("SAVED");
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
                  $( "#nav_home" ).trigger( "click" );
                  $("#nav_review").show();
                  svyLink(function(url) {
                    if (url !== ""){
                      $("#research").html("<br/><br/><p>Thank you for participating! You can <a href='"+url+"' target='_blank'>Click here for another link to your survey</a> in case you closed the tab to your survey (you will pick up where you left off). Thanks again, your participation contributes to gaining a better understanding technology and society!<br/><br/>");
                    }
                  });
                  lastUl = now;
                  chrome.tabs.update(svyTab, {"active": true});               
                  chrome.browserAction.setBadgeText({ text: "" }); 
                  chrome.browserAction.setTitle({ title: "Web Historian" });  
                });
              };

              chrome.storage.local.get({ 'upload_identifier': '' }, function (result) 
              {
                requirejs(["passive-data-kit", "crypto-js-md5"], function(pdk, CryptoJS) 
                {
                  pdk.upload(config.uploadUrl, CryptoJS.MD5(result.upload_identifier).toString(), 'web-historian', bundles, 0, onProgress, onComplete);
                  
				  chrome.storage.local.get({ 'last_transmission_timestamp': 0 }, function (timeResult) 
	              {
	              	var now = timeResult['last_transmission_timestamp'];
	              	
	              	var removals = JSON.parse(localStorage.getItem("removals"));
	              	
	              	if (removals != null) {
	              		var toRemove = [];
	              		
	              		for (var i = 0; i < removals.length; i++) {
	              		  var removal = removals[i];
	              			
	              		  if (removal['timeRemoved'] > now) {
	              			removal['date'] = removal['timeRemoved'];
	              			    
	              			toRemove.push(removal);
	              		  }
	              		}
	              		
	              		if (toRemove.length > 0) {
							chrome.storage.local.get({ 'upload_identifier': '' }, function (result) 
							{
								requirejs(["passive-data-kit", "crypto-js-md5", "app/config"], function(pdk, CryptoJS, config) 
								{
									var onProgress = function(index, length) {

									};

									var onComplete = function() {
										var completeTime = (new Date()).getTime();
									
										chrome.storage.local.set({ 'last_transmission_timestamp': completeTime }, function() {

										});
									};
			
									pdk.upload(config.uploadUrl, CryptoJS.MD5(result.upload_identifier).toString(), 'web-historian-deletion', [toRemove], 0, onProgress, onComplete);
								});                 
							});
						}
	                }
	              });
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
      
          var newURL = config.reviewUrl + sourceId;
          chrome.tabs.create({ url: newURL });
        });                 
      });
  
      return false;
    });
  }
  function svyEnd (data){ //i=1 because the end item is the second one in the config
    for (i=1;i<data.length;i++) {
      if (data[i].url === config.endSvyUrls[1]) {
      	var noStudy = {timeStored: now.getTime(), endType: 0};
      	storeSvyEnd(noStudy);
      }
      if (data[i].url === config.endSvyUrls[0]) {
      	var study = {timeStored: now.getTime(), endType: 1};
      	storeSvyEnd(study);
        chrome.storage.local.set({ 'before': '1' });
      }
    }
  }
    
    history.wir = function(weekData, online, url) {
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
        
          //var seStored = JSON.parse(sessionStorage.getItem('se'));
          var dataStartDate = history.fullData[0].date; //seStored[0].start;
        
          var weekInReview = "<h3>Week in review</h3><p>This week (" + aStart + " to " + aEnd +  ")" + " you browsed the web <strong>" + percent + "% " + percentML + "</strong> last week (" + bStart + " to " + bEnd + ").</p> <p>The website you visited the most this week was <strong><a href=\"http://"+ topDomainTw +"\" target=\"_blank\">" + topDomainTw + "</a></strong>. It was " + topDomainLwD + " last week. For more details on web site visits see the Web Visits visual <span class=\"glyphicon glyphicon-globe\"></span></p> <p>The search term you used the most this week was <strong>"+ topTermTw +"</strong></div>. It was "+ topTermLwD +" last week. For more details on search term use see the Search Terms visual <span class=\"glyphicon glyphicon-search\"></span></p>";
          //Your central jumping-off point for browsing the web this week was * this week. It was * last week.
          //of the # websites you visited over the past # days, you visited * the most, but you visited * on the most different days. 
          var thanks = "<h3>Thank you for participating in our study!</h3><p>For more information about the project see \"<a href=\" http://www.webhistorian.org/participate/\" target=\"_blank\">Understanding Access to Information Online and in Context\"</a>. For updates on reports and to participate in further studies <a href=\""+config.endSvyUrls[0]+"\" target=\"_blank\">click here to sign up</a>. Two months after your first data upload you will be asked for a follow-up contribution. </p>";
          var notEnoughData = "<h3>Week in Review</h3><p>The week in review compares this week's web browsing to the previous week. To see the week in review feature you can keep browsing in Chrome witout clearing your history until you have 14 days of browsing. If you changed the dates you are viewing with the calendar, just expand the range between the start and end date to 14 days or more.</p>";
          var offline = "<div class='alert alert-warning'><p><span class='glyphicon glyphicon-wrench' aria-hidden='true'></span> Your browser is offline. Web Historian will function, but web site categories may be limited to 'Other' and you won't be able to participate in the research project until you are online.</p></div>";
          
          var weekHtml = "";
          $("#footer").show();

            if (lastUlD === "Never" && weekData.weekBstart >= dataStartDate) {
              $("#research").show();
              if(online===1){ weekHtml = weekInReview; }
              else { weekHtml = offline + weekInReview; }
            }
            else if (lastUlD === "Never" && weekData.weekBstart < dataStartDate) { 
              $("#research").show();
              if(online===1) { weekHtml = notEnoughData; }
              else { weekHtml = offline + notEnoughData; }
              } 
            else if (svyEndType === 0 && weekData.weekBstart >= dataStartDate){
              if(online===1) { weekHtml = weekInReview; }
              else { weekHtml = offline + weekInReview; }
            }
            else if (svyEndType === 0 && weekData.weekBstart < dataStartDate){
              if(online===1) { weekHtml = notEnoughData; }
              else { weekHtml = offline + notEnoughData; }
            }
            else if (lastUlD !== "Never" && svyEndType === null){
                if(url !== ""){
                  var link = "<a href='" + url + "' target='_blank' class='wh_action' id='wh_svy_link' style='color: blue;'> Your Survey Link</a>";
                  $("#research").show();
                  $("#research").html("<br/><br/><div class='alert alert-danger'><h3><span class='glyphicon glyphicon-exclamation-sign' aria-hidden='true'></span> Please complete your survey for the research project 'Understanding Access to Information Online and in Context.': " + link + "</h3><p>You will pick up right where you left off. When you have finished the survey you can <a href=''>reload</a> to remove this message.</div><br/><br/><br/>");
                }
                else {
                  weekHtml = offline + weekInReview;
                }
            }
            else if (lastUlD !== "Never" && svyEndType === 1 && weekData.weekBstart >= dataStartDate) { 
              $("#nav_review").show();
              if(online===1)
                weekHtml = weekInReview + thanks; 
              else
                weekHtml = offline + weekInReview + thanks;
              }
            else if (lastUlD !== "Never" && svyEndType === 1 && weekData.weekBstart < dataStartDate) { 
              $("#nav_review").show();
              if(online===1)
                weekHtml = notEnoughData + thanks; 
              else
                weekHtml = offline + notEnoughData + thanks;
              }
            else { $("#research").show(); console.log("condition not specified"); }; 
          
          return weekHtml;    
        });
      };
    
    //insert the code for the cards, but doesn't display them (display: none)
    history.insertCards = function (){
      $("#cards").html("<div id=\"research\" style=\"display: none;\"><h3>Using Web Historian </h3><p>The browser's 'back' button will not navigate within Web Historian, please use the navigation at the top right to explore your visualizations.</p><h3>Participate in Research</h3><p>If you are over 18 years old and you live the U.S. you can take part in the research project \"<a href=\" http://www.webhistorian.org/participate/\" target=\"_blank\">Understanding Access to Information Online and in Context</a>.\" This project is an important innovation in media research because it combines web browsing history with survey responses. This allows researchers to better answer complex questions about the relationship between web browsing and attitudes. <p>Eligible participants who complete the survey and provide a valid email address are entered to win a <strong>$100 Amazon gift card</strong>. Drawing will be held on December 10, 2016. <p><strong>To Participate:</strong></p> <ol> <li>Explore the visualizations to better understand your web browsing data. Delete anything you choose by right-clicking it in a visualization or using the Data Table.</li> <li>Click <a href='#' data-toggle='modal' id='submit' data-target='#upload_modal'>\"Participate in Research\"</a> here or using the cloud upload icon in the navigation bar <a href='#' data-toggle='modal' id='submit' data-target='#upload_modal'><span class=\"glyphicon glyphicon-cloud-upload\"></a></span>.</li> <li>Complete the short survey (about 5 minutes) that pops up once you start uploading your browsing data.</li> </ol> <p>Once you finish you will be able to view your uploaded data on the Web Historian server. This icon <span class='glyphicon glyphicon-export'></span> will appear in your navigation to allow you to do so. You will be able to see how you compare to other participants in your overall amount of browsing, the number of different websites your visit, and more.</p> <p>Participation is <strong>opt-in only</strong> and your data is not transmitted online in any way if you choose not to participate. </p> </div><div class=\"row\" id=\"viz_selector\" style=\"display: none;\"> <div class=\"col-sm-6 col-md-3\"> <a id=\"web_visit_card\"> <div class=\"thumbnail\"> <img src=\"images/visit.png\" alt=\"Web Visits\" /> <div class=\"caption\"> <h3>Web Visits</h3> <p> Circles sized by number of days a site was visited, or total visits to the site. </p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"search_words_card\"> <div class=\"thumbnail\"> <img src=\"images/wordCloud.png\" alt=\"Search Words\" /> <div class=\"caption\"> <h3>Search Terms</h3> <p> Words used in multiple web searches are larger. &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;</p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"network_card\"> <div class=\"thumbnail\"> <img src=\"images/network.png\" alt=\"Network\" /> <div class=\"caption\"> <h3>Network</h3> <p> Links between websites browsed from - to. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"time_card\"> <div class=\"thumbnail\"> <img src=\"images/time.png\" alt=\"Time\" /> <div class=\"caption\"> <h3>Time Heatmap</h3> <p> Hours of the day and days of the week when you browse the web the most. </p> </div> </div> </a> </div>");
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
      storeStartEnd(history.fullData);
      svyEnd(history.fullData);
      storeCats(showHome);
      $(document).mouseleave(function() {
        if (svyEndType === null && lastUl === undefined && leaveOnce === 0) {
          $("#upload_modal").modal("show");
          $(".modal-title").html("Thank you for using Web Historian!");
          $("#par1").html("<h3>Please consider participating in the research project.</h3><p> <a href='http://webhistorian.org/participate' target='blank'>Click here</a> for more information, or click the orange Participate button to begin uploading your data.");
          leaveOnce = 1;
        }
    });

    })
  });

    return history;
});
