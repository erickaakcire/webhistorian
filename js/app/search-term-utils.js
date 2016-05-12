define(function() {
    var st-utils = {};

    st-utils.uniqueCountST = function(data, key) 
    {
        var countTerms = 1;
        var uniqueTerms = [];
        var term = key;

        for (i = 0; i < data.length; i++) 
        {
            var thisTerm = data[i].term;
            var thisDomain = data[i].domain;
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
                uniqueTerms.push({term: thisTerm,domain: thisDomain, count: countTerms});
                countTerms = 1;
            }
        }
        return uniqueTerms;
    };
    
    st-utils.generateTerms = function(data) 
    {
        var termArray = [];
        
        for (var i = 0; i < data.length; i++) 
        {
            var dataItem = data[i];
            
            var terms = dataItem.searchTerms;
            var domain = dataItem.domain;

            if (terms != "undefined" && terms != null && terms != "") 
            {
                termArray.push({term: terms, domain: domain});
            }
        }
        
        return termArray;
    };
    
    st-utils.searchTermsToWords = function(uniqueTerms)
	{
		// stop words - From Jonathan Feinberg's cue.language
        var stopWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;
		var allSearchWords = [];
		
        for (i = 0; i < uniqueTerms.length; i++) 
        {
            var thisTerm = uniqueTerms[i].term;
            var punctuationless = thisTerm.replace(/[\"\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            var thisTermNoPunct = punctuationless.replace(/\s{2,}/g, " ");
            var words = thisTermNoPunct.split(" ");
            var countWords = words.length;
            var domain = uniqueTerms[i].domain;

            for (var j = 0; j < words.length; j++) 
            {
                if (stopWords.test(words[j].toLowerCase()) === false && words[j] != "") 
                {
                    allSearchWords.push({word: words[j].toLowerCase(), termId: i+1, wordsInTerm: countWords, domain: domain}); //termId possibly i+1
                }
            }
        }
        return allSearchWords;
	};
    
    
    st-utils.searchWordsFun = function(words, terms) 
    {
        var countWords = 1;
        var searchTermContext = [];
        var searchWords = [];

        for (i = 0; i < words.length; i++) 
        {
            var thisWord = words[i].word;
            var thisTermId = words[i].termId;
            var thisTerm = "";
            
            if (terms[thisTermId - 1].term) 
            {
                thisTerm = terms[thisTermId - 1].term;
            }
            
            var nextWord = "";
            var nextTermId = "";
            
            if (i < words.length - 1) 
            {
                nextWord = words[i + 1].word;
                nextTermId = words[i + 1].termId;
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
                searchWords.push({text: thisWord, size: countWords, allTerms: stc, domain: domain});
                countWords = 1;
                searchTermContext = [];
            }
        }
        
        return searchWords;
    };

    return st-utils;
});