let sampleApp = {
	id: 12345,
	uuid: '55555',
	name: 'test app',
	description: 'app for testing',
	display_names: [
		'test app'
	],
	category: {
		id: 1,
		name: 'NAVIGATION',
		display_name: 'Navigation',
	},
	platform: 'ANDROID',
	platform_app_id: '123',
	can_background_alert: true,
	can_steal_focus: false,
	status: 'PRODUCTION',
	approval_status: 'PENDING',
	tech_email: 'bob@bob.bob',
	tech_phone: '9999999999',
	default_hmi_level: 'NONE',
	vendor: {
		id: 1,
		name: 'Livio',
		email: 'livio@mail.com'
	},
	countries: [
		{
			iso: 'US',
			name: 'United States'
		}
	],
	permissions: [
		{
			name: 'AddCommand',
			hmi_level: 'FULL',
			type: 'RPC'
		}
	],
	icon_url: 'wat.png',
	denial_message: '',
	updated_ts: 'hmm',
	created_ts: 'hmm',
	is_auto_approved_enabled: false
}

function get (req, res, next) {
	//TODO: STUB
	//prioritize approval_status the highest, followed by
	//id, followed by uuid. Only one parameter can be acted upon in one request
	if (req.body.approval_status) {
		sampleApp.approval_status = req.body.approval_status;
	}
	else if (req.body.id) {
		sampleApp.id = req.body.id;
	}
	else if (req.body.uuid) {
		sampleApp.uuid = req.body.uuid;
	}

	res.status(200).send([sampleApp]);
}

function actionPost (req, res, next) {
	validateActionPost(req, res);
	if (res.errorMsg) {
		return res.status(400).send({ error: res.errorMsg });
	}
	sampleApp.id = req.body.id;
	sampleApp.approval_status = req.body.approval_status;
	//TODO: STUB
	res.sendStatus(200);
}

function validateActionPost (req, res) {
	if (!req.body.id || !req.body.approval_status) {
		return res.errorMsg = "Id and approval status required";
	}	
}

module.exports = {
	get: get,
	actionPost: actionPost
};
