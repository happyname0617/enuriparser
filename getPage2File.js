    var page = new WebPage()
    var fs = require('fs');
     var system = require('system');

    if (system.args.length === 1) {
      console.log('Usage: getPage2File.js <some URL> <filename>');
      phantom.exit();
    }
    var url= system.args[1];
    var filename= system.args[2];
    page.onLoadFinished = function() {
      console.log("page load finished");
      //page.render('export.png');
      fs.write(filename, page.content, 'w');
      phantom.exit();
    };

    page.open(url, function() {
      page.evaluate(function() {
      });
    });