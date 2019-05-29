const express = require('express');
const helmet = require('helmet');
let app = express();
const path = require('path');

//custom modules
const config = require('../../settings'); //configuration module
const log = require(`../../custom/loggers/${config.loggerModule}/index.js`);
const db = require(`../../custom/databases/${config.dbModule}/index.js`)(log); //pass in the logger module that's loaded
const flame = require('../../lib/flame-box');
const hashify = require('../../lib/hashify');
const arrayify = require('../../lib/arrayify');
const emailer = require('../../lib/emailer');
const parcel = require('./helpers/parcel');
const Cron = require('cron').CronJob;

//set up the app locals object
app.locals.config = config;
app.locals.log = log;
app.locals.db = db;
app.locals.flow = flame.flow;
app.locals.hashify = hashify;
app.locals.arrayify = arrayify;
app.locals.emailer = emailer;
app.locals.flame = flame;
app.locals.version = path.basename(__dirname);

// construct base URL, e.g. "http://localhost:3000"
app.locals.baseUrl = "http";
if(app.locals.config.policyServerPort == 443) app.locals.baseUrl += "s";
app.locals.baseUrl += "://" + app.locals.config.policyServerHost;
if(![80,443].includes(app.locals.config.policyServerPort)) app.locals.baseUrl += ":" + app.locals.config.policyServerPort;

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
const services = require('./services/controller.js');
const moduleConfig = require('./module-config/controller.js');
const about = require('./about/controller.js');
const auth = require('./middleware/auth.js');

function exposeRoutes () {
	// use helmet middleware for security
	app.use(helmet());
	// extend response builder to all routes
	app.route("*").all(parcel.extendExpress);

	//route definitions
	//app.post('/forgot', forgot.post);
	//app.post('/register', register.post);
	app.post('/login', login.validateAuth);
	app.get('/applications', auth.validateAuth, applications.get);
	app.post('/applications/action', auth.validateAuth, applications.actionPost);
	app.post('/applications/auto', auth.validateAuth, applications.autoPost);
	app.post('/applications/administrator', auth.validateAuth, applications.administratorPost);
	app.post('/applications/passthrough', auth.validateAuth, applications.passthroughPost);
	app.post('/applications/hybrid', auth.validateAuth, applications.hybridPost);
	app.put('/applications/service/permission', auth.validateAuth, applications.putServicePermission);
	app.post('/webhook', applications.webhook); //webhook route
	//begin policy table routes
	app.post('/staging/policy', policy.postFromCoreStaging);
	app.post('/production/policy', policy.postFromCoreProduction);
	app.get('/policy/preview', policy.getPreview);
	app.post('/policy/apps', policy.postAppPolicy);
	//end policy table routes
	app.post('/permissions/update', auth.validateAuth, permissions.post);
	app.get('/permissions/unmapped', auth.validateAuth, permissions.get);
	app.get('/groups', auth.validateAuth, groups.get);
	app.get('/groups/names', auth.validateAuth, groups.getNames);
	app.post('/groups', auth.validateAuth, groups.postAddGroup);
	app.post('/groups/promote', auth.validateAuth, groups.postPromote);
	app.get('/messages', auth.validateAuth, messages.getInfo);
	app.get('/messages/names', auth.validateAuth, messages.getNames);
	app.post('/messages', auth.validateAuth, messages.postAddMessage);
	app.post('/messages/promote', auth.validateAuth, messages.postPromoteMessages);
	app.post('/messages/update', auth.validateAuth, messages.postUpdate);
	app.get('/module', auth.validateAuth, moduleConfig.get);
	app.post('/module', auth.validateAuth, moduleConfig.post);
	app.post('/module/promote', auth.validateAuth, moduleConfig.promote);
	app.get('/about', auth.validateAuth, about.getInfo);
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
		// get and store app service type info from SHAID on startup
		services.upsertTypes(function () {
			log.info("App service types updated");
			next();
		});
	},
	function (next) {
		//get and store language code info from the GitHub SDL RPC specification on startup
		messages.updateLanguages(function () {
			log.info("Language list updated");
			next();
		});
	},
	function (next) {
		//get and store app info from SHAID on startup
		applications.queryAndStoreApplicationsFlow({}, false)(function () {
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
