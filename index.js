//load the environment variables from the .env file in the same directory
require('dotenv').config();
//load modules
const express = require('express');
const bodyParser = require('body-parser');
const EventEmitter = require('events');
const config = require('./settings.js'); //configuration module
const packageJson = require('./package.json'); //configuration module
const log = require(`./custom/loggers/${config.loggerModule}/index.js`); //logger module

const versions = ["1"];
const htmlLocation = __dirname + '/dist/index.html';

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
	app.use(bodyParser.json()); //allow json parsing
	app.use(bodyParser.urlencoded({extended: true})); //for parsing application/x-www-form-urlencoded

	//load all routes located in the app directory using a v<version number> naming convention
	for (let i in versions){
	    app.use(["/api/v"+versions[i], "/api/"+versions[i]], require("./app/v" + versions[i] + "/app"));
	}

	//load up the html, js and css content that makes up the UI
	app.use(express.static(__dirname + '/dist'));

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
	app.use(function (err, req, res, next) {
	    log.error(err);
	    res.sendStatus(500);
	    return;
	});

	//catch-all route. serve the index.html file again. this is so vue-router's history mode functions
	app.use(function (req, res) {
	    res.sendFile(htmlLocation);
	});

	//start the server
	app.listen(config.policyServerPort, function () {
	    log.info(`Policy server started on port ${config.policyServerPort}!`);
	});	
}

module.exports = function (app) {
	start(app);
}


