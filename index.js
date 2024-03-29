//load modules
const fs = require('fs');
const express = require('express');
const https = require('https');
const helmet = require('helmet');
const bodyParser = require('body-parser');
//const EventEmitter = require('events');
const config = require('./settings.js'); //configuration module
const packageJson = require('./package.json'); //configuration module
const log = require(`./custom/loggers/${config.loggerModule}/index.js`); //logger module
const cache = require('./custom/cache');

const versions = ["1"];
const htmlLocation = __dirname + '/dist/index.html';

//TODO: callback once the routes are opened
if (process.env.OVERRIDE_ENTRY_POINT) {
    //do not run the API server, which will allow a parent module to control execution and pass in their own express app
}
else {
    start();
}

//running this starts the API server
function start (overrideApp) {
    let app;
    if (overrideApp) {
        app = overrideApp;
    }
    else {
        app = express();
    }
    app.use(helmet());
    app.use(bodyParser.json({limit: "1mb"})); //allow json parsing
    app.use(bodyParser.urlencoded({extended: true, limit: "1mb"})); //for parsing application/x-www-form-urlencoded

    //load all routes located in the app directory using a v<version number> naming convention
    for (let i in versions){
        app.use(["/api/v"+versions[i], "/api/"+versions[i]], require("./app/v" + versions[i] + "/app"));
    }

    //load up the html, js and css content that makes up the UI
    // do not serve the compiled version of the code if we are running in dev mode
    // we want hot reloading managed by the webpack dev server instead
    if (process.env.RUN_STATE !== 'dev') {
        app.use(express.static(__dirname + '/dist'));
    }
    //expose everything in the static folder
    app.use(express.static(__dirname + '/static'));

    //global routes

    //basic health check endpoint
    app.get("/health", function (req, res) {
        res.sendStatus(200);
    });

    //version endpoint (based on package.json version)
    app.get("/version", function (req, res) {
        res.status(200).send(packageJson.version)
    });

    //error catcher
    // eslint-disable-next-line no-unused-vars
    app.use(function (err, req, res, next) {
        log.error(err);
        res.sendStatus(500);
        return;
    });

    if (!overrideApp) {
        //catch-all route. serve the index.html file again. this is so vue-router's history mode functions
        app.use(function (req, res) {
            res.sendFile(htmlLocation);
        });
    }

    // Invalidate previous data in the cache on startup
    cache.flushAll();

    //start the server
    // if SSL is configured, load the cert and listen on the secure port
    if(config.ssl.policyServerPort && config.ssl.privateKeyFilename && config.ssl.certificateFilename){
        log.info(`Listening for secure connections on port ${config.ssl.policyServerPort}!`);

        //start listening on secure port
        https.createServer({
            "key": fs.readFileSync('./customizable/ssl/' + config.ssl.privateKeyFilename),
            "cert": fs.readFileSync('./customizable/ssl/' + config.ssl.certificateFilename)
        }, app).listen(config.ssl.policyServerPort);
    }


    if (!overrideApp) {
        //start the server on the unsecure port
        app.listen(config.policyServerPort, function () {
            log.info(`Policy server started on port ${config.policyServerPort}!`);
        });
    }
}

module.exports = function (app) {
    start(app);
}
