function localizeHtmlPage() {
  //Localize by replacing __MSG_***__ meta tags
  var objects = document.querySelectorAll('[data-i18n]');
  for (var j = 0; j < objects.length; j++) {
    var obj = objects[j];

    var valStrH = obj.innerHTML.toString();
    var msg = obj.getAttribute('data-i18n').replace(/(__MSG_)/, '').replace(/(__)/, '');
    var valNewH = chrome.i18n.getMessage(msg) || valStrH;

    if (valNewH != valStrH) {
      obj.innerHTML = valNewH;
    }
  }
}

localizeHtmlPage();