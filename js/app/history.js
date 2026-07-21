define(["moment", "app/config", "app/utils"], function (moment, config, utils) 
{   
  var history = {};
  history.fullData = [];
  history.urlArray = [];

  var now = new Date();
  var timeSelect = 0; //null = 24 hours, 0 = all time
  var visualData = [];

  var nintyAgo = now.getTime() - 7776000000;
  var dumbStartEnd = [{start: nintyAgo, end: now.getTime()}];
  sessionStorage.setItem("se", JSON.stringify(dumbStartEnd));

  function storeStartEnd(data){
    var startEnd = [];

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
    if (sessionStorage.getItem('cats') !== null) {
      $("#progress_bars").hide();
      callback();
      return;
    }
    var cats = [];
    $.getJSON(config.categoriesUrl, function (cat) {
      for (var j in cat.children) {
        cats.push({search: cat.children[j]["search"], category: cat.children[j]["category"], value: cat.children[j]["value"]});
      }
    }).fail(function(){
      console.log("Categories file not found or invalid, using 'Other' only");
      cats.push({search: "domainExact", category: "Other", value: " "});
    }).always(function() {
      sessionStorage.setItem("cats", JSON.stringify(cats));
      $("#progress_bars").hide();
      callback();
    });
  }

//Getting data from Chrome History & creating the base dataset
    function getUrls(callback, viz, callback2) {
        chrome.history.search({
                'text': '',
                'maxResults': 2147483647,
                'startTime': timeSelect
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
      var percentML = "the same as";
      if (countA > countB) { percentML = "more than"; }
      if (countA < countB) { percentML = "less than"; }
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
    else {
      //not enough data
      callback("");
    }
  };
  function showHome (){
    $('#viz_selector').show();
    $("#navbar").show();
    history.compareWeekVisits(now, visualData, history.wir);
  };
    
    history.wir = function(weekData) {
        $("#cards").append("<div id=\"wir\"></div>");
        $("#wir").html(function() {
          $("#footer").show();

          var dl_data = "<h3>Download your browsing data</h3> <p><button id=\"dl_json\">Download JSON</button></p>";

          var dataStartDate = history.fullData[0].date;
          if (weekData === "" || weekData.weekBstart < dataStartDate) {
            var notEnoughData = "<h3>Week in Review</h3><p>The week in review compares this week's web browsing to the previous week. To see the week in review feature you can keep browsing in Chrome without clearing your history until you have 14 days of browsing. If you changed the dates you are viewing with the calendar, just expand the range between the start and end date to 14 days or more.</p>";
            return notEnoughData + dl_data;
          }

          var aEnd = moment(weekData.weekAend).format("ddd MMM D");
          var aStart = moment(weekData.weekAstart).format("ddd MMM D");
          var bEnd = moment(weekData.weekBend).format("ddd MMM D");
          var bStart = moment(weekData.weekBstart).format("ddd MMM D");
          var percent = weekData.percent;
          var percentML = weekData.percentML;
          var topDomainLw = weekData.topDomainLw;
          var topDomainTw = weekData.topDomainTw;
          var topTermLw = weekData.topTermLw;
          var topTermTw = weekData.topTermTw;

          var topTermLwD;
          if (topTermLw === topTermTw){
            topTermLwD = "the same";
          }
          else {topTermLwD = "<strong>" + topTermLw + " </strong>";}

          var topDomainLwD;
          if (topDomainTw === topDomainLw) {
            topDomainLwD = "the same";
          }
          else { topDomainLwD = "<strong><a href=\"http://" + topDomainLw + "\" target=\"_blank\">" + topDomainLw + "</a></strong>";}

          var weekInReview = "<h3>Week in review</h3><p>This week (" + aStart + " to " + aEnd +  ")" + " you browsed the web <strong>" + percent + "% " + percentML + "</strong> last week (" + bStart + " to " + bEnd + ").</p> <p>The website you visited the most this week was <strong><a href=\"http://"+ topDomainTw +"\" target=\"_blank\">" + topDomainTw + "</a></strong>. It was " + topDomainLwD + " last week. For more details on web site visits see the Web Visits visual <span class=\"glyphicon glyphicon-globe\"></span></p> <p>The search term you used the most this week was <strong>"+ topTermTw +"</strong>. It was "+ topTermLwD +" last week. For more details on search term use see the Search Terms visual <span class=\"glyphicon glyphicon-search\"></span></p>";

          return weekInReview + dl_data;
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
      $("#cards").html("<div class=\"row\" id=\"viz_selector\" style=\"display: none;\"> <div class=\"col-sm-6 col-md-3\"> <a id=\"web_visit_card\"> <div class=\"thumbnail\"> <img src=\"images/visit.png\" alt=\"Web Visits\" /> <div class=\"caption\"> <h3>Web Visits</h3> <p> Circles sized by number of days a site was visited, or total visits to the site. </p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"search_words_card\"> <div class=\"thumbnail\"> <img src=\"images/wordCloud.png\" alt=\"Search Words\" /> <div class=\"caption\"> <h3>Search Terms</h3> <p> Words used in multiple web searches are larger. &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;</p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"network_card\"> <div class=\"thumbnail\"> <img src=\"images/network.png\" alt=\"Network\" /> <div class=\"caption\"> <h3>Network</h3> <p> Links between websites browsed from - to. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p> </div> </div> </a> </div> <div class=\"col-sm-6 col-md-3\"> <a id=\"time_card\"> <div class=\"thumbnail\"> <img src=\"images/time.png\" alt=\"Time\" /> <div class=\"caption\"> <h3>Time Heatmap</h3> <p> Hours of the day and days of the week when you browse the web the most. </p> </div> </div> </a> </div>");
      };
  
  //Putting it all together
  $("document").ready(function ()
  {
    $("#navbar").hide();
    history.insertCards();

    getUrls(noTransform, noViz, function()
    {
      storeStartEnd(history.fullData);
      storeCats(showHome);
    })
  });

    return history;
});
