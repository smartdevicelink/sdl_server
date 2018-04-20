const express = require('express');
let app = express();

//custom modules
const config = require('../../settings'); //configuration module
const log = require(`../../custom/loggers/${config.loggerModule}/index.js`);
const db = require(`../../custom/databases/${config.dbModule}/index.js`)(log); //pass in the logger module that's loaded
const flame = require('../../lib/flame-box');
const parcel = require('./helpers/parcel');
const Cron = require('cron').CronJob;

//set up the app locals object
app.locals.config = config;
app.locals.log = log;
app.locals.db = db;
app.locals.flow = flame.flow;
app.locals.flame = flame;

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
const moduleConfig = require('./module-config/controller.js');
const auth = require('./middleware/auth.js');

function exposeRoutes () {
	// extend response builder to all routes
	app.route("*").all(parcel.extendExpress);

	//route definitions
	//app.post('/login', login.post);
	//app.post('/forgot', forgot.post);
	//app.post('/register', register.post);
	app.post('/login/basic', login.validateBasicAuth);
	app.get('/applications', auth.validateBasicAuth, applications.get);
	app.post('/applications/action', auth.validateBasicAuth, applications.actionPost);
	app.post('/applications/auto', auth.validateBasicAuth, applications.autoPost);
	app.post('/webhook', applications.webhook); //webhook route
	//begin policy table routes
	app.post('/staging/policy', policy.postFromCoreStaging);
	app.post('/production/policy', policy.postFromCoreProduction);
	app.get('/policy/preview', policy.getPreview);
	app.post('/policy/apps', policy.postAppPolicy);
	//end policy table routes
	app.post('/permissions/update', auth.validateBasicAuth, permissions.post);
	app.get('/permissions/unmapped', auth.validateBasicAuth, permissions.get);
	app.get('/groups', auth.validateBasicAuth, groups.get);
	app.post('/groups', auth.validateBasicAuth, groups.postAddGroup);
	app.post('/groups/promote', auth.validateBasicAuth, groups.postPromote);
	app.get('/messages', auth.validateBasicAuth, messages.getInfo);
	app.post('/messages', auth.validateBasicAuth, messages.postAddMessage);
	app.post('/messages/promote', auth.validateBasicAuth, messages.postPromoteMessages);
	app.post('/messages/update', auth.validateBasicAuth, messages.updateLanguages);
	app.get('/module', auth.validateBasicAuth, moduleConfig.get);
	app.post('/module', auth.validateBasicAuth, moduleConfig.post);
	app.post('/module/promote', auth.validateBasicAuth, moduleConfig.promote);
}

function updatePermissionsAndGenerateTemplates (next) {
	permissions.update(function () {
		//generate functional group templates for fast responding to the UI for function group info
		//requires that permission information has updated
		groups.generateFunctionGroupTemplates(function () {
			log.info("Functional groups generated");
			if (next) {
				next();
			}
		});
	});
}

//do not allow routes to be exposed until these async functions are completed
flame.async.parallel([
	//get and store permission info from SHAID on startup
	updatePermissionsAndGenerateTemplates,
	function (next) {
		//get and store language code info from the GitHub SDL RPC specification on startup
		messages.updateLanguages(function () {
			log.info("Language list updated");
			next();
		});
	},
	function (next) {
		//get and store app info from SHAID on startup
		applications.queryAndStoreApplicationsFlow({})(function () {
			log.info("App information updated");
			next();
		});
	},
], function () {
	log.info("Start up complete. Exposing routes.");
	exposeRoutes();
});

//cron job for running updates. runs once a day at midnight
new Cron('00 00 00 * * *', updatePermissionsAndGenerateTemplates, null, true);
new Cron('00 00 00 * * *', messages.updateLanguages, null, true);