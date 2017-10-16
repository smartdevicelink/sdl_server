//load the environment variables from the .env file in the same directory
require('dotenv').config();
//load modules
const express = require('express');
const bodyParser = require('body-parser');
const EventEmitter = require('events');
const config = require('./settings.js'); //configuration module
const log = require(`./custom/loggers/${config.loggerModule}/index.js`); //logger module

const versions = ["1"];
const rootLocation = __dirname + '/../client/public';

let app = express();
app.use(bodyParser.json()); //allow json parsing
app.use(bodyParser.urlencoded({extended: true})); //for parsing application/x-www-form-urlencoded

//load all routes located in the app directory using a v<version number> naming convention
for (let i in versions){
    app.use(["/api/v"+versions[i], "/api/"+versions[i]], require("./app/v" + versions[i] + "/app"));
}

app.use(express.static(__dirname + '/dist'));

//global routes

//basic health check endpoint
app.get("/health", function (req, res) {
    res.sendStatus(200);
});

//loader.io verification route for load testing
app.get("/loaderio-8e4d80eaf952e3e972feea1072b80f9f", function (req, res) {
    res.send("loaderio-8e4d80eaf952e3e972feea1072b80f9f");
});

//error catcher
app.use(function (err, req, res, next) {
    app.locals.log.error(err);
    res.sendStatus(500);
    return;
});

//404 catch-all
app.use(function (req, res) {
    res.sendStatus(404);
});

//start the server
app.listen(config.policyServerPort, function () {
    log.info(`Policy server started on port ${config.policyServerPort}!`);
});
