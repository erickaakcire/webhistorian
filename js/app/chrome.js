// JavaScript source code

// When the user clicks on the browser action icon.

chrome.browserAction.onClicked.addListener(function(tab) 
{
	//Look to see if the extension page is open already and if not, open it.

    var optionsUrl = chrome.extension.getURL('index.html');
    
    chrome.tabs.query({}, function (extensionTabs) {
        var found = false;
        
        for (var i = 0; i < extensionTabs.length; i++) {
            if (optionsUrl == extensionTabs[i].url) {
                found = true;
                console.log("tab id: " + extensionTabs[i].id);
                chrome.tabs.update(extensionTabs[i].id, { "selected": true });
            }
        }
        
        if (found == false) {
          chrome.tabs.create({ url: "index.html" });
        }
    });
});

chrome.alarms.create("check-last-upload", {
	when: 0,
	periodInMinutes: 30
});

chrome.alarms.onAlarm.addListener(function(alarm)
{
	chrome.storage.local.get({ 'lastPdkUpload': 0 }, function (result) 
	{
		var lastUpload = 0;
		
		if (result.lastPdkUpload != undefined)
			lastUpload = Number(result.lastPdkUpload);
			
		var now = new Date();
		
		if (now.getTime() - lastUpload > (1000 * 60 * 60 * 720))
		{
			chrome.browserAction.setIcon({
				path: "images/star-red-64.png"
			});	

			chrome.browserAction.setTitle({
				title: "Time to transmit data!"
			});	
			//put in a special message asking for more data
		}
		else
		{
			chrome.browserAction.setIcon({
				path: "images/star-yellow-64.png"
			});	

			chrome.browserAction.setTitle({
				title: "Web Historian"
			});	
		}
	});
});