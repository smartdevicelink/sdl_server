const app = require('../app');
const async = require('async');
const config = require('../../../settings.js');
const packageJson = require('../../../package.json'); //configuration module
const requestjs = require('request');

exports.getInfo = function (req, res, next) {

	var concatPort = "";
    var protocol = "http://";
    if(config.policyServerPortSSL){
        protocol = "https://";
        if(config.policyServerPortSSL != 443){
            concatPort = ":" + config.policyServerPortSSL;
        }
    }else if(!config.policyServerPortSSL && config.policyServerPort != 80){
        concatPort = ":" + config.policyServerPort;
    }

	var data = {
		"current_version": packageJson.version,
		"latest_version": packageJson.version,
		"ssl_port": config.policyServerPortSSL,
		"cache_module": config.cacheModule,
		"auth_type": config.authType,
		"auto_approve_all_apps": config.autoApproveAllApps,
		"base_url": protocol + config.policyServerHost + concatPort
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
