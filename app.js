var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var _ = require('underscore');
var async = require("async");
var winston = require('winston');
var VError = require('verror');
var htmlToJson = require('html-to-json');
var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs-prebuilt')
var binPath = phantomjs.path;
 


function getPage2File(url, fileName,callback){
    var childArgs = [path.join(__dirname, 'getPage2File.js'),url,fileName];
    childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
        if(err) return callback(err);
      // handle results 
      callback(null);
    })
}
var app = express();
app.use(express.static('public'));
app.set('view engine', 'pug');
app.set('views', './views');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: true
    })
  ]
});
var list =[];

var targeturls = [{url:'http://www.enuri.com/list.jsp?cate=060701',category:'mixer'},
{url:'http://www.enuri.com/list.jsp?cate=060610',category:'coffeemaker'},
{url:'http://www.enuri.com/list.jsp?cate=020143',category:'tv'},
{url:'http://www.enuri.com/list.jsp?cate=060220',category:'freeze'},
{url:'http://www.enuri.com/list.jsp?cate=050210',category:'wash'},
{url:'http://www.enuri.com/list.jsp?cate=060110',category:'ricecooker'}
];

parsepages();
//every 30 minute
setInterval(parsepages, 1000 * 60* 30);


app.get('/', function(req, res) {
    res.json(list);
});

app.listen(8080, function() {
    console.log('Example app listening on port 8080!')
});



//visit all pages and call DoStatistics when all pages are visited
function parsepages() {
    logger.info('parse pages')
    list.length = 0;//clear list;
    for (var i = 0; i < targeturls.length; i++) {
        var url = targeturls[i].url;
        var category = targeturls[i].category;
        parsePage(url,function(err,result){
            result.forEach(function(item){
                list.push({category:category,id:item.id,model:item.model,link:item.link,price:item.price,imglink:item.imglink,link:item.link});
            })
        });
    }

}


//parse single page
function parsePage(url, callback) {
    // Make the request via phantomjs
    logger.info("Visiting page " + url);
    var filename= 'temp.html';
    getPage2File(url, filename, function(error){
        if (error) {
            //error
            var error = new VError("parsepage error", error) 
            logger.error(error);
            callback(error); 
        }
        fs.readFile(filename, (err, data) => {
          if (err) throw err;

            var $ = cheerio.load(data, {
                decodeEntities: false
            });
            
             var htmllist =[];
            $('li.prodItem', '#listBodyDiv').each( function (i, elm) {
                var model = $(elm).find('a.prodName').text();
                var html = $(elm).html();
                var id = $(elm).attr('id');
                var idnum = id.split('_')[1];
                var price = $(elm).find('.don').text();;
                var link='http://www.enuri.com/detail.jsp?modelno='+idnum;
                var imglink='http://photo3.enuri.com/data/images/service/img_300/'+(idnum-idnum%1000)+'/'+idnum+'.jpg';
                var newItem = {id:id,model:model,price:price,imglink:imglink,link:link};
                htmllist.push(newItem);
                logger.info(newItem);
            });
            callback(null,htmllist);        
        });
    });

}