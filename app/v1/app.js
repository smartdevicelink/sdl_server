const express = require('express');
let app = express();

//custom modules
const config = require('../../settings.js'); //configuration module
const log = require(`../../custom/loggers/${config.loggerModule}/index.js`);
const db = require(`../../custom/databases/${config.dbModule}/index.js`)(log); //pass in the logger module that's loaded
const flow = require('../../lib/flow'); //module for executing asynchronous functions without nesting
const parcel = require('./helpers/parcel');
const Cron = require('cron').CronJob;

//set up the app locals object
app.locals.config = config;
app.locals.log = log;
app.locals.db = db;
app.locals.flow = flow;

//export app before requiring dependent modules to avoid circular dependency issues
module.exports = app;

//module for communicating with SHAID
app.locals.shaid = require('./shaid'); 
//load all the routes in the controllers files and other places
const login = require('./login/controller.js');
const forgot = require('./forgot/controller.js');
const register = require('./register/controller.js');
const applications = require('./applications/controller.js');
const policy = require('./policy/controller.js');
const permissions = require('./permissions/controller.js');
const groups = require('./groups/controller.js');
const messages = require('./messages/controller.js');

// extend response builder to all routes
app.route("*").all(parcel.extendExpress);

//route definitions
//app.post('/login', login.post);
//app.post('/forgot', forgot.post);
//app.post('/register', register.post);
app.get('/applications', applications.get);
app.post('/applications/action', applications.actionPost);
app.post('/applications/auto', applications.autoPost);
//begin policy table routes
app.post('/staging/policy', policy.postFromCoreStaging);
app.post('/production/policy', policy.postFromCoreProduction);
app.get('/policy/preview', policy.getPreview);
app.post('/policy/apps', policy.postAppPolicy);
//end policy table routes
app.post('/webhook', app.locals.shaid.webhook); //webhook route
app.post('/permissions/update', permissions.post);
app.get('/permissions/unmapped', permissions.get);
app.get('/groups', groups.get);
app.post('/groups', groups.postAddGroup);
app.post('/groups/promote', groups.postPromote);
app.get('/messages', messages.getInfo);
app.post('/messages', messages.postAddMessage);
app.post('/messages/promote', messages.postPromoteMessages);
app.post('/messages/update', messages.updateLanguages);

/*
NEW APIS
set a flag in the API call whether or not to return the RPC array. if not, just return the counts.
return the counts if true, too, just with all the RPC stuff (permission_count)

have another check that checks whether the user consent prompt exists in the consumer friendly messages
this includes when promoting a functional group record to production status

*/

//get and store permission info from SHAID on startup
permissions.update(function () {});

//get and store language code info from the GitHub SDL RPC specification on startup
messages.updateLanguages(function () {
	log.info("Language list updated");
});

//get and store app info from SHAID on startup
app.locals.shaid.queryAndStoreApplications({}, function () {
	log.info("App information updated");
});

//cron job for running updates. runs once a day at midnight
new Cron('00 00 00 * * *', permissions.update, null, true);
new Cron('00 00 00 * * *', messages.updateLanguages, null, true);