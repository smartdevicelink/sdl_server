const app = require('../../app');
const setupSql = app.locals.sql.setupSqlCommand;
const appInfo = require('./appInfo.js');
const check = require('check-types');

function get (req, res, next) {
	//prioritize id, uuid, approval status, in that order.
	//only one parameter can be acted upon in one request
	const appFilterApproval = app.locals.sql.getAppApprovalStatus;
	const appFilterId = app.locals.sql.getAppId;
	let chosenFlow; //to be determined

	if (req.query.id) { //filter by id
		chosenFlow = createAppInfoFlow('idFilter', req.query.id);
	}
	else if (req.query.uuid) { //filter by app uuid
		chosenFlow = createAppInfoFlow('multiFilter', {app_uuid: req.query.uuid});	
	}
	else if (req.query.approval_status) { //filter by approval status
		chosenFlow = createAppInfoFlow('multiFilter', {approval_status: req.query.approval_status});
	}
	else { //get all applications whose information are the latest versions
		chosenFlow = createAppInfoFlow('multiFilter');
	}

	chosenFlow(function (err, apps) {
		if (err) {
			app.locals.log.error(err);
			return res.sendStatus(500);
		}
		return res.status(200).send({applications: apps});
	});		
}

//TODO: emailing system for messaging the developer about the approval status change
function actionPost (req, res, next) {
	validateActionPost(req, res);
	if (res.errorMsg) {
		return res.status(400).send({ error: res.errorMsg });
	}
	//get app by id, and modify the existing entry in the database to change the approval status
	const modifyAppFlow = [
		setupSql(app.locals.sql.changeAppApprovalStatus(req.body.id, req.body.approval_status))
	];
	/*
	const storeAppFlow = [
		constructAppFlow,
		appInfo.modifyApprovalStatus(req.body.approval_status),
		app.locals.shaid.storeApps(true)
	];
	*/
	handleResponseStatusFlow(modifyAppFlow, res);
}

function validateActionPost (req, res) {
	if (!req.body.id || !req.body.approval_status) {
		return res.errorMsg = "Id and approval status required";
	}
	if (req.body.approval_status !== 'PENDING'
		&& req.body.approval_status !== 'ACCEPTED'
		&& req.body.approval_status !== 'DENIED') {
		return res.errorMsg = "Invalid approval status value";
	}
}

function autoPost (req, res, next) {
	validateAutoPost(req, res);
	if (res.errorMsg) {
		return res.status(400).send({ error: res.errorMsg });
	}
	
	let chosenFlow;

	if (req.body.is_auto_approved_enabled) {
		//add the uuid to the auto approval table
		const appObj = {
			is_auto_approved_enabled: req.body.is_auto_approved_enabled,
			uuid: req.body.uuid
		};
		chosenFlow = app.locals.sql.setupSqlInsertsNoError(app.locals.sql.insert.appAutoApproval(appObj));
	}
	else {
		//remove the uuid from the auto approval table
		chosenFlow = [setupSql(app.locals.sql.delete.autoApproval(req.body.uuid))];
	}

	handleResponseStatusFlow(chosenFlow, res);
}

//helper function to execute a flow in waterfall mode, sending statuses back based on the results
function handleResponseStatusFlow (flow, res) {
	app.locals.flow(flow, {method: "waterfall"})(function (err, results) {
		if (err) {
			app.locals.log.error(err);
			return res.sendStatus(500);
		}
		return res.sendStatus(200);
	});	
}

function validateAutoPost (req, res) {
	if (!check.string(req.body.uuid) || !check.boolean(req.body.is_auto_approved_enabled)) {
		return res.errorMsg = "Uuid and auto approved required";
	}	
}

//helper function that gets back app information depending on the filters passed in
function createAppInfoFlow (filterTypeFunc, value) {
	const getAppFlow = app.locals.flow([
		setupSql(app.locals.sql.getApp.base[filterTypeFunc](value)),
		setupSql(app.locals.sql.getApp.countries[filterTypeFunc](value)),
		setupSql(app.locals.sql.getApp.displayNames[filterTypeFunc](value)),
		setupSql(app.locals.sql.getApp.permissions[filterTypeFunc](value)),
		setupSql(app.locals.sql.getApp.vendor[filterTypeFunc](value)),
		setupSql(app.locals.sql.getApp.category[filterTypeFunc](value)),
		setupSql(app.locals.sql.getApp.autoApproval[filterTypeFunc](value))
	], {method: 'parallel'});

	return app.locals.flow([getAppFlow, appInfo.constructFullAppObjs], {method: "waterfall"});
}

module.exports = {
	get: get,
	actionPost: actionPost,
	autoPost: autoPost
};
