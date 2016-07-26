define(["app/utils", "moment"], function(utils, moment) {
  var visualization = {};
  $("#title h1").text("Time");
  visualization.display = function(history, data) {
    utils.clearVisualization();
    console.log("time");
  }
  return visualization;
});