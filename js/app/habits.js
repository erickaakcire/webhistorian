define(["../app/utils", "moment"], function(utils, moment) {
    var visualization = {};

    visualization.compileData = function(data)
    {
        //hard coding categories for top accessed websites in the US and NL. Putting into a heierarchical object for visualization.
        //need to implement regex matches and top domain matching esp. for blogs, education and governmnet...
        //need to create a variable for category names and make loops
        //var categories = ["adult", "banking", "blog", "education", "email", "government", "hard_news", "information", "search", "shopping", "social", "soft_news", "technology", "video"];
//        callFirstLastDate();
//        loadTime();
        var domains = utils.countsOfProperty(data, "domain");

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

            //declare here so array is cleared each time
            var domainAndDate = [];


            var currentDomain = domains[i].counter;
            //console.log(currentDomain + data[1].domain);

            //find the array indexes of the domain in data
            for (var j = 0; j < data.length; j++){
              //console.log("currentDomain: " + currentDomain + "data domain: " + data[j].domain);
              if (currentDomain === data[j].domain){
                var newDate = new Date(data[j].date);
                var day = ("0" + newDate.getDate()).slice(-2);
                var month = ("0" + (newDate.getMonth() + 1) ).slice(-2);
                var date = newDate.getFullYear() + "/" + month + "/" + day;

                if (domainAndDate.indexOf(date) < 0){
                  domainAndDate.push(date);
                  //calculate how many unique dates and push that.
                }
              }
            }
            //domains[] doesnt contain any history api functionality.
            //have to do a for each loop in

            var size = domainAndDate.length;

            //console.log(domainAndDate[0]);
            //console.log(domainAndDate[1]);
            //console.log(size);

             if (size >= 2){
              if (utils.contains(specified, currentDomain)) {
                if (utils.contains(adult, currentDomain)) {
                    adultA.push({name: currentDomain, size: size});
                }
                if (utils.contains(banking, currentDomain)) {
                    bankingA.push({name: currentDomain, size: size});
                }
                if (utils.contains(blog, currentDomain)) {
                    blogA.push({name: currentDomain, size: size});
                }
                if (utils.contains(education, currentDomain)) {
                    educationA.push({name: currentDomain, size: size});
                }
                if (utils.contains(email, currentDomain)) {
                    emailA.push({name: currentDomain, size: size});
                }
                if (utils.contains(government, currentDomain)) {
                    governmentA.push({name: currentDomain, size: size});
                }
                if (utils.contains(hard_news, currentDomain)) {
                    hard_newsA.push({name: currentDomain, size: size});
                }
                if (utils.contains(information, currentDomain)) {
                    informationA.push({name: currentDomain, size: size});
                }
                if (utils.contains(search, currentDomain)) {
                    searchA.push({name: currentDomain, size: size});
                }
                if (utils.contains(shopping, currentDomain)) {
                    shoppingA.push({name: currentDomain, size: size});
                }
                if (utils.contains(social, currentDomain)) {
                    socialA.push({name: currentDomain, size: size});
                }
                if (utils.contains(soft_news, currentDomain)) {
                    soft_newsA.push({name: currentDomain, size: size});
                }
                if (utils.contains(technology, currentDomain)) {
                    technologyA.push({name: currentDomain, size: size});
                }
                if (utils.contains(video, currentDomain)) {
                    videoA.push({name: currentDomain, size: size});
                }
            }
            else {
                otherA.push({name: currentDomain, size: size});
            }
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

        return dataset;
    };

    visualization.display = function(history, data)
    {
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

        d3.selectAll("#viz_selector a").classed("active", false);
        d3.select("#habits").classed("active", true);
        vizSelected = "habits";

        utils.clearVisualization();
        utils.clearOptions();

        var dataset = visualization.compileData(filteredData);

        d3.select("#" + history.timeSelection).classed("active", true);

        var numDomains = utils.countUniqueProperty(data, "domain");

        d3.select("#title").append("h1").text("What websites do you visit?").attr("id", "viz_title");

        d3.select("#title").append("h2").text(numDomains + " websites visited from " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY")).attr("id", "viz_subtitle");
        d3.select("#below_visual").append("p").text("A larger circle means that the website was visited more.").attr("id", "viz_p");

		$("#visual_div").height($("#visual_div").width());

        var r = $("#visual_div").height(),
            format = d3.format(",d"),
            fill = d3.scale.category20();

        var bubble = d3.layout.pack()
            .sort(function(a, b) {
              return -(a.value - b.value);
            })
            .size([r, r])
            .padding(1.5);

        var siteClasses = utils.classes(dataset);

        var vis = d3.select("#visual_div").append("svg")
            .attr("width", r)
            .attr("height", r)
            .attr("class", "bubble")
            .attr("id", "visualization");

        var node = vis.selectAll("g.node")
            .data(bubble.nodes(siteClasses)
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
    };

    return visualization;
});
