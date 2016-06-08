define([], function () 
{
    var config = {};
    
    config.actionsUrl = "ACTIONS_URL_HERE";
    config.uploadUrl = "UPLOAD_URL_HERE";
    config.reviewUrl = "REVIEW_URL_PREFIX_HERE";
    config.fetchIdUrl = "FETCH_ID_URL_PREFIX_HERE";
    config.categoriesUrl = "https://dl.dropboxusercontent.com/u/3755456/categories.json"; //default categories to get you started.
    //the endSvyUrls assumes there is one URL that people visit when they complete the whole survey
    //and another that people who are not qualified or don't consent visit
    config.endSvyUrls = ["SUCCESS_URL","NOT_QUALIFIEID_OR_NO_CONSENT_URL"];

    return config;
});