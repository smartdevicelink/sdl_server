//load the environment variables from the .env file in the same directory
require('dotenv').config();
//load modules
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config.js'); //configuration module
//load custom modules described in the config
const log = require(`./custom/loggers/${config.loggerModule}/index.js`);
const db = require(`./custom/databases/${config.dbModule}/index.js`)(log); //pass in the logger module that's loaded

//require an array of modules used to get updated information from sources (ex. SHAID) to the database
const collectors = config.collectors.map(function (module) {
    return require(`./custom/data-collectors/${module}/index.js`)(log);
});

const builder = require(`./custom/policy-builders/${config.builderModule}/index.js`)(log);

/* TODO: Inform user that they have to create the database on their own? */

const versions = ["1"];

let app = express();
app.use(bodyParser.json()); //allow json parsing
app.use(bodyParser.urlencoded({extended: true})); //for parsing application/x-www-form-urlencoded

//attach custom modules
app.locals.config = config;
app.locals.log = log;
app.locals.db = db;
app.locals.collectors = collectors;
app.locals.builder = builder;

//load all routes located in the app directory using a v<version number> naming convention
for (let i in versions){
    app.use(["/api/v"+versions[i], "/api/"+versions[i]], require("./app/v" + versions[i] + "/app"));
}

//global routes

//basic health check endpoint
app.get("/health", function (req, res){
    res.sendStatus(200);
});

//error catcher
app.use(function (err, req, res, next){
    app.locals.log.error(err);
    res.sendStatus(500);
    return;
});

//404 catch-all
app.use(function (req, res){
    res.sendStatus(404);
});

//start the server
app.listen(config.policyServerPort, function () {
    log.info(`Policy server started on port ${config.policyServerPort}!`);
});