var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.use(express.static(__dirname + '/public'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

var mongoose = require('mongoose');
var options = {
  server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};
mongoose.connect('mongodb://localhost/twitTest',options);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('connection success');
});

var Schema = mongoose.Schema;

var trendSchema = new Schema({
  volume: String,
  name: String
});

trendSchema.set('collection', 'trendModel');

var TwitterSchema = new Schema({
  content:  String
});

TwitterSchema.set('collection', 'TwModel');

var wordSchema = new Schema({
	_id: String,
	value: Number
});

wordSchema.set('collection', 'wordCount');

var twitter = require('twitter');

var twit = new twitter({
  consumer_key: 'NMxdLNNCnGnO7H8mXkFBHg4Ui',
  consumer_secret: 'GAieSSl6R8ES7uJgchHClhgJ4U2kin1lNI4BHabMOinkjNzTiJ',
  access_token_key: '4042358579-UWO5jHx4VwyvVjkYwfI7h33kNiQkDZ0IGVlmebu',
  access_token_secret: 'ekNwB8ISYheljq5AJQKfm2BKU9ZfNliKqEFWsNxlAeKKz'
});

var trendModel = mongoose.model('trendModel',trendSchema);
var TwModel = mongoose.model('TwModel',TwitterSchema);
var wordCount = mongoose.model('wordCount', wordSchema);
console.log("Model names:");
console.log(mongoose.modelNames());
var keyword = "00012012012012012";
var option = {'track': keyword};

twit.get('trends/place', {id: 23424977}, function(error, data, response) {
  if(error) {
    console.log(error);
  }

    var jsonResponse = data[0];

    function getNamePair() {
      for (var key in jsonResponse.trends) {
        var name = jsonResponse.trends[key].name;
        var volume = jsonResponse.trends[key].tweet_volume;
        console.log(key, "Name - " + name + ", tweet_vol - " + volume);
      }
    }
    getNamePair();

    // var tweets = '[{"as_of":"2012-08-24T23:25:43Z","created_at":"2012-08-24T23:24:14Z","locations":[{"name":"Worldwide","woeid":1}],"trends":[{"tweet_volume":3200,"events":null,"name":"#GanaPuntosSi","promoted_content":null,"query":"%23GanaPuntosSi","url":"http://twitter.com/search/?q=%23GanaPuntosSi"},{"tweet_volume":4200,"events":null,"name":"#WordsThatDescribeMe","promoted_content":null,"query":"%23WordsThatDescribeMe","url":"http://twitter.com/search/?q=%23WordsThatDescribeMe"}]}]';
    //
    // var storeData = ({name, volume}) => console.log(`${name} has a tweet volume of ${volume}`);
    //
    // JSON.parse(tweets)[0]["trends"].forEach( n => {
    //   storeData({name: n.name, volume: n.tweet_volume});
    // });

  // var trendmodel = new trendModel();
  // trendmodel.value = data.tweet_volume;
  // trendmodel.name = data.name;
  // trendmodel.save(function(err, data) {
  //   if (err) return console.error(err);
  //   console.log(data);
  // });
});

TwModel.remove(function(err, p){
  if(err){
    throw err;
  } else{
    console.log('No Of TwModel Documents deleted:' + p);
  }
});

wordCount.remove(function(err, p){
  if(err){
    throw err;
  } else{
    console.log('No Of wordCount Documents deleted:' + p);
  }
});

console.log('Searching for ' + keyword);

twit.stream('statuses/filter', option, function(stream) {
  stream.on('data', function(data){
    if(data.lang === 'en'){
      var twmodel = new TwModel();
      twmodel.content = data.text;
      twmodel.save(function(err, data) {
        if (err) return console.error(err);
        console.log(data);
      });
    }
  });
});

app.get('/api/twmodel', function (req, res) {
	TwModel.find(function (err, data) {
		res.json(data);
	});
});

app.get('/api/wordCount', function (req, res) {
  wordCount.find({}).sort({value:'descending'}).exec(function (err, data) {
    if(err) {
      console.log("Error detected");
          console.log(err);
    }
    //console.log(data);
		res.json(data);
	});
});

app.listen(3000);

var timer;

timer = setInterval(wordFreq, 1000);

function wordFreq(){
	var map = function() {
    var summary = this.content;
    if (summary) {
      summary = summary.replace(/(http\S+)/gi, ' ');
      summary = summary.replace(/(@\S+)/gi, ' ');
      summary = summary.replace(/(&\S+)/gi, ' ');
      summary = summary.replace(/(\n)/gi, '');
      summary = summary.replace(/[^A-Za-z0-9\s]/g, '');
      summary = summary.replace(/(\\\S+)/gi, ' ');
      summary = summary.replace(/\bMT\b|\bRT\b|\bA\b|\bABOUT\b|\bABOVE\b|\bAFTER\b|\bAGAIN\b|\bAGAINST\b|\bALL\b|\bAM\b|\bAN\b|\bAND\b|\bANY\b|\bARE\b|\bARENT\b|\bAS\b|\bAT\b|\bBE\b|\bBECAUSE\b|\bBEEN\b|\bBEFORE\b|\bBEING\b|\bBELOW\b/gi, ' ');
      summary = summary.replace(/\bBOTH\b|\bBUT\b|\bBY\b|\bCANT\b|\bCANNOT\b|\bCOULD\b|\bCOULDNT\b|\bDID\b|\bDIDNT\b|\bDO\b|\bDOES\b|\bDOESNT\b|\bDOING\b|\bDONT\b|\bDOWN\b|\bDURING\b|\bEACH\b|\bFEW\b|\bFOR\b|\bFROM\b|\bFURTHER\b|\bHAD\b|\bHADNT\b|\bHAS\bYRE\b/gi, ' ');
      summary = summary.replace(/\bHASNT\b|\bHAVE\b|\bHAVENT\b|\bHAVING\b|\bHE\b|\bHED\b|\bHELL\b|\bHES\b|\bHER\b|\bHERE\b|\bHERES\b|\bHERS\b|\bHERSELF\b|\bHIM\b|\bHIMSELF\b|\bHIS\b|\bHOW\b|\bHOWS\b|\bI\b|\bID\b|\bILL\b|\bIM\b|\bIVE\b|\bIF\b/gi, ' ');
      summary = summary.replace(/\bIN\b|\bINTO\b|\bIS\b|\bISNT\b|\bIT\b|\bITS\b|\bITS\b|\bITSELF\b|\bLETS\b|\bME\b|\bMORE\b|\bMOST\b|\bMUSTNT\b|\bMY\b|\bMYSELF\b|\bNO\b|\bNOR\b|\bNOT\b|\bOF\b|\bOFF\b|\bON\b|\bONCE\b|\bONLY\b|\bOR\b/gi, ' ');
      summary = summary.replace(/\bOTHER\b|\bOUGHT\b|\bOUR\b|\bOURS\b|\bOURSELVES\b|\bOUT\b|\bOVER\b|\bOWN\b|\bSAME\b|\bSHANT\b|\bSHE\b|\bSHED\b|\bSHES\b|\bSHOULD\b|\bSHOULDNT\b|\bSO\b|\bSOME\b|\bSUCH\b|\bTHAN\b|\bTHAT\b|\bTHATS\b|\bTHE\b|\bTHEIR\b|\bTHEIRS\b/gi, ' ');
      summary = summary.replace(/\bTHEM\b|\bTHEMSELVES\b|\bTHEN\b|\bTHERE\b|\bTHERES\b|\bTHESE\b|\bTHEY\b|\bTHEYD\b|\bTHEYLL\b|\bTHEYRE\b|\bTHEYVE\b|\bTHIS\b|\bTHOSE\b|\bTHROUGH\b|\bTO\b|\bTOO\b|\bUNDER\b|\bUNTIL\b|\bUP\b|\bVERY\b|\bWAS\b|\bWASNT\b|\bWE\b|\bWED\b/gi, ' ');
      summary = summary.replace(/\bWELL\b|\bWERE\b|\bWEVE\b|\bWERENT\b|\bWHAT\b|\bWHATS\b|\bWHEN\b|\bWHENS\b|\bWHERE\b|\bWHERES\b|\bWHICH\b|\bWHILE\b|\bWHO\b|\bWHOS\b|\bWHOM\b|\bWHY\b|\bWHYS\b|\bWITH\b|\bWONT\b|\bWOULD\b|\bWOULDNT\b|\bYOU\b|\bYOUD\b|\bYOULL\b/gi, ' ');
      summary = summary.replace(/\bYOURE\b|\bYOUVE\b|\bYOUR\b|\bYOURS\b|\bYOURSELF\b|\bYOURSELVES\b/gi, ' ');
      summary = summary.toUpperCase().split(' ');
      for (var i=0; i<summary.length; i++) {
        if (summary[i]) {
          emit(summary[i], 1);
        }
      }
    }
  };

  var reduce = function( key, values ) {
    var count = 0;
    values.forEach(function(v) {
      count +=v;
    });
    return count;
  }
  TwModel.collection.mapReduce(map, reduce, {out: { merge: "wordCount"}})
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
