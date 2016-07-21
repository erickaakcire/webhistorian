define(["app/utils", "moment"], function(utils, moment) {
  var visualization = {};
  visualization.domainsChecked = [];
  visualization.allChecked = [];
  visualization.searchesChecked = [];
  
  var seStored = JSON.parse(sessionStorage.getItem('se'));    
  var sd = seStored[0].start;
  var ed = seStored[0].end;
  var startDate = new Date (sd);
  var endDate = new Date (ed);

  visualization.buildDomainTable = function(data) {

    var table = document.createElement('table');
    table.id = "domain_visualization";

    document.getElementById("domains_table").appendChild(table);

    var tableData = [];

    for (var i = 0; i < data.length; i++) {
      var dataObj = {};
      dataObj['domain'] = data[i]['counter'];
      dataObj['visits'] = data[i]['count'];

      tableData.push(dataObj);
    }
    var data = utils.sortByPropRev(tableData, "visits");

    $('table#domain_visualization').bootstrapTable({

      columns: [{
        field: 'remove',
        title: '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>',
        checkbox: true,
        sortable: false
      }, {
        field: 'domain',
        title: 'Domain',
        sortable: true
      }, {
        field: 'visits',
        title: 'Visits',
        sortable: true,
      }],
      data: data,
      striped: true,
      pagination: true,
      search: true,
      sortable: true,
      checkboxHeader: false,
      toolbar: "#domains_toolbar"
    });

    var updateDomainsRemoveButton = function() {
      var count = visualization.domainsChecked.length;

      if (count > 0)
        $("#remove_domains").prop("disabled", false);
      else
        $("#remove_domains").prop("disabled", true);

      if (count == 1)
        $("#label_domains_remove").text("Remove 1 Checked Domain");
      else
        $("#label_domains_remove").text("Remove " + count + " Checked Domains");
    };

    $('#domain_visualization').on('check.bs.table', function(e, row, element) {
      var domain = row['domain'];

      if ($.inArray(domain, visualization.domainsChecked) == -1) {
        visualization.domainsChecked.push(domain);
        updateDomainsRemoveButton();
      }
    });

    $('#domain_visualization').on('uncheck.bs.table', function(e, row, element) {
      var domain = row['domain'];

      var index = $.inArray(domain, visualization.domainsChecked);

      if (index != -1) {
        visualization.domainsChecked.splice(index, 1);
        updateDomainsRemoveButton();
      }
    });
  };

  visualization.buildAllTable = function(historyData) {

    data = utils.sortByPropRev(historyData, "date");

    //build table
    var table = document.createElement('table');
    table.id = "all_visualization";

    document.getElementById("all_visits_table").appendChild(table);

    var tableData = [];

    for (var i = 0; i < data.length; ++i) {
      var row = {};

      var d = moment(data[i].date);

      row['remove'] = "isSuppressed_" + i;
      row['domain'] = data[i].domain;
      row['date'] = "<span style='display: none;'>" + d.format() + "</span>" + d.format("MMM D, YYYY - h:mm:ssa");
      row['terms'] = data[i].searchTerms;
      row['id'] = data[i].id;
      row['reference_id'] = data[i].refVisitId;
      row['transition'] = data[i].transType;
      row['url'] = data[i].url;
      row['title'] = data[i].title;

      tableData.push(row);
    }

    var allDetail = function(index, row, element) {
      var output = "<div class='row'>" +
        "  <div class='col-md-2'><strong class='pull-right'>Title:</strong></div>" +
        "  <div class='col-md-10'>" + row["title"] + "</div>" +
        "</div>" +
        "<div class='row'>" +
        "  <div class='col-md-2'><strong class='pull-right'>Domain:</strong></div>" +
        "  <div class='col-md-10'>" + row["domain"] + "</div>" +
        "</div>" +
        "<div class='row'>" +
        "  <div class='col-md-2'><strong class='pull-right'>Search Terms:</strong></div>" +
        "  <div class='col-md-10'>" + row["terms"] + "</div>" +
        "</div>" +
        "<div class='row'>" +
        "  <div class='col-md-2'><strong class='pull-right'>Date:</strong></div>" +
        "  <div class='col-md-10'>" + row["date"] + "</div>" +
        "</div>" +
        "<div class='row'>" +
        "  <div class='col-md-2'><strong class='pull-right'>URL:</strong></div>" +
        "  <div class='col-md-10'><a href='" + row["url"] + "' target='_blank'>" + row["url"] + "</a></div>" +
        "</div>" +
        "<div class='row'>" +
        "  <div class='col-md-2'><strong class='pull-right'>ID:</strong></div>" +
        "  <div class='col-md-10'>" + row["id"] + "</div>" +
        "</div>" +
        "<div class='row'>" +
        "  <div class='col-md-2'><strong class='pull-right'>Reference ID:</strong></div>" +
        "  <div class='col-md-10'>" + row["reference_id"] + "</div>" +
        "</div>" +
        "<div class='row'>" +
        "  <div class='col-md-2'><strong class='pull-right'>Transition:</strong></div>" +
        "  <div class='col-md-10'>" + row["transition"] + "</div>" +
        "</div>";

      return output;
    };

    $('table#all_visualization').bootstrapTable({
      columns: [{
        field: 'remove',
        title: '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>',
        checkbox: true,
        sortable: false
      }, {
        field: 'domain',
        title: 'Domain',
        sortable: true
      }, {
        field: 'date',
        title: 'Date',
        sortable: true
      }, {
        field: 'title',
        title: 'Title',
        sortable: true
      }, {
        field: 'terms',
        title: 'Search Terms',
        sortable: true
      }],
      data: tableData,
      striped: true,
      pagination: true,
      search: true,
      detailView: true,
      detailFormatter: allDetail,
      sortable: true,
      checkboxHeader: false,
      toolbar: "#visits_toolbar"
    });

    $('table#all_visualization').bootstrapTable('expandRow', 0);
    $("#title h1").text("All Visits");
    $("#title h2").text(data.length + " visits from: " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY"));

    var updateAllRemoveButton = function() {
      var count = visualization.allChecked.length;

      if (count > 0)
        $("#remove_visits").prop("disabled", false);
      else
        $("#remove_visits").prop("disabled", true);

      if (count == 1)
        $("#label_visits_remove").text("Remove 1 Checked Visit");
      else
        $("#label_visits_remove").text("Remove " + count + " Checked Visits");
    };

    $('#all_visualization').on('check.bs.table', function(e, row, element) {
      var id = row['id'];

      if ($.inArray(id, visualization.allChecked) == -1) {
        visualization.allChecked.push(id);
        updateAllRemoveButton();
      }
    });

    $('#all_visualization').on('uncheck.bs.table', function(e, row, element) {
      var id = row['id'];

      var index = $.inArray(id, visualization.allChecked);

      if (index != -1) {
        visualization.allChecked.splice(index, 1);
        updateAllRemoveButton();
      }
    });
  };


  visualization.display = function(history, data, tab) {

    var filteredData = utils.filterByDates(data, startDate, endDate);

    var countData = utils.countProperties(filteredData, "domain");

    var tabs = "<ul class='nav nav-tabs'>" +
      "  <li role='presentation' class='active'><a href='#all_visits_table'>All Visits</a></li>" +
      "  <li role='presentation'><a href='#domains_table'>Domains</a></li>" +
      "</ul>" +
      "<div class='tab-content'>" +
      "  <div role='tabpanel' class='tab-pane' id='domains_table'>" +
      "    <div id='domains_toolbar'>" +
      "      <button id='remove_domains' class='btn btn-danger' disabled>" +
      "      <i class='glyphicon glyphicon-remove'></i> <span id='label_domains_remove'>Delete</span></button>" +
      "    </div>" +
      "  </div>" +
      "  <div role='tabpanel' class='tab-pane active' id='all_visits_table'>" +
      "    <div id='visits_toolbar'>" +
      "      <button id='remove_visits' class='btn btn-danger' disabled>" +
      "      <i class='glyphicon glyphicon-remove'></i> <span id='label_visits_remove'>Delete</span></button>" +
      "    </div>" +
      "  </div>" +
      "</div>";

    utils.clearVisualization();
    $("#footer").hide();
    $("#visual_div").append(tabs);

    //default

    d3.select("#title").append("h1").text("Domains Visited").attr("id", "viz_title");
    d3.select("#title").append("h2").text(countData.length + " websites visited from: " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY"));

    var searchData = utils.onlyIf(filteredData, "searchTerms", "", true);

    visualization.buildDomainTable(countData);
    visualization.buildAllTable(filteredData);

    $('ul.nav-tabs a').click(function(e) {
      if ($(this).attr("href") == "#domains_table") {
        $("#title h1").text("Domains Visited");
        $("#title h2").text(countData.length + " websites visited from: " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY"));
      } else if ($(this).attr("href") == "#all_visits_table") {
        $("#title h1").text("All Visits");
        $("#title h2").text(filteredData.length + " visits from: " + moment(startDate).format("MMM D, YYYY") + " to: " + moment(endDate).format("MMM D, YYYY"));
        $('table#all_visualization').bootstrapTable('expandRow', 0);
      }

      e.preventDefault();

      $(this).tab('show');
    });

    $("#remove_domains").off("click");
    $("#remove_domains").click(function() {
      if (confirm('Do you want to PERMANENTLY remove all URLs with the checked domains from your local browser history?')) {
        for (var i = 0; i < visualization.domainsChecked.length; i++) {
          var domain = visualization.domainsChecked[i];
          var toRemove = history.getSuppressedUrl(history.fullData, "domain", domain);
          utils.removeHistory(toRemove, true);
          toRemove.forEach(function(a) {
            var vdi = history.findIndexArrByKeyValue(history.fullData, "url", a["url"]);
            if (vdi) {
              vdi.forEach(function(v) {
                //console.log("RM: " + JSON.stringify(history.fullData[v], null, 2));
                history.fullData.splice(v, 1);
              });
            }
          });
        }
        visualization.domainsChecked = [];
        visualization.display(history, history.fullData);
      }
    });


    $("#remove_visits").off("click");
    $("#remove_visits").click(function() {
      if (confirm('Do you want to PERMANENTLY remove all visits to the checked URLs from your local browser history? Every visit to the URL of the checked items will be removed.')) {
        for (var i = 0; i < visualization.allChecked.length; i++) {
          var id = visualization.allChecked[i];
          var toRemove = history.getSuppressedUrl(history.fullData, "id", id);
          //console.log("TO REMOVE: " + JSON.stringify(toRemove, null, 2));
          utils.removeHistory(toRemove, true);
          toRemove.forEach(function(a) {
            var vdi = history.findIndexArrByKeyValue(history.fullData, "url", a["url"]);
            if (vdi) {
              vdi.forEach(function(v) {
                //console.log("RM: " + JSON.stringify(history.fullData[v], null, 2));
                history.fullData.splice(v, 1);
              });
            } 
          });
        }
        visualization.allChecked = [];
        visualization.display(history, history.fullData);
      }
    });

    if (tab != "") {
      $("a[href='" + tab + "']").click();
    }
  };

  return visualization;
});
