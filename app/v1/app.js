const express = require('express');
let app = express();

//custom modules
const config = require('../../settings.js'); //configuration module
const log = require(`../../custom/loggers/${config.loggerModule}/index.js`);
const db = require(`../../custom/databases/${config.dbModule}/index.js`)(log); //pass in the logger module that's loaded
const sql = require('../../lib/sql'); //module for easily setting up SQL commands
const flow = require('../../lib/flow'); //module for executing asynchronous functions without nesting

//set up the app locals object
app.locals.config = config;
app.locals.log = log;
app.locals.db = db;
app.locals.sql = sql;
app.locals.flow = flow;

//export app before requiring dependent modules to avoid circular dependency issues
module.exports = app;

//load all the routes in the controllers module and other places
const moduleConfig = require('./policy/moduleConfig.js');
const functionalGroup = require('./policy/functionalGroup.js')(app);
const consumerMessages = require('./policy/consumerMessages.js')(app);
const appPolicy = require('./policy/appPolicy.js')(app);
const fresh = require('./policy/fresh.js');

const login = require('./controllers/login');
const forgot = require('./controllers/forgot');
const register = require('./controllers/register');
const applications = require('./controllers/applications');
const policy = require('./controllers/policy');

//route definitions
app.post('/login', login.post);
app.post('/forgot', forgot.post);
app.post('/register', register.post);
app.get('/applications', applications.get);
app.post('/applications/action', applications.actionPost);
app.post('/staging/policy', policy.postStaging);
app.post('/production/policy', policy.postProduction);


const policyTableBuilder = app.locals.flow([fresh.makeCoolTables], {method: 'parallel'});

policyTableBuilder(function (err, res) {
    app.locals.log.info('Update complete');
});
