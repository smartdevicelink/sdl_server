const app = require('../app');
const setupSql = app.locals.db.setupSqlCommand;
const check = require('check-types');
const helper = require('./helper.js');
const model = require('./model.js');

function get (req, res, next) {
	//prioritize id, uuid, approval status, in that order.
	//only one parameter can be acted upon in one request
	const appFilterApproval = app.locals.sql.getAppApprovalStatus;
	const appFilterId = app.locals.sql.getAppId;
	let chosenFlow; //to be determined

	if (req.query.id) { //filter by id
		chosenFlow = helper.createAppInfoFlow('idFilter', req.query.id);
	}
	else if (req.query.uuid) { //filter by app uuid
		chosenFlow = helper.createAppInfoFlow('multiFilter', {app_uuid: req.query.uuid});
	}
	else if (req.query.approval_status) { //filter by approval status
		chosenFlow = helper.createAppInfoFlow('multiFilter', {approval_status: req.query.approval_status});
	}
	else { //get all applications whose information are the latest versions
		chosenFlow = helper.createAppInfoFlow('multiFilter');
	}

	chosenFlow(function (err, apps) {
		if (err) {
			app.locals.log.error(err);
			res.parcel.setStatus(500);
		}else{
			res.parcel
				.setStatus(200)
				.setData({
					applications: apps
				});
		}
		return res.parcel.deliver();
	});
}

//TODO: emailing system for messaging the developer about the approval status change
function actionPost (req, res, next) {
	helper.validateActionPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	//get app by id, and modify the existing entry in the database to change the approval status
	const modifyAppFlow = [
		setupSql.bind(null, app.locals.sql.changeAppApprovalStatus(req.body.id, req.body.approval_status))
	];

	helper.handleResponseStatusFlow(modifyAppFlow, res);
}

function autoPost (req, res, next) {
	helper.validateAutoPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	let chosenFlow;

	if (req.body.is_auto_approved_enabled) {
		//add the uuid to the auto approval table
		const appObj = {
			is_auto_approved_enabled: req.body.is_auto_approved_enabled,
			uuid: req.body.uuid
		};
		chosenFlow = app.locals.db.setupSqlCommands(app.locals.sql.insert.appAutoApproval(appObj));
	}
	else {
		//remove the uuid from the auto approval table
		chosenFlow = [setupSql.bind(null, app.locals.sql.delete.autoApproval(req.body.uuid))];
	}

	helper.handleResponseStatusFlow(chosenFlow, res);
}

module.exports = {
	get: get,
	actionPost: actionPost,
	autoPost: autoPost
};
