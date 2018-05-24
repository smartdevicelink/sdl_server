const settings = require('../../../settings.js');

function validateAuth (req, res, next) {
	if(settings.authType == "basic" && settings.basicAuthPassword
		&& req.get("BASIC-AUTH-PASSWORD") != settings.basicAuthPassword){
		res.parcel.setStatus(401)
			.setMessage("Invalid basic authentication password")
			.deliver();
		return;
	}else{
		next();
	}
}

module.exports = {
	validateAuth: validateAuth
};