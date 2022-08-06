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
            var hId = encodeURIComponent(hId1);
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
                'maxResults': (typeof browser == "undefined" ? 0 : Number.MAX_SAFE_INTEGER),
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
      
      document.body.scrollTop = document.documentElement.scrollTop = 0;

      var worker = new Worker("js/app/fetch-worker.js");

      worker.onmessage = function(event){
        if (event.data["action"] == "updateProgress") {
    
          var currentProgress = (100 * ((itemCount - event.data["count"]) / itemCount)).toFixed(0) + '%';
          
          if (lastPercentage != currentProgress)
          {
            $("#visit_progress").width(currentProgress);
            $("#visit_progress").text(currentProgress);
  
            lastPercentage = currentProgress;

            $("input#start_date").datepicker("setDate", new Date(event.data["earliest"]));
            $("input#end_date").datepicker("setDate", new Date(event.data["latest"]));
          }
        }
        
        if (event.data["finished"] != undefined) {
          $("#transform_progress").width("100%");
          $("#transform_progress").text("100%");
    
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
                //$("#welcome_modal").modal("show");
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
                    //$("#id-body").html("Have you participated in Web Historian's research project 'Understanding Access to Information Online and in Context' by uploading your data and completing the survey? <label class='radio-inline'><input type='radio' name='optPar' value='1'>Yes</label> <label class='radio-inline'><input type='radio' name='optPar' value='0'>No</label>");
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
                        //$("#id-body").html("To combine your history from this browser with the other history you uploaded please enter the Web Historian ID from your first upload. On the browser you first uploaded from this ID is availabe in the Settings at the bottom of the home page of Web Historian. The ID was also provided to you when you uploaded your data. <fieldset class='form-group' id='idChoice'><input type='text' class='form-control' id='field_identifier' placeholder='Enter identifier here&#8230;' /></fieldset> Your visualizations in this extension will be from the history on this computer only, but if you upload your history data from this browser ( click <span class='glyphicon glyphicon-cloud-upload'></span>) and complete the short survey about this additional data you will be able to view your combined history on the server from either browser when this icon appears on the menu bar: <span class='glyphicon glyphicon-export'></span><p>If you want to enter your ID from your previous installation later you can do so via the Settings link on the bottom of the Web Historian home page.</p>");
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
                    //$("#id-body").html("Please enter the study ID you were provided with.</p><fieldset class='form-group' id='idChoice'><input type='text' class='form-control' id='field_identifier' placeholder='Enter identifier here&#8230;' /></fieldset><br/> Your visualizations in this extension will be from the history on this computer only, but if you have uploaded history data previously from another browser, and you upload your history data from this browser ( click <span class='glyphicon glyphicon-cloud-upload'></span>) and complete the short survey about this additional data you will be able to view your combined history on the server when this icon appears on the menu bar: <span class='glyphicon glyphicon-export'></span>");
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
            //console.log('WORKER POSTED: ' + JSON.stringify(event.data));
    
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
    else {
      //not enough data
      var wcd = "";
      svyLink(function(url){ 
        var online = 0;
        if(url !== ""){
          online = 1;
        }
        callback(wcd, online, url);
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
};
    
    history.wir = function(weekData, online, url) {
        $("#cards").append("<div id=\"wir\"></div>");
        $("#wir").html(function() {
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
          var dl_data = "<h3>Download your browsing data</h3> <p><button id=\"dl_json\">Download JSON</button></p>"
          var notEnoughData = "<h3>Week in Review</h3><p>The week in review compares this week's web browsing to the previous week. To see the week in review feature you can keep browsing in Chrome witout clearing your history until you have 14 days of browsing. If you changed the dates you are viewing with the calendar, just expand the range between the start and end date to 14 days or more.</p> <h3>Download your browsing data</h3> <p><button id=\"dl_json\">Download JSON</button></p>";
          var offline = "<div class='alert alert-warning'><p><span class='glyphicon glyphicon-wrench' aria-hidden='true'></span> Your browser is offline. Web Historian will function, but web site categories may be limited to 'Other' until you are online and reload the extension.</p></div>";
          
          var weekHtml = "";
          $("#footer").show();

            if (lastUlD === "Never" && weekData.weekBstart >= dataStartDate) {
              $("#research").show();
              if(online===1){ weekHtml = weekInReview + dl_data; }
              else { weekHtml = offline + weekInReview + dl_data; }
              //console.log("Never uploaded, more than 1 week data");
            }
            else if (lastUlD === "Never" && weekData.weekBstart < dataStartDate) { 
              $("#research").show();
              if(online===1) { weekHtml = notEnoughData + dl_data; }
              else { weekHtml = offline + notEnoughData + dl_data; }
              //console.log("Never uploaded, less than 1 week data");
              } 
            else if (svyEndType === 0 && weekData.weekBstart >= dataStartDate){
              if(online===1) { weekHtml = weekInReview + dl_data; }
              else { weekHtml = offline + weekInReview + dl_data; }
              //console.log("Refused or not qualified, more than 1 week data");
            }
            else if (svyEndType === 0 && weekData.weekBstart < dataStartDate){
              if(online===1) { weekHtml = notEnoughData + dl_data; }
              else { weekHtml = offline + notEnoughData + dl_data; }
              //console.log("Refused or not qualified, less than 1 week data");
            }
            else if (lastUlD !== "Never" && svyEndType === null){
                if(url !== ""){
                  var link = "<a href='" + url + "' target='_blank' class='wh_action' id='wh_svy_link' style='color: blue;'> Your Survey Link</a>";
                  $("#research").show();
                  $("#research").html("<br/><br/><div class='alert alert-danger'><h3><span class='glyphicon glyphicon-exclamation-sign' aria-hidden='true'></span> Please complete your survey for the research project 'Understanding Access to Information Online and in Context.': " + link + "</h3><p>You will pick up right where you left off. When you have finished the survey you can <a href=''>reload</a> to remove this message.</div><br/><br/><br/>");
                }
                else {
                  weekHtml = offline + weekInReview + dl_data;
                }
            }
            else if (lastUlD !== "Never" && svyEndType === 1 && weekData.weekBstart >= dataStartDate) { 
              $("#nav_review").show();
              //console.log("Uploaded and finished, more than 1 week data");
              if(online===1)
                weekHtml = weekInReview + thanks + dl_data;
              else
                weekHtml = offline + weekInReview + thanks + dl_data;
              }
            else if (lastUlD !== "Never" && svyEndType === 1 && weekData.weekBstart < dataStartDate) { 
              $("#nav_review").show();
              //console.log("Uploaded and finished survey, less than 1 week data");
              if(online===1)
                weekHtml = notEnoughData + thanks + dl_data;
              else
                weekHtml = offline + notEnoughData + thanks + dl_data;
              }
            else { $("#research").show(); console.log("Upload, survey amount of days, and online status condition not a specified condition"); }; 
            
            return weekHtml;    
        });
      function download(content, fileName, contentType) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
      }
       $("#dl_json").click(function(){
        download(JSON.stringify(history.fullData), "web_historian_data.json", "text/plain");
        });
      };
    
    //insert the code for the cards, but doesn't display them (display: none)
    history.insertCards = function (){
      $("#cards").html("<div id=\"research\" style=\"display: none;\"> </div><div class=\"row\" id=\"viz_selector\" style=\"display: none;\"> <div class=\"col-sm-6 col-md-3\"> <a id=\"web_visit_card\"> <div class=\"thumbnail\"> <img src=\"images/visit.png\" alt=\"Web Visits\" /> <div class=\"caption\"> <h3>Web Visits</h3> <p> Circles sized by number of days a site was visited, or total visits to the site. </p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"search_words_card\"> <div class=\"thumbnail\"> <img src=\"images/wordCloud.png\" alt=\"Search Words\" /> <div class=\"caption\"> <h3>Search Terms</h3> <p> Words used in multiple web searches are larger. &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;</p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"network_card\"> <div class=\"thumbnail\"> <img src=\"images/network.png\" alt=\"Network\" /> <div class=\"caption\"> <h3>Network</h3> <p> Links between websites browsed from - to. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"time_card\"> <div class=\"thumbnail\"> <img src=\"images/time.png\" alt=\"Time\" /> <div class=\"caption\"> <h3>Time Heatmap</h3> <p> Hours of the day and days of the week when you browse the web the most. </p> </div> </div> </a> </div>");
      };
  
  //Putting it all together
  $("document").ready(function () 
  {
    $("#navbar").hide();
    chrome.storage.local.get('lastPdkUpload', function (result) {
      lastUl = result.lastPdkUpload;
     });

     chrome.storage.local.get('install_time', function (result) {
       installTime = result.install_time;
     });

     chrome.storage.local.get('subscribed', function (result) {
       subscribed = result.subscribed;
     });

    history.insertCards();
    
	$("#mc-embedded-subscribe").click(function(eventObj) {
      	chrome.storage.local.set({ 'subscribed': 'true' }, function (result) {
	    });
	});

	
	//Get all data into fullData1
    getUrls(noTransform, noViz, function()
    {
      storeStartEnd(history.fullData);
      //svyEnd(history.fullData);
      storeCats(showHome);
      //$("ytplayer").hide();
	  $(document).mouseleave(function() {
		var today = new Date().getDay();
		var instDay = new Date(installTime).getDay();
		if (instDay === today && leaveOnce === 0 && subscribed !== 'true') {
	      //$("#mailing_list_modal").modal("show");
	      leaveOnce = 1;
	    }
	});
    })
  });

    return history;
});
