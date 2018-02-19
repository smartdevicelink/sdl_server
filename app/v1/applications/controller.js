const app = require('../app');
const helper = require('./helper.js');
const sql = require('./sql.js');
const flow = app.locals.flow;

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

    //modify the existing entry in the database to change the approval status
    app.locals.db.sqlCommand(sql.changeAppApprovalStatus(req.body.id, req.body.approval_status), function (err, results) {
        if (err) {
            app.locals.log.error(err);
            return res.parcel.setStatus(500).deliver();
        }
        return res.parcel.setStatus(200).deliver();
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

//TODO: remove this
const TEMP_APPS = [{
    "uuid": "9bb1d9c2-5d4c-457f-9d91-86a2f95132df",
    "name": "Two App",
    "display_names": [
        "App Two",
        "Application Two"
    ],
    "platform": "ANDROID",
    "platform_app_id": "com.demo.app.two",
    "status": "PRODUCTION",
    "can_background_alert": false,
    "can_steal_focus": true,
    "tech_email": null,
    "tech_phone": null,
    "default_hmi_level": "HMI_NONE",
    "created_ts": "2017-06-12T13:30:32.912Z",
    "updated_ts": "2017-08-02T19:28:32.912Z",
    "countries": [
        {
            "id": 1,
            "iso": "AD",
            "name": "Andorra"
        },
        {
            "id": 2,
            "iso": "AE",
            "name": "United Arab Emirates"
        }
    ],
    "permissions": [
        {
            "id": 18,
            "key": "accPedalPosition",
            "name": "Accelerator Pedal Position",
            "hmi_level": "HMI_FULL",
            "is_parameter": true,
        },
        {
            "id": 20,
            "key": "driverBraking",
            "name": "Braking",
            "hmi_level": "HMI_BACKGROUND",
            "is_parameter": true
        },
        {
            "id": 240,
            "key": "CLIMATE",
            "name": "CLIMATE",
            "hmi_level": "HMI_BACKGROUND",
            "is_parameter": true
        },
        {
            "id": 66666,
            "key": "speed",
            "name": "Speed",
            "hmi_level": "HMI_NONE",
            "is_parameter": true
        },
    ],
    "category": {
        "id": 1,
        "name": "DEFAULT",
        "display_name": "Default"
    },
    "vendor": {
        "id": 1,
        "name": "Livio Web Team",
        "email": "admin@example.com"
    }
},
{
    "uuid": "ab9eec11-5fd1-4255-b4cd-769b529c88c4",
    "name": "idle_clicker",
    "display_names": [
        "Idle Clicker Android",
        "Idle Clicker"
    ],
    "platform": "ANDROID",
    "platform_app_id": "com.android.idle.clicker",
    "status": "PRODUCTION",
    "can_background_alert": true,
    "can_steal_focus": true,
    "tech_email": null,
    "tech_phone": null,
    "default_hmi_level": "HMI_NONE",
    "created_ts": "2017-06-12T13:34:33.514Z",
    "updated_ts": "2017-06-12T14:23:37.817Z",
    "countries": [
        {
            "id": 77,
            "iso": "GB",
            "name": "United Kingdom"
        },
        {
            "id": 233,
            "iso": "US",
            "name": "United States"
        }
    ],
    "permissions": [
        {
            "id": 25,
            "key": "airbagStatus",
            "name": "Airbag Status",
            "hmi_level": "HMI_BACKGROUND",
            "is_parameter": true
        }
    ],
    "category": {
        "id": 2,
        "name": "COMMUNICATION",
        "display_name": "Communication"
    },
    "vendor": {
        "id": 1,
        "name": "Livio Web Team",
        "email": "admin@example.com"
    }
}];

helper.storeApps.bind(null, false)(TEMP_APPS, function () {});

module.exports = {
	get: get,
	actionPost: actionPost,
	autoPost: autoPost,
	webhook: webhook,
	queryAndStoreApplicationsFlow: queryAndStoreApplicationsFlow
};
