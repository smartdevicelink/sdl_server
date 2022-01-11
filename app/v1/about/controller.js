const app = require('../app');
const config = require('../../../settings.js');
const packageJson = require('../../../package.json'); //configuration module
const requestjs = require('request');
const semver = require('semver');
const certificateController = require('../certificates/controller.js');

exports.getInfo = function (req, res, next) {
    var data = {
        "current_version": packageJson.version,
        "latest_version": packageJson.version,
        "is_update_available": false,
        "ssl_port": config.ssl.policyServerPort,
        "cache_module": config.cacheModule,
        "auth_type": config.authType,
        "auto_approve_all_apps": config.autoApproveAllApps,
        "encryption_required": config.autoApproveSetRPCEncryption,
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
        },
        "certificate_authority": certificateController.openSSLEnabled
    };

    // cannot use promisify: there are two returns we need
    requestjs({
        "method": "GET",
        "uri": "https://raw.githubusercontent.com/smartdevicelink/sdl_server/master/package.json",
        "timeout": 5000,
        "json": true
    }, async function (err, response, body) {
        if (!err && response.statusCode >= 200 && response.statusCode < 300) {
            // success!
            data.latest_version = body.version;
            data.is_update_available = semver.lt(data.current_version, data.latest_version);
            data.update_type = semver.diff(data.current_version, data.latest_version);
        }
        if (data.certificate_authority) {
            const isAuthorityValid = await certificateController.checkAuthorityValidity();
            data.is_authority_valid = isAuthorityValid && data.certificate_authority;
        }

        res.parcel.setStatus(200)
            .setData(data)
            .deliver();
    });
}
