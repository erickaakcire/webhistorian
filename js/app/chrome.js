// When the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
  //Look to see if the extension page is open already and if not, open it.

  var optionsUrl = chrome.extension.getURL('index.html');

  chrome.tabs.query({}, function(extensionTabs) {
    var found = false;

    for (var i = 0; i < extensionTabs.length; i++) {
      if (optionsUrl == extensionTabs[i].url) {
        found = true;
        console.log("tab id: " + extensionTabs[i].id);
        chrome.tabs.update(extensionTabs[i].id, {
          "selected": true
        });
      }
    }

    if (found == false) {
      chrome.tabs.create({
        url: "index.html"
      });
    }
  });
});

function install_notice() {
    if (localStorage.getItem('install_time'))
        return;

    var now = new Date().getTime();

	chrome.storage.local.set({ 'install_time': now }, function (result) {
    });
	console.log("installation "+ now);

    chrome.tabs.create({url: "index.html"});
    
}
install_notice();


