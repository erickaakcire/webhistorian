requirejs.config({
  shim: {
    "jquery": {
      exports: "$"
    },
    "bootstrap": {
      deps: ["jquery"]
    },
    "bootstrap-datepicker": {
      deps: ["bootstrap"]
    },
    "bootstrap-table": {
      deps: ["bootstrap"]
    },
    "d3": {
      exports: "d3"
    },
    "d3.layout.cloud": {
      deps: ["d3"]
    },
    "crypto-js-md5": {
      exports: "CryptoJS"
    },
    "historian": {
      deps: ["jquery"]
    }
  },
  baseUrl: "js/lib",
  paths: {
    app: '../app'
  }
});

main.page = function() {
  requirejs(["app/home"], function(home) {
    home.homeClicks(history, history.fullData);
  });
};

// Start the main app logic.
requirejs(["bootstrap", "bootstrap-datepicker", "bootstrap-table", "d3.layout.cloud"], function(bs, bsdp, bst, d3lc, moment) {
  main.page();
});
