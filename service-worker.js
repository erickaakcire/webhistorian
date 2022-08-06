var started = false;

class ServiceWorker {

    constructor(profile) {
        this.profile = profile;
    }

    start() {
        const self = this;

        if (started) {
            return;
        }

        // prevent multiple invocations
        started = true;

    }

    async getCurrentTab() {
        let queryOptions = { active: true };
        let [ tab ] = await chrome.tabs.query(queryOptions);
        return tab;
    }


    async timeout(timeoutSeconds) {
        return new Promise((resolve) => {
            setTimeout(resolve, timeoutSeconds * 1000);
        });
    }

};
