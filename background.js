importScripts("service-worker.js");


//TODO:
/**
 *
 */

// service worker invocation stuff
service_worker_invoke();
// setTimeout(sync_profile, 5000);

// configure listeners for browser startup and extension install
chrome.runtime.onStartup.addListener(service_worker_invoke);
chrome.runtime.onInstalled.addListener(async () => {

    const tab = await chrome.tabs.create({
        url: 'index.html'
    });

    await service_worker_invoke();
});

// run on startup
async function service_worker_invoke() {



}