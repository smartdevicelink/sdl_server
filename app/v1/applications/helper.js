const check = require('check-types');
const app = require('../app');
const model = require('./model.js');
const setupSql = app.locals.db.setupSqlCommand;
const sql = require('./sql.js');
const flow = app.locals.flow;
const flame = app.locals.flame;
const log = app.locals.log;
const db = app.locals.db;

//validation functions

function validateActionPost (req, res) {
	if (!req.body.id || !req.body.approval_status) {
		res.parcel.setStatus(400).setMessage("Id and approval status required");
	} else if (req.body.approval_status !== 'PENDING'
		&& req.body.approval_status !== 'ACCEPTED'
		&& req.body.approval_status !== 'DENIED') {
			res.parcel.setStatus(400).setMessage("Invalid approval status value");
	}
	return;
}

function validateAutoPost (req, res) {
	if (!check.string(req.body.uuid) || !check.boolean(req.body.is_auto_approved_enabled)) {
		res.parcel.setStatus(400).setMessage("Uuid and auto approved required");
	}
    return;
}

function validateWebHook (req, res) {
    if (req.body.entity === "application") {
        //valid
    }
    else {
        //request contained an entity the server cannot handle
        res.parcel.setStatus(500).setMessage("Entity property is undefined or not valid");
    }
    return;
}

//helper functions

//gets back app information depending on the filters passed in
function createAppInfoFlow (filterTypeFunc, value) {
	const getAppFlow = app.locals.flow({
		appBase: setupSql.bind(null, sql.getApp.base[filterTypeFunc](value)),
		appCountries: setupSql.bind(null, sql.getApp.countries[filterTypeFunc](value)),
		appDisplayNames: setupSql.bind(null, sql.getApp.displayNames[filterTypeFunc](value)),
		appPermissions: setupSql.bind(null, sql.getApp.permissions[filterTypeFunc](value)),
		appVendors: setupSql.bind(null, sql.getApp.vendor[filterTypeFunc](value)),
		appCategories: setupSql.bind(null, sql.getApp.category[filterTypeFunc](value)),
		appAutoApprovals: setupSql.bind(null, sql.getApp.autoApproval[filterTypeFunc](value))
	}, {method: 'parallel', eventLoop: true});

	return app.locals.flow([getAppFlow, model.constructFullAppObjs], {method: "waterfall", eventLoop: true});
}

//application store functions

function storeApps (includeApprovalStatus, apps, callback) {
    const fullFlow = flow([
        //first check if the apps need to be stored in the database
        flow(flame.map(apps, checkNeedsInsertion), {method: "parallel"}), 
        filterApps.bind(null, includeApprovalStatus), 
        //each app surviving the filter should be checked with the app_auto_approval table to see if it its status
        //should change to be accepted
        function (appObjs, next) {
            flame.async.map(appObjs, autoApprovalModifier, next);
        },
        function (appObjs, next) {
            flame.async.map(appObjs, model.storeApp, next);
        }
    ], {method: "waterfall", eventLoop: true});

    fullFlow(function (err, res) {
        if (err) {
            log.error(err);
        }
        callback();
    });
}

//determine whether the object needs to be stored in the database
function checkNeedsInsertion (appObj, next) {
    const timestamp = appObj.updated_ts;
    const tableName = 'app_info';
    const whereObj = {app_uuid: appObj.uuid};
    //compare timestamps to determine if the object passed in actually changed before insertion
    const getObjStr = sql.timestampCheck(tableName, whereObj);
    db.sqlCommand(getObjStr, function (err, data) {
        const dbTimestamp = data[0].max;
        if (dbTimestamp !== null && dbTimestamp !== undefined && timestamp !== null && timestamp !== undefined) {
            const incomingDate = new Date(timestamp);
            const currentDate = new Date(dbTimestamp);
            if (incomingDate > currentDate) {
                //the app in the policy server's database is outdated! 
                next(null, appObj);
            }
            else { //app is already there
                next(null, null);
            }
        }
        else {
            //app doesn't exist, or has missing timestamp information! add the app
            next(null, appObj);
        }
    });
}

//any elements that are null are removed
//furthermore, remove approval status here if necessary
function filterApps (includeApprovalStatus, appObjs, next) {
    let filtered = appObjs.filter(function (appObj) {
        return appObj !== null;
    });
    filtered = filtered.map(function (appObj) {
        //if includeApprovalStatus is false, ignore the approval_status attribute by removing it
        //this would allow the database default to be used
        if (!includeApprovalStatus) {
            delete appObj.approval_status;
        }
        return appObj;
    });
    next(null, filtered);
}

//auto changes any app's approval status to ACCEPTED if a record was found for that app's uuid in the auto approval table
function autoApprovalModifier (appObj, next) {
    db.sqlCommand(sql.checkAutoApproval(appObj.uuid), function (err, res) {
        //if res is not an empty array, then a record was found in the app_auto_approval table
        //change the status of this appObj to ACCEPTED
        if (res.length > 0) {
            appObj.approval_status = 'ACCEPTED';
        }
        next(null, appObj); 
    });
}

module.exports = {
	validateActionPost: validateActionPost,
	validateAutoPost: validateAutoPost,
    validateWebHook: validateWebHook,
	createAppInfoFlow: createAppInfoFlow,
	storeApps: storeApps
}