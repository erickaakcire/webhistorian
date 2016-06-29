/*
 * An URI datatype.  Based upon examples in RFC3986.
 *
 * TODO %-escaping
 * TODO split apart authority
 * TODO split apart query_string (on demand, anyway)
 *
 * @(#) $Id$
 */

// Constructor for the URI object.  Parse a string into its components.

function URI(str) {
  if (!str) str = "";
  // Based on the regex in RFC2396 Appendix B.
  var parser = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;
  var result = str.match(parser);
  this.scheme = result[1] || null;
  this.authority = result[2] || null;
  this.path = result[3] || null;
  this.query = result[4] || null;
  this.fragment = result[5] || null;
}

// Restore the URI to it's stringy glory.
URI.prototype.toString = function() {
  var str = "";
  if (this.scheme) {
    str += this.scheme + ":";
  }
  if (this.authority) {
    str += "//" + this.authority;
  }
  if (this.path) {
    str += this.path;
  }
  if (this.query) {
    str += "?" + this.query;
  }
  if (this.fragment) {
    str += "#" + this.fragment;
  }
  return str;
};

// Introduce a new scope to define some private helper functions.
(function() {
  // RFC3986 §5.2.3 (Merge Paths)
  function merge(base, rel_path) {
    var dirname = /^(.*)\//;
    if (base.authority && !base.path) {
      return "/" + rel_path;
    } else {
      return base.path.match(dirname)[0] + rel_path;
    }
  }

  // Match two path segments, where the second is ".." and the first must
  // not be "..".
  var DoubleDot = /\/((?!\.\.\/)[^\/]*)\/\.\.\//;

  function remove_dot_segments(path) {
    if (!path) return "";
    // Remove any single dots
    var newpath = path.replace(/\/\.\//g, '/');
    // Remove any trailing single dots.
    newpath = newpath.replace(/\/\.$/, '/');
    // Remove any double dots and the path previous.  NB: We can't use
    // the "g", modifier because we are changing the string that we're
    // matching over.
    while (newpath.match(DoubleDot)) {
      newpath = newpath.replace(DoubleDot, '/');
    }
    // Remove any trailing double dots.
    newpath = newpath.replace(/\/([^\/]*)\/\.\.$/, '/');
    // If there are any remaining double dot bits, then they're wrong
    // and must be nuked.  Again, we can't use the g modifier.
    while (newpath.match(/\/\.\.\//)) {
      newpath = newpath.replace(/\/\.\.\//, '/');
    }
    return newpath;
  }

  // RFC3986 §5.2.2. Transform References;
  URI.prototype.resolve = function(base) {
    var target = new URI();
    if (this.scheme) {
      target.scheme = this.scheme;
      target.authority = this.authority;
      target.path = remove_dot_segments(this.path);
      target.query = this.query;
    } else {
      if (this.authority) {
        target.authority = this.authority;
        target.path = remove_dot_segments(this.path);
        target.query = this.query;
      } else {
        // XXX Original spec says "if defined and empty"…;
        if (!this.path) {
          target.path = base.path;
          if (this.query) {
            target.query = this.query;
          } else {
            target.query = base.query;
          }
        } else {
          if (this.path.charAt(0) === '/') {
            target.path = remove_dot_segments(this.path);
          } else {
            target.path = merge(base, this.path);
            target.path = remove_dot_segments(target.path);
          }
          target.query = this.query;
        }
        target.authority = base.authority;
      }
      target.scheme = base.scheme;
    }

    target.fragment = this.fragment;

    return target;
  };
})();

var chrome = null;

self.itemsList = null;
self.results = [];
self.ids = [];

self.now = new Date();
self.earliestTimestamp = Number.MAX_VALUE;
self.latestTimestamp = Number.MIN_VALUE;
self.dateLimit = new Date(self.now.getTime());
self.dateLimit.setDate(self.now.getDate() - 91);
self.dateForward = Infinity;

self.finished = false;

self.fullData = [];

self.fetchVisits = function() {
  if (self.itemsList.length > 0) {
    var historyItem = self.itemsList.pop();

    self.postMessage({
      "action": "fetchHistory",
      "historyItem": historyItem
    });
  }
};

self.transformData = function(data) {
  //original data has: url title id visitId referringVisitId visitTime transitionType

  var itemCount = data.length;

  var transformDataItem = function() {
    //		self.postMessage({ "action": "updateProgress", "count": self.itemsList.length, "earliest": self.earliestTimestamp, "latest": self.latestTimestamp });

    var activeItems = [];

    for (var i = 0; i < 100 && data.length > 0; i++)
      activeItems.push(data.pop());

    for (var i = 0; i < activeItems.length; i++) {
      var dataItem = activeItems[i];

      var parser = new URI(dataItem.url);
      //parser.href = dataItem.url;
      var refId = dataItem.referringVisitId;
      var title = dataItem.title;

      var transType = dataItem.transitionType;
      var protocol = parser.scheme;
      var host = parser.authority;

      if (host == null) {
        host = "local_file";
      }

      var reGoogleMaps = /\.google\.[a-z\.]*\/maps/;
      var reGoogle = /\.google\.[a-z\.]*$/;
      var reGoogleOnly = /^google\.[a-z\.]*$/;
      var reBing = /\.bing\.com/;
      var reWwwGoogle = /www\.google\.[a-z\.]*$/;
      var reAol = /\.aol\.[a-z\.]*$/;
      var reBlogspot = /\.blogspot\.[a-z\.]*$/;
      var reYahoo = /\.yahoo\.[a-z\.]*$/;
      var reYahooSearchDomain = /search\.yahoo\.[a-z\.]*$/;
      var reAsk = /\.ask\.[a-z\.]*$/;
      var reThreeTwoThree = /^.*\.([\w\d_-]*\.[a-zA-Z][a-zA-Z][a-zA-Z]\.[a-zA-Z][a-zA-Z])$/;
      var reTwoTwoThree = /^.*\.([\w\d_-]*\.[a-zA-Z][a-zA-Z]\.[a-zA-Z][a-zA-Z])$/;
      var reDefaultDomain = /^.*\.([\w\d_-]*\.[a-zA-Z][a-zA-Z][a-zA-Z]?[a-zA-Z]?)$/;

      //completed study survey - need to be able to access config.js to get the endSvyUrls*
      //      if (dataItem.url === config.endSvyUrls[1]) {
      //      	var noStudy = {timeStored: now.getTime(), endType: 0};
      //      	storeSvyEnd(noStudy);
      //      }
      //      if (dataItem.url === config.endSvyUrls[0]) {
      //      	var study = {timeStored: now.getTime(), endType: 1};
      //      	storeSvyEnd(study);
      //      }

      //      function storeSvyEnd(data) {
      //add or replace object (data) to local storage, timeStored: , endType: 1 = success, 0 = end
      //        var arr = [];
      //        arr.push({timeStored: data.timeStored, endType: data.endType});
      //        localStorage.setItem("svyEnd", JSON.stringify(arr));
      //      }

      if (dataItem.url.match(reGoogleMaps)) {
        domain = "google.com/maps";
      } else if (protocol === "chrome-extension") {
        if (title != "") {
          domain = title + " Extension";
        } else {
          domain = "Chrome Extension";
        }
      } else if (protocol === "file") {
        domain = "Local File";
      } else if (host.match(reWwwGoogle) || host.match(reGoogleOnly)) {
        domain = "google.com";
      } else if (host.match(reGoogle) || host.match(reBlogspot)) {
        domain = host;
      } else if (host.match(reThreeTwoThree)) {
        domain = host.replace(reTwoTwoThree, "$1");
      } else if (host.match(reTwoTwoThree)) {
        domain = host.replace(reTwoTwoThree, "$1");
      } else {
        domain = host.replace(reDefaultDomain, "$1");
      }

      reSearch = /q=([^&]+)/;
      reYahooSearch = /p=([^&]+)/;
      var searchTerms = "";

      if (reGoogle.test(host) || host === "duckduckgo.com" || reBing.test(host) || host === "search.aol.com" || host === reAsk.test(host)) {
        if (reSearch.test(dataItem.url)) {
          search = dataItem.url.match(reSearch, "$1");
          if (search[1] != "")
            var searchTerms1 = search[1];
          var dcSearchTerms = decodeURIComponent(searchTerms1);
          searchTerms = dcSearchTerms.replace(/\+/g, " ");
        }
      }

      if (reYahooSearchDomain.test(host)) {
        if (reYahooSearch.test(parser.href)) {
          yahooSearch = dataItem.url.match(reYahooSearch, "$1");
          if (yahooSearch[1] != "")
            var searchTerms1 = yahooSearch[1];
          var dcSearchTerms = decodeURIComponent(searchTerms1);
          var searchTerms = dcSearchTerms.replace(/\+/g, " ");
        }
      }
      self.fullData.push({
        id: dataItem.visitId,
        url: dataItem.url,
        urlId: dataItem.id,
        protocol: protocol,
        domain: domain,
        searchTerms: searchTerms,
        date: dataItem.visitTime,
        transType: dataItem.transitionType,
        refVisitId: dataItem.referringVisitId,
        title: dataItem.title
      });
    }

    if (data.length > 1)
      setTimeout(transformDataItem, 0);
    else if (self.finished == false) {
      //console.log("WORKER DONE");

      self.finished = true;
      self.postMessage({
        "action": "updateProgress",
        "items": self.fullData,
        "count": self.itemsList.length,
        "earliest": self.earliestTimestamp,
        "latest": self.latestTimestamp,
        "finished": true
      });
    }
  };

  setTimeout(transformDataItem, 0);
}

self.addEventListener('message', function(e) {
  if (e.data["data"] != undefined) {
    self.itemsList = e.data["data"];
  }

  if (e.data["visitItems"] != undefined) {
    var visitItems = e.data["visitItems"];
    var historyItem = e.data["historyItem"];

    visitItems.forEach(function(visit) {
      if (visit.visitTime >= self.dateLimit && visit.visitTime <= self.dateForward) {
        self.results.push({
          url: historyItem.url,
          title: historyItem.title,
          id: visit.id,
          visitId: visit.visitId,
          referringVisitId: visit.referringVisitId,
          visitTime: visit.visitTime,
          transitionType: visit.transition
        });

        if (visit.visitTime < self.earliestTimestamp)
          self.earliestTimestamp = visit.visitTime;

        if (visit.visitTime > self.latestTimestamp)
          self.latestTimestamp = visit.visitTime;

        self.ids.push({
          id: visit.id
        });
      }
    });

    if (self.itemsList.length > 1) {
      self.postMessage({
        "action": "updateProgress",
        "count": self.itemsList.length,
        "earliest": self.earliestTimestamp,
        "latest": self.latestTimestamp
      });
      //			setTimeout(self.fetchVisits, 0);
    } else {
      self.postMessage({
        "action": "updateProgress",
        "count": self.itemsList.length,
        "earliest": self.earliestTimestamp,
        "latest": self.latestTimestamp
      });

      self.transformData(self.results);
    }
  }

  if (self.itemsList.length > 0) {
    setTimeout(self.fetchVisits, 0);
  } else {
    self.transformData(self.results);
  }
}, false);
