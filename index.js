var bunyan = require('bunyan'),
  config = require("./config/"),
  crave = require('crave'),
  express = require('express'),
  compress = require('compression'),
  bodyParser = require('body-parser'),
  path = require('path');

// Create a bunyan logger instance.
var log = bunyan.createLogger(config.log);

//var responseHandler = new (require('seedio-response'))(config, log);

// Create an express application object.
var app = module.exports = express();

// If the cookie is secure and proxy is enabled. We need to
// enable express trust proxy for cookies to be set correctly.
if(config.session.cookie.secure && config.session.proxy) {
  app.enable('trust proxy');
}

// Disable the "X-Powered-By: Express" HTTP header
app.disable("x-powered-by");

// Enable G-ZIP compression.
app.use(compress());

// Parse url encoded json:
// "Content-Type: application/x-www-form-urlencoded"
app.use(bodyParser.urlencoded({ extended: false}));

// Parse bodies with json, "Content-Type: application/json"
app.use(bodyParser.json());

app.set('view engine', 'jade');

// Set directory where jade views are stored.
app.set('views', config.clientDirectory+'/views');

// Make public folder static so it can be served
app.use(express.static(config.clientDirectory+'components', config.express.static));
app.use(express.static(config.clientDirectory+'css', config.express.static));
app.use(express.static(config.clientDirectory+'js', config.express.static));

// Redirect all traffic to '/' to policy.
app.all('/', function(req, res, next) { console.log("Redirect"); res.redirect('/policy'); });

// Log all requests when trace level logging is enabled.
app.all('/*', function(req,res, next) {
  switch(req.method) {
    case "POST":
    case "PUT":
      log.trace(req.method+' '+req.protocol+'://'+req.get('host')+req.originalUrl+'\nBody: ', JSON.stringify(req.body, undefined,2));
      break;
    default:
      log.trace(req.method+' '+req.protocol+'://'+req.get('host')+req.originalUrl);
      break;
  }

  next();
});

// Start the node server.
var start = function(err) {
  if(err) {
    return log.error(err);
  }

  var server = app.listen(config.server.port, function() {
    var serverInfo = this.address();
    var address = (serverInfo.address === "0.0.0.0" || serverInfo.address === "::") ? "localhost" : serverInfo.address;

    log.info("Listening on http://%s:%s", address, serverInfo.port);
  });
};

// Configure Crave.
crave.setConfig(config.crave);

// Recursively load all files of the specified type(s) that are also located in the specified folder.
crave.directory(path.resolve("./app"), [ "model", "api", "client" ], start, app, config, log);