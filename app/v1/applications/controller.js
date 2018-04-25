const app = require('../app');
const helper = require('./helper.js');
const sql = require('./sql.js');
const flow = app.locals.flow;
const async = require('async');

function get (req, res, next) {
	//prioritize id, uuid, approval status, in that order.
	//only one parameter can be acted upon in one request
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

	app.locals.db.runAsTransaction(function (client, callback) {
		async.waterfall([
			// Blacklist/Unblacklist app
			function (callback) {
				if (req.body.blacklist) {
					client.getOne(sql.insertAppBlacklist(req.body), callback);
				} else {
					client.getOne(sql.deleteAppBlacklist(req.body.uuid), callback);
				}
			},
			// Update approval status for app
			function (blacklist, callback) {
				client.getOne(sql.changeAppApprovalStatus(req.body.id, req.body.approval_status, (req.body.denial_message || null)), callback);
			}
		], callback);
	}, function (err, response) {
		if (err) {
			app.locals.log.error(err);
			return res.parcel.setStatus(500).deliver();
		} else {
			return res.parcel.setStatus(200).deliver();
		}
	});
}

function autoPost (req, res, next) {
	helper.validateAutoPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	let chosenCommand;

	if (req.body.is_auto_approved_enabled) {
		//add the uuid to the auto approval table
        chosenCommand = app.locals.db.sqlCommand.bind(null, sql.insertAppAutoApproval(req.body));
	}
	else {
		//remove the uuid from the auto approval table
        chosenCommand = app.locals.db.sqlCommand.bind(null, sql.deleteAutoApproval(req.body.uuid));
	}

    chosenCommand(function (err, results) {
        if (err) {
            app.locals.log.error(err);
            return res.parcel.setStatus(500).deliver();
        }
        return res.parcel.setStatus(200).deliver();
    });
}

//expects a POST from SHAID
function webhook (req, res, next) {
    helper.validateWebHook(req, res);
    if (res.parcel.message) {
        return res.parcel.deliver();
    }

    if (req.body.entity === "application") {
        const query = {
            uuid: req.body.uuid
        };

        const queryAndStoreFlow = queryAndStoreApplicationsFlow(query);

        queryAndStoreFlow(function (err) {
            if (err) {
                req.app.locals.log.error(err);
            }
            res.parcel.setStatus(200);
            res.parcel.deliver();
        });
    }
}

//queries SHAID to get applications and stores them into the database
function queryAndStoreApplicationsFlow (queryObj) {
    return flow([
    	app.locals.shaid.getApplications.bind(null, queryObj),
    	helper.storeApps.bind(null, false)
    ], {method: 'waterfall', eventLoop: true});
}

module.exports = {
	get: get,
	actionPost: actionPost,
	autoPost: autoPost,
	webhook: webhook,
	queryAndStoreApplicationsFlow: queryAndStoreApplicationsFlow
};
