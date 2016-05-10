define(["../app/utils", "moment"], function(utils, moment) 
{
    var visualization = {};
    
    visualization.generateTerms = function(data) 
    {
        var termArray = [];
        
        for (var i = 0; i < data.length; i++) 
        {
            var dataItem = data[i];
            
            var terms = dataItem.searchTerms;
            var domain = dataItem.domain;

            if (terms != "undefined" && terms != null) 
            {
                termArray.push({term: terms, domain: domain});
            }
        }
        
        return termArray;
    };
    
    visualization.searchWordsFun = function(words, terms) 
    {
        var countWords = 1;
        var sortedAllWords = words;
        var uniqueTerms = terms;
        var searchTermContext = [];
        var searchWords = [];
        maxCount = 0;

        for (i = 0; i < sortedAllWords.length; i++) 
        {
            var thisWord = sortedAllWords[i].word;
            var thisTermId = sortedAllWords[i].termId;
            var thisTerm = "";
            
            if (uniqueTerms[thisTermId - 1].term) 
            {
                thisTerm = uniqueTerms[thisTermId - 1].term;
            }
            
            var nextWord = "";
            var nextTermId = "";
            
            if (i < sortedAllWords.length - 1) 
            {
                nextWord = sortedAllWords[i + 1].word;
                nextTermId = sortedAllWords[i + 1].termId;
            }

            if (nextTermId === thisTermId && thisWord === nextWord) 
            {
            
            }
            else if (thisWord === nextWord) 
            {
                countWords++;
                searchTermContext.push(" " + thisTerm);
            }
            else 
            {
                searchTermContext.push(" " + thisTerm);
                var stc = searchTermContext.toString();
                searchWords.push({text: thisWord, size: countWords, allTerms: stc});
            
                if (countWords > maxCount) 
                {
                    maxCount = countWords;
                }
                
                countWords = 1;
                searchTermContext = [];
            }
        }
        
        return searchWords;
    };
    
    visualization.display = function(history, data) 
    {
        utils.clearVisualization();
        utils.clearOptions();

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

        var allSearchWords = [];
        var countUniqueTerms = 1;
        var termArray = visualization.generateTerms(filteredData);
        
        //arrays for search words data prep
        // stop words to filter from word cloud - From Jonathan Feinberg's cue.language, see lib/cue.language/license.txt.
        var stopWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;

        var sortedTerms = termArray.sort(function(a, b) 
        {
			if (a.term < b.term)
				return -1;
			if (a.term > b.term)
				return 1;
			return 0;
	    });

        uniqueTerms = utils.uniqueCount(sortedTerms, "term");

        var maxWords = 0;

        for (i = 0; i < uniqueTerms.length; i++) 
        {
            var thisTerm = uniqueTerms[i].term;
            var punctuationless = thisTerm.replace(/[\"\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            var thisTermNoPunct = punctuationless.replace(/\s{2,}/g, " ");
            var words = thisTermNoPunct.split(" ");
            var countWords = words.length;
            
            if (countWords > maxWords) 
            {
                maxWords = countWords;
            }
            
            for (var j = 0; j < words.length; j++) 
            {
                if (stopWords.test(words[j].toLowerCase()) === false) 
                {
                    allSearchWords.push({word: words[j].toLowerCase(), termId: countUniqueTerms});
                }
            }
            
            countUniqueTerms++;
        }
		
        var sortedAllWords = allSearchWords.sort(function (a, b) 
        {
			if (a.word < b.word)
				return -1;
			if (a.word > b.word)
				return 1;
			return 0;
		});

        var searchWords = visualization.searchWordsFun(sortedAllWords, uniqueTerms);

        // Search Words word cloud visulization based on work by Jason Davies
        //searchWords text, size, allTerms

        d3.select("#" + history.timeSelection).classed("active", true);

        d3.select("#title").append("h1").text("What are you looking for?").attr("id", "viz_title");
        d3.select("#title").append("h2").text(uniqueTerms.length + " unique search terms with " + searchWords.length + " unique words used from: " + moment(startDate).format("MMM D, YYYY")  + " to: " + moment(endDate).format("MMM D, YYYY") );
        d3.select("#below_visual").append("p").text("This is a cloud of the words you have used to search the web. The larger words were used in a greater number of different searches. Hover your mouse over each word for a tool-tip that shows all of the search terms where the word was used.").attr("id", "viz_p");

        //<p><label>Download:</label><a id="download-svg" href="#" target="_blank">SVG</a> |<a id="download-png" href="#" target="_blank">PNG</a>

        var width = $("#visual_div").width();
        var height = 500;
//        var height = width;

        var fill = d3.scale.category20();
        d3.layout.cloud().size([width, height])
            .words(searchWords)
            .padding(5)
            .rotate(function () {
                return 0;
            })
            .font("Impact")
            .fontSize(function (d) {
                var fontSizeCalc = d.size / maxCount;
                return utils.log10(fontSizeCalc * 140) * 2;
            })
            //.fontSize(function(d) { return d.size * 20 })
            .on("end", draw)
            .start();
        function draw(words) {
            d3.select("#visual_div").append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("id", "visualization")
                .append("g")
                .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
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
    };
        
    return visualization;
});
