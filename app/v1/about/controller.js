const app = require('../app');
const async = require('async');
const config = require('../../../settings.js');
const packageJson = require('../../../package.json'); //configuration module
const requestjs = require('request');

exports.getInfo = function (req, res, next) {
	var data = {
		"current_version": packageJson.version,
		"latest_version": packageJson.version,
		"ssl_port": config.policyServerPortSSL,
		"cache_module": config.cacheModule,
		"auth_type": config.authType,
		"auto_approve_all_apps": config.autoApproveAllApps,
		"base_url": app.locals.baseUrl,
		"notification": {
			"appsPendingReview": {
				"email": {
					"enabled": (
						config.smtp.host
						&& config.smtp.from
						&& ["REALTIME"].includes(config.notification.appsPendingReview.email.frequency)
						&& config.notification.appsPendingReview.email.to.split(",").length
					),
					"frequency": config.notification.appsPendingReview.email.frequency,
					"to_count": config.notification.appsPendingReview.email.to.split(",").length
				}
			}
		}
	};

	requestjs({
		"method": "GET",
		"uri": "https://raw.githubusercontent.com/smartdevicelink/sdl_server/master/package.json",
		"timeout": 5000,
		"json": true
	}, function(err, response, body){
		if(!err && response.statusCode >= 200 && response.statusCode < 300){
			// success!
			data.latest_version = body.version;
		}

		res.parcel.setStatus(200)
			.setData(data)
			.deliver();
	});
}
