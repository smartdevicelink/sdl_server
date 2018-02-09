const app = require('../app');
const model = require('./model.js');
const setupSql = app.locals.sql.setupSqlCommand;

//validation functions

function validateActionPost (req, res) {
	if (!req.body.id || !req.body.approval_status) {
		res.parcel.setStatus(400).setMessage("Id and approval status required");
	}else if (req.body.approval_status !== 'PENDING'
		&& req.body.approval_status !== 'ACCEPTED'
		&& req.body.approval_status !== 'DENIED') {
			res.parcel.setStatus(400).setMessage("Invalid approval status value");
	}

	return;
}

function validateAutoPost (req, res) {
	if (!check.string(req.body.uuid) || !check.boolean(req.body.is_auto_approved_enabled)) {
		res.parcel.setStatus(400).setMessage("Uuid and auto approved required");
		return;
	}
}

//helper functions

//gets back app information depending on the filters passed in
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

	return app.locals.flow([getAppFlow, model.constructFullAppObjs], {method: "waterfall"});
}

//executes a flow in waterfall mode, sending statuses back based on the results
function handleResponseStatusFlow (flow, res) {
	app.locals.flow(flow, {method: "waterfall"})(function (err, results) {
		if (err) {
			app.locals.log.error(err);
			return res.parcel.setStatus(500).deliver();
		}
		return res.parcel.setStatus(200).deliver();
	});
}

module.exports = {
	validateActionPost: validateActionPost,
	validateAutoPost: validateAutoPost,
	createAppInfoFlow: createAppInfoFlow,
	handleResponseStatusFlow: handleResponseStatusFlow
}