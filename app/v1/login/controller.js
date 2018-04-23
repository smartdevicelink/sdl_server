const settings = require('../../../settings.js');

// validates authentication based on the server's defined authentication settings
function validateAuth (req, res) {
	if(!settings.authType
		|| (settings.authType == "basic" && req.body.password == settings.basicAuthPassword)){
		res.parcel.setStatus(200);
	}else{
		res.parcel.setStatus(401);
	}
	res.parcel.deliver();
}

module.exports = {
	validateAuth: validateAuth
};