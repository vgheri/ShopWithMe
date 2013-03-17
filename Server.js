// *******************************************************
// expressjs template
//
// assumes: npm install express
// defaults to jade engine, install others as needed
//
// assumes these subfolders:
//   public/
//   public/javascripts/
//   public/stylesheets/
//   views/
//
var express = require('express');
var app = express();
var accountHandler = require('./handlers/AccountHandler');
var routes = require('./Routes');

//var viewEngine = 'jade'; // modify for your view engine
// Configuration
app.configure(function(){
  //app.set('views', __dirname + '/views');
  //app.set('view engine', viewEngine);
  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
  app.use(express.errorHandler());
});

var handlers = {
  account: accountHandler.AccountHandler
};

function start() {
  routes.setup(app, handlers);
  var port = process.env.port || 3000;
  app.listen(port);
  console.log("Express server listening on port %d in %s mode", port, app.settings.env);
}
// *******************************************************
exports.start = start;