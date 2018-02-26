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

module.exports = {
	post: post
};