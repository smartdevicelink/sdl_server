const settings = require('../../../settings.js');

function post (req, res, next) {
	validatePost(req, res);
	if (res.parcel.message) {
		res.parcel.deliver();
		return;
	}

	//TODO: STUB
	const response = {
		token: "12345678"
	}
	res.parcel
		.setStatus(200)
		.setData(response)
		.deliver();
}

function validatePost (req, res) {
	if (!req.body.email || !req.body.password) {
		res.parcel
			.setStatus(400)
			.setMessage("Invalid credentials");
	}
	return;
}

function validateBasicAuth (req, res) {
	if(req.body.password == settings.basicAuthPassword){
		res.parcel.setStatus(200);
	}else{
		res.parcel.setStatus(401);
	}
	res.parcel.deliver();
}

module.exports = {
	validateBasicAuth: validateBasicAuth
};